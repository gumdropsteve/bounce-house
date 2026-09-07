# Bounce House — Launch Runbook

Work through this in order. Each phase gates the next. **Do not build Phase 3 until Phase 2 proves there's demand** — most memecoins are dead in two weeks and the program is 4–6 weeks of Rust plus an audit.

---

## Phase 0 — Before anything is public

### Separation
- [ ] Register the domain and hosting under an account not tied to your primary identity
- [ ] Use a fresh wallet for deploy and treasury, funded from an exchange, not from an existing wallet
- [ ] Do not reuse bios, avatars, or writing tics from other accounts you run
- [ ] Assume this gets traced eventually and be comfortable with that outcome anyway

### Legal read
- [ ] Talk to a crypto lawyer for one hour before real burns go live. Specific questions:
  - Does burn-for-random-NFT read as a loot box or as gambling in your jurisdictions?
  - Does the 1% royalty create any ongoing obligation?
  - What disclosure belongs on the site?
- [ ] Geoblock at the edge (Cloudflare rules). Understand this is a good-faith signal, not a shield
- [ ] Decide the entity question — personal, LLC, or foundation

### Content review
- [ ] Read the footer disclaimer as written and confirm every sentence is still true
- [ ] Remove any language implying the NFT will have value
- [ ] Confirm no claim about future features is stated as a promise

---

## Phase 1 — Ship the site (half a day)

The site is the marketing. It works with no chain at all.

- [ ] Replace `PASTE_YOUR_MINT_ADDRESS_HERE` in `index.html` (or leave it until the token exists)
- [ ] **Delete the "Reset this browser" link** in the footer
- [ ] **Add a preview notice** under the roll panel: *"Minting opens when the program ships. Rolls here are a preview and are not on-chain."* Without this the site implies minting works
- [ ] Set `og:image` — screenshot a good card, 1200×630
- [ ] Deploy: drag `index.html` onto Netlify Drop, or `vercel deploy`, or Cloudflare Pages
- [ ] Point the domain, force HTTPS
- [ ] Test on a real phone. Not devtools — an actual phone
- [ ] Check the Kids tab at 375px, 768px, 1440px, and full screen on your largest monitor

### Social
- [ ] X account, handle matching the domain
- [ ] Pin a post with the site link and a screenshot of a good pull
- [ ] Post the four CryptoPunks references as a thread — that's the content that travels in NFT circles

---

## Phase 2 — Token + read-only wallet (1–2 days)

### Launch the token
- [ ] Launch on pump.fun. **There is no pump.fun API to integrate** — it produces a standard SPL token. All you need afterward is the mint address
- [ ] Record the mint address, decimals, and supply
- [ ] Update the CA on the site, verify the copy button
- [ ] Confirm LP status matches what the site claims ("burned" in the facts row)

### Wallet connect — read only
- [ ] `@solana/wallet-adapter` + `@solana/wallet-adapter-wallets` (Phantom, Solflare, Backpack)
- [ ] RPC: Helius or QuickNode free tier
- [ ] `getParsedTokenAccountsByOwner` → BOUNCE balance
- [ ] Price feed (Jupiter or Birdeye) to convert the $5 / $100 gates
- [ ] Show tier status in the UI: *"You hold $47 of BOUNCE — slot 2 unlocked, slot 3 needs a burn"*
- [ ] Keep minting disabled. Show a live **Genesis remaining** counter instead

**Stop here and watch for two weeks.** If holders and site traffic are flat, do not spend money on Phase 3.

---

## Phase 3 — The Anchor program (4–6 weeks, or $15–40k)

### Randomness — read this first
**Do not derive outcomes from the transaction signature, block hash, or timestamp.** All three are simulatable. A searcher previews the result, sees a Common, and drops the transaction before it lands — free rerolls forever, and rarity becomes worthless.

- [ ] Use **commit-reveal** (commit in one block, resolve in a later one) or a **VRF** — ORAO or Switchboard On-Demand
- [ ] VRF is simpler and costs a fraction of a cent per roll. Budget it in
- [ ] Write an explicit test that a simulated transaction cannot reveal the outcome

### Program scope
- [ ] `burn_and_roll` — transfers BOUNCE to burn address, records amount, requests randomness
- [ ] `resolve` — computes tier from burn size via the clamped curve, assigns traits
- [ ] `mint` — creates a **Metaplex Core** asset with metadata + 1% royalty plugin
- [ ] `forge` — burns N assets of one tier, mints 1 using the forge table
- [ ] Cap counters in a PDA, **checked before mint, not after**

