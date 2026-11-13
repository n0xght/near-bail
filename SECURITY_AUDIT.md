# Security audit: near-bail

Branch: `cursor/security-audit-fixes-43fd` (based on `demo`)

This pass covered the demo tree that is checked out here (contract, game UI, demo warden, worker header, scripts, config) and a read of `origin/main`, where the hot-wallet signer lives. No mainnet calls, no deploys, no key material printed. `.dev.vars.example` contains placeholders only. No committed secret was found.

The live testnet contract `vault.near-bail.testnet` was not upgraded. The contract fixes below take effect only after an upgrade. The state struct is unchanged, so an upgrade can keep existing state.

## Summary

`release_vault` paid half the prize pool by editing state and returning a transfer promise, with no private callback. A failed transfer (missing account, not enough liquid NEAR) kept the excuse consumed and the pool reduced, which locks that NEAR in the contract. Excuse text was unbounded, so a warden call could also grow state until the account is stuck paying storage. On the demo warden, client-supplied patch text was copied into the system prompt, a jailbreak that convinced the model still counted as a win, and several NEAR conversions rounded or truncated the amounts the game treats as canonical.

## Security findings

| Severity | Location | Issue | Status |
| --- | --- | --- | --- |
| High | `contract/src/lib.rs` `release_vault` (~133) and `on_release_vault` (~219) | State (pool, excuse, stage) was committed before the transfer promise resolved. There was no callback and no `#[private]` guard. A failed transfer left the prize pool short and the excuse burned, with no refund path. | Fixed. Pool is reserved, then a private callback restores pool, excuse, and stage when the transfer fails. |
| Medium | `contract/src/lib.rs` ~12–13, ~144–168 | `excuse_summary` had no length cap and `patched_excuses` could grow without limit. Storage is paid from the contract balance, so a huge excuse can lock the vault. Extra whitespace (`audit   rebalance`) also bypassed the duplicate check. | Fixed. 256-byte raw cap, 48-char normalized cap, 64-entry cap, whitespace collapsed, control characters rejected. |
| Medium | `contract/src/lib.rs` ~139–176 | A zero payout (empty or 1 yocto pool) builds a 0-token transfer. Paying the vault account itself debits `prize_pool` without the NEAR leaving. A payout larger than liquid balance fails after the books have already changed. | Fixed. Those cases panic before any write. |
| Medium | `app/server/warden.ts` ~53, ~301, ~419 | Patched-excuse strings from the client were interpolated into the system prompt (newlines and instructions included). A model tool call was accepted without the jailbreak check the fallback path already had. | Fixed on this branch. Client text is reduced to short lowercase labels. Jailbreaks do not release. |
| Medium | `app/server/warden.ts` ~489 | If the testnet view failed, the demo warden still paid from the client-supplied patch list, so a patched excuse could be reused. | Fixed. No release unless the contract view returns. |
| High | `origin/main` `app/server/warden.ts` ~451, ~570, ~629 | Same prompt injection, and the worker then signs a real `release_vault` with `WARDEN_PRIVATE_KEY`. The model `winner` argument is ignored (good); the excuse and the decision are not. `main` already refuses to pay when the chain view fails (~437). | Not changed. This branch is `demo`, which does not contain the signer. Port the demo guardrail checks before the next main deploy. |
| Medium | `origin/main` `app/lib/deposit-auth.ts` ~136–148 | A deposit session is accepted on `SuccessReceiptId` as well as `SuccessValue`, and receipt outcomes are not checked for `Failure`. One successful `deposit_bond` can also be reused to mint later sessions. | Not changed. `main` only. Prefer `SuccessValue` plus no failed receipts. Re-minting a session from the same deposit is a product choice; note it. |
| Low | `contract/src/lib.rs` `new` | `warden_account` cannot be rotated. A leaked warden key can keep calling `release_vault` until the pool is gone. | Not changed. Needs an explicit rotation method and a key ceremony; out of scope for a minimal patch. |
| Info | contract balance | A plain NEAR transfer to the contract (no `deposit_bond`) is not added to `prize_pool` and cannot be withdrawn. | Not changed. NEAR has no hook to reject a plain transfer. |
| Info | `use_bail` | The 0.1 NEAR "burn" reduces the player's bond credit only. The NEAR was already added to `prize_pool` at deposit, which matches "mistakes feed the vault". | Not changed. |
| Info | repo secrets | No private keys in git. `.dev.vars.example` is placeholders. `.gitignore` ignores `.dev.vars`, `.env`, and `near-bail-keys.json`. | No change. |

