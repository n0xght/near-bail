# near-bail

a 7-stage trick puzzle game on NEAR testnet. every mistake feeds a vault guarded by an AI warden that patches the winning social-engineering excuse on-chain.

- demo: https://near-bail.pages.dev
- full build: https://near-bail-onchain.pages.dev
- repository: https://github.com/n0xght/near-bail
- public demo post: published by the team on X before submission.

### branches and deployments

both branches share this exact README.

- `demo`: default branch. deployed to https://near-bail.pages.dev.
- `main`: full implementation. deployed to https://near-bail-onchain.pages.dev.

the contract is deployed on testnet and read from both branches.

### demo branch

the demo is deliberately stripped for judge UX:

- no wallet connector
- no deposit-proof auth or sessions
- no on-chain bail or payout signing
- no real payout recipient
- an on-demand `connect wallet` button switches the UI to `demo.wallet`

no browser extension or testnet NEAR is required. bonds are simulated and the stage 7 chat runs as `demo.wallet`. the demo includes the help menu and per-stage hints for judge UX.

the full implementation lives on `main`.

### main branch

the full build uses:

- NEAR Connect (`@hot-labs/near-connect`) for wallet connection and transaction signing
- deposit-proof auth: a verified `deposit_bond` transaction issues a one-hour session
- real `use_bail` and `release_vault` calls signed by the warden Worker
- wallet-gated stage 7
- the help menu includes how to play only; hints are removed by design

the full build requires a funded testnet wallet.

### the problem

web3 games usually put a wallet popup in front of every retry, and AI games usually die the moment someone publishes the winning prompt. near-bail treats both as part of the game:

1. **bail bonds instead of popup spam:** a failed run can be revived with a `0.5 NEAR` bond. the warden worker signs `use_bail` so the retry does not need a wallet approval.
2. **a living guardrail:** when a player convinces the AI warden to call `release_vault`, the winning excuse is appended to `patched_excuses` on the contract.

### how NEAR is used

- **vault contract** (`contract/src/lib.rs`): `deposit_bond`, `use_bail`, `release_vault`, `get_vault_state`, and `patched_excuses`.
- **warden key**: the full build's Cloudflare Worker holds the warden testnet key and signs bail and payouts.
- **wallet**: the full build uses NEAR Connect on testnet. the demo uses `demo.wallet`.
- **AI**: stage 7 uses NEAR AI Cloud at `https://cloud-api.near.ai/v1` with `deepseek-ai/DeepSeek-V4.1-Flash-1017`, a Private TEE model.

### contract status

- contract: `vault.near-bail.testnet`
- warden: `warden.near-bail.testnet`
- explorer: https://testnet.nearblocks.io/address/vault.near-bail.testnet

verified on-chain lifecycle:

- deploy and init: `2mWwEA55wQRpmxv32mAHhFboUdZWt5kdJpED9EgeUKxk`
- 1.5 NEAR bond deposit: `6h6DnQasiBmUe6BdfF9UVYU5tnbhWxkumVNXfbwv74EH`
- 0.1 NEAR `use_bail` burn: `4wbFBuwZcmQYmC9re2MGYJaBMzdsWdyoK2cjugZnTji9`
- `release_vault` payout and excuse patch: `8ZBUA8kt2TYPS5ocQNXHgZJAEMy69Lk26BRaR7o7Sqsm`
- pool top-up: `3kZLNKNvpB6ziuX6NZ3D2RyinVzQceHh6RM4cZVMSnFq`

current state: `prize_pool` 1.5 NEAR, `total_bails_paid` 1, `patched_excuses` `["audit rebalance"]`, warden `warden.near-bail.testnet`.

### judge quick verify

demo, no wallet needed:

1. open https://near-bail.pages.dev and click `near-bail` in the headline.
2. click `connect wallet` when ready. it switches to `demo.wallet` without a popup.
3. stage 2: drag `lock`, then `pick`, into the keyhole slot.
4. stage 3: use `Tab` and `Enter` on `No`.
5. stage 4: choose `Wait` and keep the cursor still for four seconds.
6. stage 5: drag the fake RPC window away from `continue`.
7. stage 6: read the canonical `prize_pool` in yoctoNEAR, convert to NEAR, and submit half of it.
8. stage 7: chat with the warden. each failed attempt removes one heart.

full build:

1. open https://near-bail-onchain.pages.dev.
2. connect a testnet wallet with NEAR Connect.
3. deposit 0.5 NEAR to create a bond and authorize the session.
4. burn a bail and complete stage 7 to see real testnet transactions.

contract:

```sh
npm run verify:contract
npm run contract:test
```

`verify:contract` prints the live vault state. `contract:test` runs the Rust tests. it requires Rust and `cargo-near`.

### mechanics

- **3 hearts across stages 1-7.** the leftmost heart drains on a mistake and the current attempt resets.
- **game over** opens only when the last heart drains. revive with a bond or reset to stage 1.
- **stage 7** has no buttons. attempts left equal current hearts. each failed pitch burns one heart after the warden replies.
- **help menus.** the demo help menu contains how to play and spoiler-gated per-stage hints. the main on-chain help menu contains how to play only; hints are removed by design.

### tracks

suggested tracks: `games`, `security`, `agents`, `privacy`.

### baseline and libraries

- all code in this repository was written during the NEAR HACKATHON window (2026-11-01 to 2026-11-14).
- libraries: TanStack Start, React, Tailwind, Framer Motion, reicon-react, NEAR Connect, near-api-js, Rust `near-sdk` 5.5, Wrangler.

### setup

```sh
npm install
cp .dev.vars.example .dev.vars
```

demo branch: add `AI_API_KEY` only.

main branch: add `AI_API_KEY`, `WARDEN_PRIVATE_KEY`, and `AUTH_SECRET`.

run locally:

```sh
npm run dev
```

### deployment

- demo Worker: `near-bail`, Pages project `near-bail`, production branch `demo`
- main Worker: `near-bail-onchain`, Pages project `near-bail-onchain`, production branch `main`

both Pages projects use a service binding named `NEAR_BAIL` to their worker.

```sh
npm run build
npx wrangler deploy
npm run deploy:pages
```

### attribution

the near-bail name, stage design, narrative, copy, and SVG art are original work created for NEAR HACKATHON. the code is MIT licensed. see `NOTICE`.