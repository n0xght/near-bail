# near-bail

a trick puzzle game on NEAR testnet where every mistake feeds a self-patching AI warden's vault.

### why this exists
most web3 games use wallets just to save high scores, and most AI games die the second someone leaks the winning prompt. `near-bail` fixes both:

1. **zero-popup retries (bail bonds):** instead of approving a wallet popup every time you die, you post a `0.5 NEAR` bail bond upfront. each fail burns `0.1 NEAR` from your bond instantaneously via the warden's worker key.
2. **self-patching AI (living guardrail):** every time someone social-engineers the AI warden in stage 7, the contract records their winning excuse on-chain (`patched_excuses`). the next player has to find a new angle because the old prompt is permanently patched.

it works as a light security challenge disguised as a stickman game. each stage targets a different attack vector: client-side dom tricks, state inspection, and adaptive prompt injection against an agent holding private keys.

### how it works
1. **post bail bond:** deposit `0.5 NEAR` into `vault.near-bail.testnet` for 5 instant retries, or raw-dog it on free mode (any mistake resets you to stage 1).
2. **7 stages of traps:** hidden click targets, fake error popups, moving buttons.
3. **stage 7 AI warden:** no buttons on the final stage. talk to the AI warden holding the vault keys. convince it to sign the release transaction using an unpatched pretext, and the contract sends 50% of the accumulated pot to your wallet while patching your method for future runs.

### stack
- **contract:** Rust (`near-sdk-rs`) managing `deposit_bond`, gasless `use_bail` deductions, `patched_excuses` storage, and `release_vault` payouts.
- **frontend:** TanStack Start on Cloudflare Workers, Tailwind, Framer Motion, and inline SVG bezier paths with a `feTurbulence` filter. zero external image files.
- **agent backend:** TanStack `createServerFn` running on Cloudflare Workers (`nodejs_compat`) with tool-calling wired to `near-api-js` for instant bail deductions and on-chain payouts.

### setup & deploy
1. install dependencies: `npm install`
2. copy `.dev.vars.example` to `.dev.vars` and add:
   - `VITE_CONTRACT_ID`
   - `WARDEN_ACCOUNT_ID`
   - `WARDEN_PRIVATE_KEY`
   - `AI_API_KEY`
3. local dev: `npm run dev`
4. deploy to cloudflare workers: `npm run build && npx wrangler deploy`