## Bugs

| Severity | Location | Issue | Status |
| --- | --- | --- | --- |
| Medium | `app/lib/near.ts` `yoctoToNearString` (~75), was also `origin/main` `app/lib/near.ts` ~180 | Conversion kept only 4 decimal places and truncated. 1 yocto displayed as `0.0`. Stage 6 then rebuilt yocto from that string, so the "canonical" pool was not the chain value. | Fixed on this branch. Full 24-digit fraction, trailing zeros trimmed. Still open on `main`. |
| Medium | `app/server/warden.ts` payout formatting, was ~484; `origin/main` ~649 | `(pool / 2).toFixed(2).replace(/\.?0+$/, '')` turns `10.00` into `1` because the optional dot lets the regex eat the integer zeros. Half of 20 NEAR was shown as 1.0 NEAR. | Fixed. Half is integer yocto division, same as the contract. Still open on `main`. |
| Medium | `app/routes/index.tsx` stage 6 (~365) | `if (!guessYocto \|\| ...)` treats a correct guess of `0` as missing, because `0n` is falsy. | Fixed. `isCorrectPayoutGuess` compares bigints, including zero. |
| Medium | `app/routes/index.tsx` bail top-up and burn; `BottomStatusBar`; `FailModal` | `parseFloat` and `toFixed(1)` round a 0.05 remainder back to 0.1, and retry count used `bond / 0.1` in binary float. | Fixed. Bond math and the 0.1 NEAR bail check use yocto integers. |
| Low | `app/routes/index.tsx` mount effect (~132) | A late RPC response overwrote a local demo top-up. A pool that `parseFloat` saw as 0 (or a real 0) was ignored, leaving the 1.5 placeholder. | Fixed. RPC applies only if the player has not edited amounts, and a successful read replaces the placeholder even at zero. |
| Low | `app/routes/index.tsx` stage 6 cached snapshot | `parseFloat(vault) + 0.5` then `toFixed(1)` could collapse the stale and canonical snapshots for non-decimal-friendly amounts. The input placeholder was hardcoded `0.75`. | Fixed. Stale snapshot is canonical yocto plus exactly 0.5 NEAR. Placeholder no longer gives the old answer. |
| Low | `app/components/HelpButton.tsx` | Help said a 0.5 NEAR revive restores hearts. The bond deposit is 0.5 NEAR; each revive burns 0.1 NEAR. | Fixed. |
| Low | `app/routes/index.tsx` chat and bail handlers | A thrown server call left the composer spinning with no warden reply, or cleared the burning flag without saying the bond was untouched. | Fixed. Both paths catch and leave balances unchanged. |
| Low | `README.md` judge verify; `contract/Cargo.lock` | The README said `npm run contract:test` needs `cargo-near`. It does not. The lockfile requires Rust 1.93 (`near-sys` 0.2.14). Rust 1.83 and 1.85 cannot build it. | Fixed. `contract/rust-toolchain.toml` pins 1.93.0. `cargo-near` is documented only for `contract:build`. |
| Info | `contract/src/lib.rs` `get_vault_state` | An unknown player is reported as stage 1, not "no record". | Not changed. Callers already treat 1 as the start. |

## What changed

