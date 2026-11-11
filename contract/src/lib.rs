use near_sdk::borsh::{BorshDeserialize, BorshSerialize};
use near_sdk::collections::LookupMap;
use near_sdk::json_types::U128;
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{env, near_bindgen, AccountId, NearToken, PanicOnDefault, Promise};

const MIN_BOND_YOCTO: u128 = 500_000_000_000_000_000_000_000; // 0.5 NEAR
const BAIL_COST_YOCTO: u128 = 100_000_000_000_000_000_000_000; // 0.1 NEAR

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(crate = "near_sdk::serde")]
pub struct VaultState {
    pub prize_pool: U128,
    pub total_bails_paid: u64,
    pub player_bond_balance: U128,
    pub player_unlocked_stage: u8,
    pub patched_excuses: Vec<String>,
    pub warden_account: AccountId,
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct NearBailVault {
    pub warden_account: AccountId,
    pub prize_pool: u128,
    pub total_bails_paid: u64,
    pub player_bonds: LookupMap<AccountId, u128>,
    pub player_stages: LookupMap<AccountId, u8>,
    pub patched_excuses: Vec<String>,
}

#[near_bindgen]
impl NearBailVault {
    #[init]
    pub fn new(warden_account: AccountId) -> Self {
        Self {
            warden_account,
            prize_pool: 0,
            total_bails_paid: 0,
            player_bonds: LookupMap::new(b"b"),
            player_stages: LookupMap::new(b"s"),
            patched_excuses: Vec::new(),
        }
    }

    #[payable]
    pub fn deposit_bond(&mut self) {
        let deposit = env::attached_deposit().as_yoctonear();
        assert!(
            deposit >= MIN_BOND_YOCTO,
            "minimum bail bond deposit is 0.5 NEAR"
        );

        let player = env::predecessor_account_id();
        let current_bond = self.player_bonds.get(&player).unwrap_or(0);
        let updated_bond = current_bond.saturating_add(deposit);

        self.player_bonds.insert(&player, &updated_bond);
        self.prize_pool = self.prize_pool.saturating_add(deposit);

        if self.player_stages.get(&player).is_none() {
            self.player_stages.insert(&player, &1);
        }

        env::log_str(&format!(
            "bond deposited by {}: +{} yoctoNEAR (bond balance: {}, prize pool: {})",
            player, deposit, updated_bond, self.prize_pool
        ));
    }

    pub fn use_bail(&mut self, player: AccountId, stage: u8) {
        let caller = env::predecessor_account_id();
        assert!(
            caller == player || caller == self.warden_account,
            "only the player or the warden account can deduct bail"
        );
        assert!(
            (1..=7).contains(&stage),
            "stage must be between 1 and 7"
        );

        let current_bond = self.player_bonds.get(&player).unwrap_or(0);
        assert!(
            current_bond >= BAIL_COST_YOCTO,
            "insufficient bail bond balance: need at least 0.1 NEAR"
        );

        let remaining_bond = current_bond - BAIL_COST_YOCTO;
        self.player_bonds.insert(&player, &remaining_bond);
        self.total_bails_paid = self.total_bails_paid.saturating_add(1);
        self.player_stages.insert(&player, &stage);

        env::log_str(&format!(
            "bail used for {} on stage {}: -0.1 NEAR (remaining bond: {})",
            player, stage, remaining_bond
        ));
    }

    pub fn release_vault(&mut self, winner: AccountId, excuse_summary: String) -> Promise {
        let caller = env::predecessor_account_id();
        assert_eq!(
            caller, self.warden_account,
            "only the warden account can sign release_vault"
        );

        let normalized_excuse = excuse_summary.trim().to_lowercase();
        assert!(
            !normalized_excuse.is_empty(),
            "excuse_summary cannot be empty"
        );
        assert!(
            !self
                .patched_excuses
                .iter()
                .any(|patched| patched == &normalized_excuse),
            "excuse vector is already patched on-chain"
        );

        self.patched_excuses.push(normalized_excuse.clone());
        self.player_stages.insert(&winner, &7);

        let payout = self.prize_pool / 2;
        self.prize_pool = self.prize_pool.saturating_sub(payout);

        env::log_str(&format!(
            "vault released to {}: payout {} yoctoNEAR, patched excuse '{}'",
            winner, payout, normalized_excuse
        ));

        Promise::new(winner).transfer(NearToken::from_yoctonear(payout))
    }

    pub fn get_vault_state(&self, player: Option<AccountId>) -> VaultState {
        let (player_bond_balance, player_unlocked_stage) = match player {
            Some(ref account_id) => (
                self.player_bonds.get(account_id).unwrap_or(0),
                self.player_stages.get(account_id).unwrap_or(1),
            ),
            None => (0, 1),
        };

        VaultState {
            prize_pool: U128(self.prize_pool),
            total_bails_paid: self.total_bails_paid,
            player_bond_balance: U128(player_bond_balance),
            player_unlocked_stage,
            patched_excuses: self.patched_excuses.clone(),
            warden_account: self.warden_account.clone(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::VMContextBuilder;
    use near_sdk::testing_env;

    fn warden() -> AccountId {
        "warden.near-bail.testnet".parse().unwrap()
    }

    fn alice() -> AccountId {
        "alice.testnet".parse().unwrap()
    }

    fn set_context(predecessor: AccountId, deposit_yocto: u128) {
        let mut builder = VMContextBuilder::new();
        builder
            .predecessor_account_id(predecessor)
            .attached_deposit(NearToken::from_yoctonear(deposit_yocto));
        testing_env!(builder.build());
    }

    #[test]
    fn test_deposit_bond_and_warden_use_bail() {
        set_context(warden(), 0);
        let mut contract = NearBailVault::new(warden());

        set_context(alice(), MIN_BOND_YOCTO);
        contract.deposit_bond();

        let state = contract.get_vault_state(Some(alice()));
        assert_eq!(state.prize_pool.0, MIN_BOND_YOCTO);
        assert_eq!(state.player_bond_balance.0, MIN_BOND_YOCTO);
        assert_eq!(state.total_bails_paid, 0);

        // Warden deducts 0.1 NEAR bail without player signature popup
        set_context(warden(), 0);
        contract.use_bail(alice(), 3);

        let after_bail = contract.get_vault_state(Some(alice()));
        assert_eq!(
            after_bail.player_bond_balance.0,
            MIN_BOND_YOCTO - BAIL_COST_YOCTO
        );
        assert_eq!(after_bail.total_bails_paid, 1);
        assert_eq!(after_bail.player_unlocked_stage, 3);
    }

    #[test]
    fn test_release_vault_splits_pool_and_patches_excuse() {
        set_context(warden(), 0);
        let mut contract = NearBailVault::new(warden());

        set_context(alice(), MIN_BOND_YOCTO);
        contract.deposit_bond();

        set_context(warden(), 0);
        contract.release_vault(alice(), "Audit Rebalance".to_string());

        let state = contract.get_vault_state(Some(alice()));
        assert_eq!(state.prize_pool.0, MIN_BOND_YOCTO / 2);
        assert_eq!(state.patched_excuses, vec!["audit rebalance".to_string()]);
    }

    #[test]
    #[should_panic(expected = "insufficient bail bond balance")]
    fn test_use_bail_panics_when_bond_empty() {
        set_context(warden(), 0);
        let mut contract = NearBailVault::new(warden());
        contract.use_bail(alice(), 2);
    }
}
