# Fairness proof

The Genesis collection is deterministic. Anyone can regenerate it and confirm nothing was cherry-picked.

```
Seed:      20260808
Total:     10,000
Generator: tools/gen.js  (reads src/traits.js)
```

Reproduce:

```bash
npm run gen
```

You should get **10,000 kids, 0 duplicates**, and exactly these counts:

| | |
|---|---:|
| Deflated skin | 1 |
| Alien skin | 9 |
| Angel skin | 45 |
| Devil skin | 90 |
| Frog skin | 200 |
| Zero-attribute kids | 8 |
| All-eight-attribute kids | 1 |

**Publish the SHA-256 of `data/collection.json` before mint opens.** That is what stops anyone claiming the rare ones were held back.

```bash
shasum -a 256 data/collection.json
```

Current hash:
```
dc25f529af2d73e1ac4b84ea9e796d65946f79fb9fc9f25d8270307a41af52eb
```
