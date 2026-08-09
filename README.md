# Bounce House ($BOUNCE)

> Solana is crypto's bounce house. The floor is pumping, everybody's screaming, and someone is quietly standing next to the blower.

A memecoin and a 10,000-piece generative NFT collection built around one idea: a bounce house is a perfectly sound structure right up until the air stops, and nobody in there knows who's paying for the blower.

---

## Repo layout

```
bounce-house/
│
├── src/                      ← edit here. nothing else.
│   ├── traits.js             trait tables + SVG art · SINGLE SOURCE OF TRUTH
│   ├── app.js                state, physics, UI
│   └── index.template.html   markup + CSS
│
├── tools/
│   ├── gen.js                builds the 10,000 · proves uniqueness
│   └── sheet.js              renders the contact sheet
│
├── data/
│   ├── collection.json       generated · never hand-edit
│   └── SEED.md               seed + SHA-256 · the fairness proof
│
├── dist/
│   └── index.html            ← deploy this. never edit by hand.
│
├── docs/
│   └── contact-sheet.html    generated · pitch material
│
├── program/                  Anchor program · empty until Phase 3
│
├── build.js                  src/ → dist/index.html
├── package.json              four scripts, zero dependencies
├── README.md                 mechanics, odds, caps, decisions
├── LAUNCH.md                 the runbook
└── .gitignore
```

**Never edit `dist/index.html` by hand.** It is generated. `traits.js` is read by both the site and the generator, so the collection and the live site can never disagree — that was a real bug once.

### Commands

```bash
npm run build     # src/ -> dist/index.html
npm run gen       # -> data/collection.json + uniqueness proof
npm run sheet     # -> docs/contact-sheet.html
npm run all       # gen + sheet + build
```

No dependencies, no install step. Node for the tools, nothing for the site.

Deploy is a drag-and-drop of `dist/index.html` to Netlify Drop, Vercel, or Cloudflare Pages.

### Daily workflow

```bash
git checkout -b tweak/whatever
# edit src/
npm run all
open dist/index.html          # eyeball it
git add -A && git commit -m "..."
```

Run `npm run gen` after **any** change to `traits.js` — the collection is derived from it. If rarity counts move, update `data/SEED.md`.

---

## ⚠️ Current state: demo, not product

**Everything runs in the browser. Nothing is enforced.** All burns, caps, odds, and mints are local browser state. Anyone can open devtools and give themselves a MOM.

That's fine for launch marketing — the site is the ad. But no mechanic below is real until the Anchor program ships. See `LAUNCH.md`.

---

## The mechanics

### Rolling

Burn BOUNCE, get a kid. The amount you burn sets your odds. There is no separate "pull" and "reroll" — same action, you just pick the price each time.

- **Slots 1 and 2** — free, base odds, no burn
- **Slot 3** — requires a burn, **100,000 BOUNCE minimum**
- **3 free rerolls per slot** at base odds
- After that every reroll burns, minimum 10K

Three kids per wallet, ever. Minting locks that slot permanently.

### Burn curve

`t = clamp((log10(burn) − 5) / 2, 0, 1)` — 0 at 100K, 1 at 10M
Common weight decays `× (1−t)^1.6`; every other tier scales `× (1 + 0.30·t)^tier`

Burns below 100K give base odds (curve is clamped). 10K is a *price*, 100K is where *odds* start.

**Phase 1 — Genesis (first 10,000 minted)**

| Burn | Common | Uncommon | Rare | Epic | Legendary | MYTHIC |
|---:|---:|---:|---:|---:|---:|---:|
| 100K | 50.00% | 27.00% | 14.00% | 6.00% | 2.60% | **0.40%** |
| 1M | 20.48% | 38.55% | 22.99% | 11.33% | 5.65% | **1.00%** |
| 10M | 0.00% | 43.41% | 29.26% | 16.30% | 9.18% | **1.84%** |

**Phase 2 — Post-Genesis** (Epic −10%, Legendary −30%, Mythic −50%)

| Burn | Common | Uncommon | Rare | Epic | Legendary | MYTHIC |
|---:|---:|---:|---:|---:|---:|---:|
| 100K | 51.58% | 27.00% | 14.00% | 5.40% | 1.82% | **0.20%** |
| 10M | 0.00% | 45.84% | 30.90% | 15.50% | 6.79% | **0.97%** |

**Phase 3 — Mythic exhausted (55 minted).** Mythic weight rolls into Legendary. No MOM ever again.

### Cooldowns

Scale inversely with burn size: `base × (1 − 0.9·t)`. Max burn cuts the wait by 90%.

| Reroll # | Base wait | At 10M burn |
|---|---|---|
| 1–3 | 0s | 0s |
| 4–6 | 3s | 0.3s |
| 7–9 | 7s | 0.7s |
| 10–99 | 11s | 1.1s |
| 100+ | 100s | 10s |

Big burns buy **time and access**, not just odds. Without this, spamming 100K rolls dominates max-burning by ~21x per Mythic.

### Forging

