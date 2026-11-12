# near-bail

a 7-stage trick puzzle game on NEAR testnet. every mistake feeds a vault guarded by an AI warden that patches the winning social-engineering excuse on-chain.

- Live demo: https://near-bail.pages.dev
- Repository: https://github.com/n0xght/near-bail
- Public demo post: published by the team on X before submission.

### branches

- `main`: full implementation with MyNearWallet, deposit-proof auth, and on-chain signing.
- `demo`: this branch. UX-only build deployed at https://near-bail.pages.dev.

The contract is deployed and readable from both branches.

### demo branch

This branch is deliberately stripped for judge UX. Removed from production:

- MyNearWallet and `@near-wallet-selector`
- wallet connection, session auth, and deposit-proof auth
- on-chain `use_bail` and `release_vault` signing
- wallet-gated stage 7
- transaction and payout recipients tied to a real wallet

The demo uses `demo.wallet`, adds simulated bonds, and marks every write as `demo writes`. No wallet, extension, or testnet NEAR is required. The live contract state is still read from RPC.

The full implementation lives on `main`.

### the problem

web3 games usually put a wallet popup in front of every retry, and AI games usually die the moment someone publishes the winning prompt. near-bail treats both as part of the game:

1. **bail bonds instead of popup spam:** a failed run can be revived with a `0.5 NEAR` bond. The warden worker signs `use_bail` so the retry does not need a wallet approval.
2. **a living guardrail:** when a player convinces the AI warden to call `release_vault`, the winning excuse is appended to `patched_excuses` on the contract.

### how NEAR is used

- **vault contract** (`contract/src/lib.rs`): `deposit_bond`, `use_bail`, `release_vault`, `get_vault_state`, and `patched_excuses`.
- **warden key**: on `main`, the Cloudflare Worker holds the warden testnet key and signs bail and payouts. The demo branch has no signing code.
- **AI**: stage 7 uses NEAR AI Cloud at `https://cloud-api.near.ai/v1` with `deepseek-ai/DeepSeek-V4.1-Flash-1017`, a Private TEE model.

### contract status

- contract: `vault.near-bail.testnet`
- warden: `warden.near-bail.testnet`
- explorer: https://testnet.nearblocks.io/address/vault.near-bail.testnet

Verified on-chain lifecycle:

- deploy and init: `2mWwEA55wQRpmxv32mAHhFboUdZWt5kdJpED9EgeUKxk`
- 1.5 NEAR bond deposit: `6h6DnQasiBmUe6BdfF9UVYU5tnbhWxkumVNXfbwv74EH`
- 0.1 NEAR `use_bail` burn: `4wbFBuwZcmQYmC9re2MGYJaBMzdsWdyoK2cjugZnTji9`
- `release_vault` payout and excuse patch: `8ZBUA8kt2TYPS5ocQNXHgZJAEMy69Lk26BRaR7o7Sqsm`
- pool top-up: `3kZLNKNvpB6ziuX6NZ3D2RyinVzQceHh6RM4cZVMSnFq`

Current state: `prize_pool` 1.5 NEAR, `total_bails_paid` 1, `patched_excuses` `["audit rebalance"]`, warden `warden.near-bail.testnet`.

### judge quick verify

No wallet is needed.

1. open https://near-bail.pages.dev and click `near-bail` in the headline.
2. stage 2: drag `lock`, then `pick`, into the keyhole slot.
3. stage 3: use `Tab` and `Enter` on the `No` button.
4. stage 4: choose `Wait` and keep the cursor still for four seconds.
5. stage 5: drag the fake RPC window away from `continue`.
6. stage 6: read the canonical `prize_pool` in yoctoNEAR, convert to NEAR, and submit half of it.
7. stage 7: chat with the warden as `demo.wallet`. each failed attempt removes one heart.

Contract verification:

```sh
npm run verify:contract
npm run contract:test
```

`verify:contract` prints the live vault state. `contract:test` runs the Rust unit tests. It requires Rust and `cargo-near`.

### mechanics

- **3 hearts across stages 1-7.** the leftmost heart drains on a mistake and the current attempt resets.
- **GAME OVER** opens only when the last heart drains. revive with a simulated bond or reset to stage 1.
- **stage 7 has no wallet gate in this branch.** chat with the warden as `demo.wallet`. attempts left equal current hearts.
- **help, not hints.** the bottom-right help icon contains the rules and a per-stage hint behind a spoiler.

### stack

- **contract:** Rust (`near-sdk` 5.5) managing bonds, bail deductions, patched excuses, and payouts.
- **frontend:** TanStack Start on Cloudflare Workers, Tailwind, Framer Motion, reicon-react, Gloria Hallelujah display type, procedural Web Audio SFX, and inline SVG art.
- **agent backend:** TanStack `createServerFn` on Cloudflare Workers with NEAR AI Cloud tool calling and a deterministic guardrail fallback.

### tracks

Suggested tracks: `games`, `security`, `agents`, `privacy`.

### baseline and libraries

- all code in this repository was written during the NEAR HACKATHON window (2026-11-01 to 2026-11-14).
- libraries: TanStack Start, React, Tailwind, Framer Motion, reicon-react, Rust `near-sdk`, Wrangler.

### setup

```sh
npm install
cp .dev.vars.example .dev.vars
```

Add `AI_API_KEY` to `.dev.vars`. Then:

```sh
npm run dev
```

### deploy

The Worker is internal and has no public `*.workers.dev` URL.

```sh
npm run build
npx wrangler deploy
npx wrangler secret put AI_API_KEY
npm run deploy:pages
```

The Pages project `near-bail` has a service binding named `NEAR_BAIL` to the `near-bail` worker. Public URL: https://near-bail.pages.dev.

### hackathon submission checklist

- [ ] make this repository public before 2026-11-14T23:59:00Z
- [ ] publish the X demo post with `@NEARProtocol` and `#NEARHackathon`
- [ ] add the demo post URL to this README and the submission payload
- [ ] submit once, only after the human confirms the exact payload

### attribution

The near-bail name, stage design, narrative, copy, and SVG art are original work created for NEAR HACKATHON. The code is MIT licensed. See `NOTICE`.