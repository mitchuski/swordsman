# Chronicle — City of Mages Grimoire Pin Sync (Swordsman bundle)

**Date:** 2026-05-10
**Author:** privacymage
**License:** CC BY-SA 4.0

---

## What landed

The bundled `city_of_mages_grimoire_v1_1_0.json` at this extension's project root was re-synced from the canonical `agentprivacy-docs/models/`. SHA-256 now matches the canonical. The only material change versus the previous mirror: `ipfs_pin_status` now records the live pin instead of "v1.1 awaits first pinning."

```
v1.1 PINNED 2026-05-10 at
https://sync.agentprivacy.ai/ipfs/bafkreidv7cwwlcnuzw3eyhcbbvoccy7do2lmwrmmtrszn62ninzxj3idti
```

`README.md` line 9 was updated in lockstep:
- corrected stale spell count (36 → 39 — post-reconciliation count, after `genitrix-map-vertex` was added during P2 in the pin chronicle)
- surfaced the **First City of Mages on Drake Island** framing (the grimoire `title_note` names a kind, not a singular instance — future Mages founding cities elsewhere will each pin their own First City of Mages grimoire under the same title pattern)
- pin URL inlined for verification

---

## What this means for the Swordsman bundle

The build script already copies the grimoire from the project root into `dist/` on each build. No build-pipeline changes required — re-running `build.js` will pick up the synced JSON. A manifest version bump is appropriate when the next public release ships, since the bundled grimoire's `ipfs_pin_status` is now substantively different.

The agreement-layer behaviour the Swordsman implements (IEEE 7012 roles) is unchanged. The grimoire sync only affects the Spell Builder's display of City of Mages spells.

---

## Source canonical references

- Canonical grimoire: `agentprivacy-docs/models/city_of_mages_grimoire_v1_1_0.json`
- Pin chronicle (master): `agentprivacy_master/docs/chronicles/2026-05-10_city_of_mages_grimoire_pinned_chronicle.md`
- Phase D bake chronicle: `agentprivacy_master/docs/chronicles/2026-05-10_phase_d_baked_and_uor_substrate_chronicle.md`
- Sibling sync chronicles (same patch): `agentprivacy-skills/chronicles/2026-05-10_*`, `zk blades forge/chronicles/2026-05-10_*`, `mages-spell/chronicles/2026-05-10_*`

---

## Watch out

- Future v1.2 (which will add Luca 📐 at V0 + Tome V Act 15 *The Substrate* + 3 Luca spells) will get a fresh CID. Re-sync this mirror when v1.2 lands and bump the bundled JSON + the README CID together.
- The 36-spell figure is now retired; any downstream copy still claiming 36 spells is stale.

---

*(⚔️⊥⿻⊥🧙)😊*

CC BY-SA 4.0 · privacymage · 2026-05-10