Burn a stack of the same tier, get one back — probably better, never guaranteed.

| Forge | Common | Uncommon | Rare | Epic | Legendary | MYTHIC |
|---|---:|---:|---:|---:|---:|---:|
| **3 Commons** | 20.0% | 47.0% | 21.0% | 8.5% | 3.1% | 0.40% |
| **4 Uncommons** | 8.0% | 30.0% | 42.0% | 15.0% | 4.6% | 0.40% |
| **5 Rares** | 1.0% | 8.0% | 26.0% | 52.0% | 12.6% | 0.40% |
| **6 Epics** | 0.5% | 3.0% | 12.0% | 30.0% | 53.7% | **0.80%** |

Mythic odds never improve except on the 6-Epic forge, where they double. Worst case (everyone forges everything forever) this creates only ~15 extra MOMs while destroying ~94% of Genesis supply.

Guaranteed upgrades were rejected: a flat 3:1 ladder to Mythic would take MOM from 40 to 299.

---

## The collection

**10,000 Genesis kids. Zero duplicates.** Generated from seed `20260808`, verified by `gen.js`.

Trait space is ~2.9 billion combinations, so uniqueness is never the constraint — supply is a market decision, not a technical one.

### Structure

- **18 archetypes** — pose is the locked signature, everything else floats
- **11 skins** — 6 human + Frog, Devil, Angel, Alien, Deflated
- **8 optional attribute slots** — headwear, eyewear, face detail, neck, hands, wrists, sock quirk, shirt pattern
- Hair style (7) and hair colour (7) float freely

### Attribute count (bimodal, punk-style)

| Attributes | Count |
|---:|---:|
| 0 | **8** |
| 1 | 320 |
| 2 | 2,101 |
| 3 | 3,700 |
| 4 | 2,600 |
| 5 | 1,000 |
| 6 | 250 |
| 7 | 20 |
| 8 | **1** |

Rarity counts are dealt from a shuffled deck, not sampled probabilistically — so "9 Aliens" is a verifiable fact, not an expectation.

### Hard caps

| Thing | Limit | Notes |
|---|---:|---|
| MOM | 55 | 40 in Genesis, 15 after, then never |
| Blower Operator | 100 | |
| Compliance Officer | 250 | |
| Exit Liquidity Larry | 500 | |
| Solana shirt | 100 | |
| 24×24 Shades | 100 | |
| Diamond socks | 100 | |
| Paper hands | 500 | |
| Deflated skin | 1 | The 1-of-1 |
| Alien skin | 9 | Genesis only |
| Angel / Devil / Frog | 45 / 90 / 200 | Genesis only |

**Rare skins are Genesis-only.** After mint #10,000, only the 6 human skins appear. This is what makes every rarity claim permanently true instead of having an expiry date.

### Tags

- **Genesis** — first 10,000 minted, including kids produced by forging during that window
- **Forged** — came out of a forge rather than a roll
- **Kid slot (1/2/3)** — slot 3 is burn-gated, so kid-3s are structurally the scarcest population

---

## CryptoPunks references

Four, all numbers, nothing copied:

| Ours | Theirs |
|---|---|
| 9 Aliens | 9 Aliens |
| 8 kids with zero attributes | 8 punks with zero attributes |
| 1 kid with all 8 attributes | 1 punk with all 7 |
| "24×24 Shades" | 24×24 pixel canvas |

**CryptoPunks IP is not public domain.** The Infinite Node Foundation acquired full rights from Yuga Labs in May 2025 for ~$20M. The 2022 "full commercial rights" grant went to holders of individual punks, for their own punk. Do not copy trait artwork or trait names.

---

## Design decisions worth not relitigating

**No redemption for BOUNCE.** Rejected. Pay tokens → random outcome → redeem for tokens is a lottery, not a loot box. It also can't hold a house edge across a variable burn curve (at 10K rolls the player prints money; at 100K+ the edge is 89–100%), and a redemption floor would pin the NFT price and make every trait irrelevant.

**Mint on settle, not on every reroll.** During rerolling the kid is derived state. Minting 100 NFTs to keep 1 is rent churn and wallet clutter for no gain.

**Uncapped mint with a Genesis 10,000.** A hard cap at 10,000 would cap the holder base at 10,000 wallets. If the token gets 25k holders, a hard cap excludes 60% of them at exactly the moment the meme is spreading.

**Free mint was rejected.** Free kid 1 against a fixed supply means someone scripts wallets and takes the collection for $500–3,000 in gas. Minting requires the $5 BOUNCE hold; *playing* stays free.

---

## Brand

| | |
|---|---|
| Vinyl Red | `#F0402F` |
| Cobalt | `#1F5EF5` |
| Sunshine | `#FFC61E` |
| Turf | `#3FBF5C` |
| Grape | `#8A4FE0` |
| Ink | `#16223B` |
| Vinyl White | `#FFFDF6` |

Display type **Baloo 2 800**, body **Archivo**, data **Space Mono 700**.
Dashed stitch seams are the only divider used on the page.

Deliberately shares nothing with any other project's palette.
