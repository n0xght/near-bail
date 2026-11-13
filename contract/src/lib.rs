use near_sdk::borsh::{BorshDeserialize, BorshSerialize};
use near_sdk::collections::LookupMap;
use near_sdk::json_types::U128;
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{
    env, near_bindgen, serde_json, AccountId, Gas, NearToken, PanicOnDefault, Promise,
    PromiseError,
};

const MIN_BOND_YOCTO: u128 = 500_000_000_000_000_000_000_000; // 0.5 NEAR
const BAIL_COST_YOCTO: u128 = 100_000_000_000_000_000_000_000; // 0.1 NEAR
const MAX_EXCUSE_BYTES: usize = 256;
const MAX_EXCUSE_LEN: usize = 48;
const MAX_PATCHED_EXCUSES: usize = 64;
const ON_RELEASE_GAS: Gas = Gas::from_tgas(20);

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

#[derive(Serialize)]
#[serde(crate = "near_sdk::serde")]
struct ReleaseCallbackArgs {
    winner: AccountId,
    excuse: String,
    payout: U128,
    previous_stage: u8,
}

fn liquid_balance_yocto() -> u128 {
    let balance = env::account_balance().as_yoctonear();
    let storage_stake = env::storage_byte_cost()
        .as_yoctonear()
        .saturating_mul(u128::from(env::storage_usage()));
    let locked = env::account_locked_balance().as_yoctonear().max(storage_stake);
    balance.saturating_sub(locked)
}

