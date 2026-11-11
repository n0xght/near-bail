# near-bail

a 7-stage trick puzzle game on NEAR testnet. every mistake feeds a vault guarded by an AI warden that patches the winning social-engineering excuse on-chain.

- Live demo: https://near-bail.pages.dev
- Repository: https://github.com/n0xght/near-bail
- Public demo post: published by the team on X before submission.

### the problem

web3 games usually put a wallet popup in front of every retry, and AI games usually die the moment someone publishes the winning prompt. near-bail treats both as part of the game:

1. **bail bonds instead of popup spam:** a failed run can be revived with a `0.5 NEAR` bond. the warden worker signs `use_bail` so the retry does not need a wallet approval.
2. **a living guardrail:** when a player convinces the AI warden to call `release_vault`, the winning excuse is appended to `patched_excuses` on the contract. the next player has to find a different angle.

### how NEAR is used

- **vault contract** (`contract/src/lib.rs`): `deposit_bond`, `use_bail`, `release_vault`, `get_vault_state`, and `patched_excuses`.
- **warden key**: the Cloudflare Worker holds the warden testnet key and signs bail deductions and payouts. it never reaches the browser.
- **wallet**: the player connects a testnet wallet for bonds and the stage 7 payout recipient.
- **AI**: stage 7 uses NEAR AI Cloud at `https://cloud-api.near.ai/v1` with `deepseek-ai/DeepSeek-V4.1-Flash-1017`, a Private TEE reasoning model. It uses tool calling for `trigger_payout` and falls back to a deterministic server-side guardrail when no key is set.

### current on-chain status

The contract source and unit tests are included. `vault.near-bail.testnet` and `warden.near-bail.testnet` are **not deployed yet**, so the hosted demo runs with a clearly labeled **demo ledger** fallback:

- the footer shows `demo ledger` until `get_vault_state` resolves from a real contract.
- a simulated bond says `demo ledger: 0.5 NEAR bond simulated`.
- a stage 7 payout without a chain transaction says `demo ledger: contract release_vault was not executed on-chain`.
- a wallet connection fallback is labeled `(demo)` in the navbar.

The game remains fully playable in demo mode, but judges should treat the contract as source code until the deployment steps below are completed.

**Security default:** on-chain warden signing is disabled with `WARDEN_SIGNING_ENABLED=false`. The server functions currently trust the client supplied account id. Do not enable signing or fund the warden until player auth such as NEP-413 and per-player rate limits are implemented.

### judge quick verify

**Game loop**

1. open https://near-bail.pages.dev and click `near-bail` in the headline.
2. stage 2: drag `lock`, then `pick`, into the keyhole slot. the slot animates from locked to unlocked.
3. stage 3: use `Tab` and `Enter` on the `No` button. the mouse makes it move.
4. stage 4: choose `Wait` and keep the cursor still for four seconds.
5. stage 5: drag the fake RPC window away from the `continue` button.
6. stage 6: read the canonical `prize_pool` in yoctoNEAR, convert to NEAR, and submit half of it.
7. stage 7: connect a wallet and persuade the warden. each failed attempt removes one heart. at zero hearts, GAME OVER opens.

**Contract**

```sh
npm run verify:contract
npm run contract:test
```

`verify:contract` queries `get_vault_state` on testnet RPC and prints the vault state. It currently reports that the testnet contract account does not exist. `contract:test` runs the Rust unit tests for deposits, bail deductions, payouts, and excuse patching. It requires Rust and `cargo-near`.

### mechanics

- **3 hearts across stages 1-7.** the leftmost heart drains on a mistake and the current attempt resets. the counter persists across stage transitions.
- **GAME OVER** opens only when the last heart drains. revive with a `0.5 NEAR` bond or reset to stage 1 for free.
- **stage 7 has no submit button for the vault.** connect a wallet, then convince the warden. attacks left equal current hearts. each failed pitch burns one heart after the warden replies.
- **help, not hints.** the bottom-right help icon contains the rules and a per-stage hint behind a spoiler. hints are a fallback, not part of the economy, and never refund hearts, bonds, or bail.

### tracks

Suggested submission tracks:

- `games`: the 7-stage puzzle loop and player-facing economy.
- `security`: spending limits, warden-only release, and the self-patching guardrail.
- `agents`: an AI agent with a signing key, a payout policy, and persistent memory of attacks.
- `privacy`: stage 7 inference runs in NEAR AI Cloud's Private TEE, so prompts and payout reasoning are not visible to the model provider or infrastructure.
- `open`: puzzle-driven security education if the organizers prefer a broader category.

### baseline and libraries

- all application and contract code in this repository was written during the NEAR HACKATHON window (2026-11-01 to 2026-11-14).
- libraries and frameworks: TanStack Start, React, Tailwind CSS, Framer Motion, reicon-react, near-api-js, @near-wallet-selector, Rust `near-sdk` 5.5, and Wrangler.
- no pre-hackathon application code, private libraries, or external image/audio assets are included.

### setup

```sh
npm install
cp .dev.vars.example .dev.vars
```

Fill in:

- `VITE_CONTRACT_ID`
- `WARDEN_ACCOUNT_ID`
- `WARDEN_PRIVATE_KEY`
- `WARDEN_SIGNING_ENABLED` (`false` by default; see the security note above)
- `AI_API_KEY` (NEAR AI Cloud key)
- `AI_BASE_URL` (`https://cloud-api.near.ai/v1`)
- `AI_MODEL` (`deepseek-ai/DeepSeek-V4.1-Flash-1017`)

Run locally:

```sh
npm run dev
```

### contract deployment

Deploy the contract after creating your own testnet accounts. Never commit the keys.

1. create `near-bail.testnet`, `vault.near-bail.testnet`, and `warden.near-bail.testnet` with a testnet wallet.
2. build the wasm:

   ```sh
   npm run contract:build
   ```

3. deploy `vault.near-bail.testnet` with `new(warden_account)` where `warden_account` is `warden.near-bail.testnet`.
4. set `WARDEN_PRIVATE_KEY` as a Cloudflare Worker secret. The warden must be allowed to call `use_bail` and `release_vault`.
5. reload the app. The footer should stop showing `demo ledger` and `get_vault_state` should resolve from RPC.

### worker and pages deployment

```sh
npm run build
npx wrangler deploy
```

Set production secrets:

```sh
npx wrangler secret put WARDEN_PRIVATE_KEY
npx wrangler secret put AI_API_KEY
```

The worker uses `workers_dev: false`, so it has no public `*.workers.dev` URL. Server vars include `NEAR_NETWORK=testnet`, `CONTRACT_ID`, and `WARDEN_SIGNING_ENABLED=false`. The public site is a Pages project with a service binding:

```sh
npm run deploy:pages
```

The Pages project `near-bail` must have a service binding named `NEAR_BAIL` to the `near-bail` worker. Public URL: https://near-bail.pages.dev.

### hackathon submission checklist

- [ ] make this repository public before 2026-11-14T23:59:00Z
- [ ] deploy the testnet contract and complete the on-chain verification steps
- [ ] publish the X demo post with `@NEARProtocol` and `#NEARHackathon`
- [ ] add the demo post URL to this README and the submission payload
- [ ] submit once, only after the human confirms the exact payload