- Contract: reserve the release, require enough gas and liquid balance, reject empty, self, overlong, and duplicate excuses, and refund in `on_release_vault` only when the predecessor is the vault. `#[private]` stays on the wasm export; the same check is in the method so unit tests cover it.
- Demo warden: sanitize prompt inputs, reject jailbreaks before a simulated release, refuse release when the chain view fails or the half-pool rounds to zero.
- Game math: exact yocto formatting, stage 6 grading, bond add/sub, retry count, and help copy.
- Tests: `contract` unit tests, `app/lib/near.test.ts`, `app/lib/guardrail.test.ts` (`npm run test:unit`).
- No deploy, no key changes, no mainnet transactions, no pull request.

## How to verify

```sh
npm run test:unit
npm run typecheck
npm run contract:test
```

`contract:test` needs Rust 1.93+ (rustup reads `contract/rust-toolchain.toml`). This run: 13 contract tests passed on Rust 1.93.0, 12 node tests passed, `tsc --noEmit` passed.

The interactive game was not clicked through in a browser. Stage 6 grading, bond math, and the payout formatter are covered by the node tests.

## Draft pull request

Title: `Fix vault release refunds, excuse limits, and NEAR amount bugs`

Body:

```md
## Summary

Security and functional fixes for the demo branch of near-bail. `release_vault` no longer keeps a burned excuse and a reduced prize pool when the NEAR transfer fails. Excuse text is bounded. The demo warden no longer trusts raw client text in its prompt or treats a jailbreak as a win. Stage 6 and the bond UI use full yocto precision.

The testnet contract was not upgraded. These contract changes do nothing on `vault.near-bail.testnet` until that upgrade. `origin/main` still has the hot-wallet signer; the same guardrail gaps there can sign a real `release_vault` and are called out below as follow-up, not edited on this branch.

## Findings

| Severity | Where | What |
| --- | --- | --- |
| High | `contract/src/lib.rs` `release_vault` | State committed before the transfer, no refund callback. Failed transfers lock NEAR. |
| Medium | `contract/src/lib.rs` excuse handling | Unbounded excuses and whitespace duplicates can bloat or bypass `patched_excuses`. |
| Medium | `contract/src/lib.rs` `release_vault` | Zero payout, self-transfer, and payouts above liquid balance. |
| Medium | `app/server/warden.ts` | Client patch text in the system prompt; jailbreak tool calls still released; chain view failure failed open. |
| High (not in this branch) | `origin/main` `app/server/warden.ts` ~451, ~570, ~629 | Same model trust, but the worker signs with the warden key. |
| Medium (not in this branch) | `origin/main` `app/lib/deposit-auth.ts` ~136 | `SuccessReceiptId` counts as a verified deposit; receipt failures are not checked. |

## Bugs

| Where | What |
| --- | --- |
| `app/lib/near.ts` | 4-decimal yocto truncation, so the canonical pool and stage 6 answer drifted from the chain. |
| `app/server/warden.ts` | Half of 20 NEAR formatted as 1.0 NEAR (`10.00` regex). |
| `app/routes/index.tsx` | A guess of 0 was rejected; bond math used floats; RPC could clobber a local top-up. |
| `app/components/HelpButton.tsx` | Help described a 0.5 NEAR revive. Revive burns 0.1 from a 0.5 bond. |
| README / toolchain | `contract:test` does not need `cargo-near`. The lockfile needs Rust 1.93, not 1.83. |

## What changed

- Private `on_release_vault` refunds the reserved payout, excuse, and stage when the transfer promise fails.
- Caps and normalization on new excuses. Reject empty pools, self-payouts, and payouts the liquid balance cannot cover.
- Demo warden sanitizes prompt fields, applies the jailbreak list to model tool calls, and will not release if the vault view is down or the payout is zero.
- Exact yocto helpers for display, stage 6, bail retries, and bond updates.
- Unit tests for the refund, the private callback, excuse limits, yocto round-trip, the 10 NEAR format bug, and a zero stage-6 guess.

## How to verify

```sh
npm run test:unit
npm run typecheck
npm run contract:test
```

No deploy and no mainnet transactions in this branch.
```