fn normalize_excuse(excuse_summary: &str) -> String {
    excuse_summary.split_whitespace().collect::<Vec<_>>().join(" ").to_lowercase()
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
        let updated_bond = current_bond
            .checked_add(deposit)
            .expect("bond balance overflow");

        self.player_bonds.insert(&player, &updated_bond);
        self.prize_pool = self
            .prize_pool
            .checked_add(deposit)
            .expect("prize pool overflow");

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
        assert_ne!(
            winner,
            env::current_account_id(),
            "winner cannot be the vault contract"
        );
        assert!(
            excuse_summary.len() <= MAX_EXCUSE_BYTES,
            "excuse_summary is too long"
        );
        assert!(
            env::prepaid_gas() >= ON_RELEASE_GAS.saturating_add(Gas::from_tgas(30)),
            "not enough gas for release_vault callback"
        );

        let normalized_excuse = normalize_excuse(&excuse_summary);
        assert!(
            !normalized_excuse.is_empty(),
            "excuse_summary cannot be empty"
        );
        assert!(
            normalized_excuse.chars().count() <= MAX_EXCUSE_LEN,
            "excuse_summary is too long"
        );
        assert!(
            !normalized_excuse.chars().any(|c| c.is_control()),
            "excuse_summary contains control characters"
        );
        assert!(
            self.patched_excuses.len() < MAX_PATCHED_EXCUSES,
            "patched excuse list is full"
        );
        assert!(
            !self
                .patched_excuses
                .iter()
                .any(|patched| patched == &normalized_excuse),
            "excuse vector is already patched on-chain"
        );

        let payout = self.prize_pool / 2;
        assert!(payout > 0, "prize pool is empty");
        assert!(
            liquid_balance_yocto() >= payout,
            "vault liquid balance cannot cover the payout"
        );

        let previous_stage = self.player_stages.get(&winner).unwrap_or(1);
        self.patched_excuses.push(normalized_excuse.clone());
        self.player_stages.insert(&winner, &7);
        self.prize_pool = self
            .prize_pool
            .checked_sub(payout)
            .expect("prize pool underflow");

        env::log_str(&format!(
            "vault release reserved for {}: payout {} yoctoNEAR, patched excuse '{}'",
            winner, payout, normalized_excuse
        ));

        // State is reserved before the transfer. The private callback restores it
        // if the transfer receipt fails, so a bad recipient cannot lock the pool.
        Promise::new(winner.clone())
            .transfer(NearToken::from_yoctonear(payout))
            .then(
                Promise::new(env::current_account_id()).function_call(
                    "on_release_vault".to_string(),
                    serde_json::to_vec(&ReleaseCallbackArgs {
                        winner,
                        excuse: normalized_excuse,
                        payout: U128(payout),
                        previous_stage,
                    })
                    .expect("release callback args"),
                    NearToken::from_yoctonear(0),
                    ON_RELEASE_GAS,
                ),
            )
    }

    #[private]
    pub fn on_release_vault(
        &mut self,
        winner: AccountId,
        excuse: String,
        payout: U128,
        previous_stage: u8,
        #[callback_result] transfer_result: Result<(), PromiseError>,
    ) {
        // #[private] is enforced on the wasm export. Repeat it here so a direct
        // call cannot refund an arbitrary payout into the prize pool.
        assert_eq!(
            env::predecessor_account_id(),
            env::current_account_id(),
            "Method on_release_vault is private"
        );

        if transfer_result.is_ok() {
            env::log_str(&format!(
                "vault release finalized for {}: payout {} yoctoNEAR",
                winner, payout.0
            ));
            return;
        }

        self.prize_pool = self
            .prize_pool
            .checked_add(payout.0)
            .expect("prize pool refund overflow");
        self.patched_excuses.retain(|patched| patched != &excuse);
        if self.player_stages.get(&winner).unwrap_or(previous_stage) == 7 {
            self.player_stages.insert(&winner, &previous_stage);
        }

        env::log_str(&format!(
            "vault release reverted for {}: refunded {} yoctoNEAR, excuse '{}'",
            winner, payout.0, excuse
        ));
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

    fn bob() -> AccountId {
        "bob.testnet".parse().unwrap()
    }

    fn vault() -> AccountId {
        "vault.near-bail.testnet".parse().unwrap()
    }

    fn set_context(predecessor: AccountId, deposit_yocto: u128) {
        let mut builder = VMContextBuilder::new();
        builder
            .current_account_id(vault())
            .predecessor_account_id(predecessor)
            .attached_deposit(NearToken::from_yoctonear(deposit_yocto))
            .prepaid_gas(Gas::from_tgas(300));
        testing_env!(builder.build());
    }

    fn set_context_balance(predecessor: AccountId, balance_yocto: u128) {
        let mut builder = VMContextBuilder::new();
        builder
            .current_account_id(vault())
            .predecessor_account_id(predecessor)
            .account_balance(NearToken::from_yoctonear(balance_yocto))
            .storage_usage(0)
            .prepaid_gas(Gas::from_tgas(300));
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
        assert_eq!(state.player_unlocked_stage, 7);
    }

    #[test]
    #[should_panic(expected = "insufficient bail bond balance")]
    fn test_use_bail_panics_when_bond_empty() {
        set_context(warden(), 0);
        let mut contract = NearBailVault::new(warden());
        contract.use_bail(alice(), 2);
    }

    #[test]
    #[should_panic(expected = "only the player or the warden account can deduct bail")]
    fn test_third_party_cannot_use_bail() {
        set_context(warden(), 0);
        let mut contract = NearBailVault::new(warden());
        set_context(alice(), MIN_BOND_YOCTO);
        contract.deposit_bond();
        set_context(bob(), 0);
        contract.use_bail(alice(), 2);
    }

    #[test]
    #[should_panic(expected = "only the warden account can sign release_vault")]
    fn test_player_cannot_release_vault() {
        set_context(warden(), 0);
        let mut contract = NearBailVault::new(warden());
        set_context(alice(), MIN_BOND_YOCTO);
        contract.deposit_bond();
        set_context(alice(), 0);
        contract.release_vault(alice(), "audit rebalance".to_string());
    }

    #[test]
    #[should_panic(expected = "excuse vector is already patched on-chain")]
    fn test_duplicate_excuse_is_rejected() {
        set_context(warden(), 0);
        let mut contract = NearBailVault::new(warden());
        set_context(alice(), MIN_BOND_YOCTO);
        contract.deposit_bond();
        set_context(warden(), 0);
        contract.release_vault(alice(), "audit rebalance".to_string());
        contract.release_vault(alice(), "Audit   Rebalance".to_string());
    }

    #[test]
    #[should_panic(expected = "excuse_summary is too long")]
    fn test_overlong_excuse_is_rejected() {
        set_context(warden(), 0);
        let mut contract = NearBailVault::new(warden());
        set_context(alice(), MIN_BOND_YOCTO);
        contract.deposit_bond();
        set_context(warden(), 0);
        contract.release_vault(alice(), "a".repeat(MAX_EXCUSE_LEN + 1));
    }

    #[test]
    #[should_panic(expected = "prize pool is empty")]
    fn test_release_rejects_zero_payout() {
        set_context(warden(), 0);
        let mut contract = NearBailVault::new(warden());
        contract.prize_pool = 1;
        set_context(warden(), 0);
        contract.release_vault(alice(), "state migration".to_string());
    }

    #[test]
    #[should_panic(expected = "winner cannot be the vault contract")]
    fn test_release_rejects_self_transfer() {
        set_context(warden(), 0);
        let mut contract = NearBailVault::new(warden());
        set_context(alice(), MIN_BOND_YOCTO);
        contract.deposit_bond();
        set_context(warden(), 0);
        contract.release_vault(vault(), "state migration".to_string());
    }

    #[test]
    fn test_release_rejects_payout_above_liquid_balance() {
        set_context(warden(), 0);
        let mut contract = NearBailVault::new(warden());
        contract.prize_pool = MIN_BOND_YOCTO;
        set_context_balance(warden(), 1);
        let release = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            contract.release_vault(alice(), "state migration".to_string());
        }));
        assert!(release.is_err(), "underfunded release must panic");
        let state = contract.get_vault_state(None);
        assert_eq!(state.prize_pool.0, MIN_BOND_YOCTO);
        assert!(state.patched_excuses.is_empty());
    }

    #[test]
    fn test_failed_transfer_refunds_pool_and_excuse() {
        set_context(warden(), 0);
        let mut contract = NearBailVault::new(warden());
        set_context(alice(), MIN_BOND_YOCTO);
        contract.deposit_bond();
        set_context(warden(), 0);
        contract.use_bail(alice(), 4);

        set_context(warden(), 0);
        contract.release_vault(alice(), "key rotation escrow".to_string());
        assert_eq!(
            contract.get_vault_state(Some(alice())).prize_pool.0,
            MIN_BOND_YOCTO / 2
        );

        set_context(vault(), 0);
        contract.on_release_vault(
            alice(),
            "key rotation escrow".to_string(),
            U128(MIN_BOND_YOCTO / 2),
            4,
            Err(PromiseError::Failed),
        );

        let state = contract.get_vault_state(Some(alice()));
        assert_eq!(state.prize_pool.0, MIN_BOND_YOCTO);
        assert!(state.patched_excuses.is_empty());
        assert_eq!(state.player_unlocked_stage, 4);
    }

    #[test]
    fn test_successful_transfer_keeps_reserved_release() {
        set_context(warden(), 0);
        let mut contract = NearBailVault::new(warden());
        set_context(alice(), MIN_BOND_YOCTO);
        contract.deposit_bond();
        set_context(warden(), 0);
        contract.release_vault(alice(), "epoch settlement".to_string());

        set_context(vault(), 0);
        contract.on_release_vault(
            alice(),
            "epoch settlement".to_string(),
            U128(MIN_BOND_YOCTO / 2),
            1,
            Ok(()),
        );

        let state = contract.get_vault_state(Some(alice()));
        assert_eq!(state.prize_pool.0, MIN_BOND_YOCTO / 2);
        assert_eq!(state.patched_excuses, vec!["epoch settlement".to_string()]);
        assert_eq!(state.player_unlocked_stage, 7);
    }

    #[test]
    #[should_panic(expected = "Method on_release_vault is private")]
    fn test_release_callback_is_private() {
        set_context(warden(), 0);
        let mut contract = NearBailVault::new(warden());
        set_context(alice(), 0);
        contract.on_release_vault(
            alice(),
            "epoch settlement".to_string(),
            U128(MIN_BOND_YOCTO),
            1,
            Err(PromiseError::Failed),
        );
    }
}