### Caps that must be enforced globally
- [ ] MOM ≤ 55 — checked in **both** the roll path and the 6-Epic forge path
- [ ] Blower Operator ≤ 100, Compliance Officer ≤ 250, Exit Liquidity Larry ≤ 500
- [ ] Solana shirt ≤ 100, 24×24 Shades ≤ 100, Diamond socks ≤ 100, Paper hands ≤ 500
- [ ] Deflated = 1, Alien = 9, Angel = 45, Devil = 90, Frog = 200 — **Genesis only**
- [ ] Genesis = first 10,000 mints, **including forged kids minted in that window**
- [ ] Rare skins disabled once Genesis is exhausted
- [ ] 3 mints per wallet — and decide how transfers interact with that limit

### Other program decisions to settle
- [ ] Do Forged Epics count toward the 6-Epic Mythic forge? (Open = ~15 extra MOMs. Closed = ~1)
- [ ] What happens to a slot when its NFT is sold? (Currently slots lock forever)
- [ ] Where does the 3-per-wallet cap live — mint count or holdings?

### Metadata + storage
- [ ] Decide on-chain SVG vs Arweave/IPFS. On-chain SVG is bigger but permanent and matches the "no external dependency" theme
- [ ] If off-chain: Irys/Arweave, not a server you pay for monthly
- [ ] Metadata must include Genesis, Forged, kid slot, and every trait as proper attributes so marketplaces can filter

### Audit
- [ ] Get one before real burns. Non-negotiable — this program moves user funds irreversibly
- [ ] Publish the seed and a merkle root of the Genesis pool **before** mint opens, so nobody can claim you saved the good ones

---

## Phase 4 — Marketplace + secondary (a few days)

- [ ] Verify the collection on **Magic Eden** and **Tensor** (Core assets list automatically with correct metadata)
- [ ] Confirm the 1% royalty is honoured — it's enforcement-by-allowlist, so test an actual sale
- [ ] Add a Gallery view on the site: wallet lookup, live mint feed, trait rarity browser
- [ ] Deep-link out to ME/Tensor. **Do not build an order book** — it competes with your own listings

### The three views (keep the UI simple)
One house, three lenses, one toggle:
- **My house** — your 3
- **Everyone** — live feed of recent mints across all holders
- **Look up a wallet** — paste an address, see their 3

---

## Phase 5 — Optional, only if it's working

- [ ] X post verification for a free reroll. **Requires OAuth + paid X API tier.** The URL alone is spoofable — X ignores the username segment of a status URL, so you must confirm `author_id` via the API. Store the numeric tweet ID with a unique index, never the URL string
- [ ] Never ask users to put a wallet address in a public post — that permanently links their handle to their entire on-chain history. Use an opaque single-use nonce
- [ ] "Wen" shirt pattern
- [ ] PNG export of the pull card

---

## Known open questions

| Question | Status |
|---|---|
| 100K burn costs $1,000 at a $10M mcap. Acceptable, or denominate in dollars? | **Undecided** |
| Only the 3-Common forge is self-serviceable with 3 slots. Higher forges need secondary market. Intended? | **Undecided** |
| Do slots free up when an NFT is sold? | **Undecided** |
| Forged Epics eligible for the Mythic forge? | Leaning open |

---

## Pre-launch smoke test

- [ ] Sign waiver → checkbox locks, cannot be undone
- [ ] Fill slots 1 and 2 free, confirm slot 3 refuses below 100K
- [ ] Use all 3 free rerolls on one slot, confirm the burn button takes over
- [ ] Confirm free rerolls use base odds, not the slider
- [ ] Reroll a filled slot while another sits empty
- [ ] Mint a kid, confirm the slot locks with the MINTED badge
- [ ] Forge 3 Commons, confirm 3 kids leave and 1 arrives
- [ ] Drag the burn slider to 10M, confirm Common hits 0.00% and cooldown drops ~90%
- [ ] Roll ~30 times, confirm the blower outage fires and recovers
- [ ] Kids tab at 4 screen sizes
- [ ] Right-click a kid for the easter egg
- [ ] Reload — confirm state persists, then reset and confirm it clears
