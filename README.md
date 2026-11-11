# near-bail

a trick puzzle game on NEAR testnet where every mistake feeds a self-patching AI warden's vault.

### why this exists
most web3 games use wallets just to save high scores, and most AI games die the second someone leaks the winning prompt. `near-bail` fixes both:

1. **zero-popup retries (bail bonds):** a `0.5 NEAR` bail bond revives a failed run instantly through the warden's worker key, without a wallet popup on every mistake.
2. **self-patching AI (living guardrail):** every time someone social-engineers the AI warden in stage 7, the contract records their winning excuse on-chain (`patched_excuses`). the next player has to find a new angle because the old prompt is permanently patched.

it works as a light security challenge disguised as a stickman game. each stage targets a different attack vector: client-side DOM tricks, state inspection, and adaptive prompt injection against an agent holding private keys.

### how it works
1. **3 hearts, 7 stages:** mistakes drain the leftmost heart and retry the current stage. when the counter hits zero, GAME OVER opens with revive or reset options.
2. **post bail bond:** top up `0.5 NEAR` from the GAME OVER popup to revive with a full heart counter. free reset to stage 1 is always available.
3. **7 stages of traps:** hidden words, fake error popups, moving buttons, live state audits, and a final conversation.
4. **stage 7 AI warden:** no buttons on the final stage. each failed persuasion attempt burns one heart. connect a wallet, then convince the warden to sign the release transaction using an unpatched pretext. the contract sends 50% of the accumulated pot to your wallet and patches your method for future runs.
5. **help, not hints:** the help icon explains the rules and keeps the current stage hint behind a spoiler. hints are a fallback, never a replacement for the health, bail, or vault mechanics.

### stack
- **contract:** Rust (`near-sdk-rs`) managing `deposit_bond`, gasless `use_bail` deductions, `patched_excuses` storage, and `release_vault` payouts.
- **frontend:** TanStack Start on Cloudflare Workers, Tailwind, Framer Motion, reicon-react icons, Gloria Hallelujah display type, procedural Web Audio SFX, and inline SVG bezier art with a `feTurbulence` filter. zero external image or audio files.
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