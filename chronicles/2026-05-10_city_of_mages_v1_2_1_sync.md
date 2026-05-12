# Chronicle — City of Mages Grimoire v1.2.1 Sync (Swordsman bundle)

**Date:** 2026-05-10 (supersedes v1.1 sync chronicle in this folder)
**Author:** privacymage
**License:** CC BY-SA 4.0

---

## What landed

The bundled grimoire was renamed and updated:

- File: `city_of_mages_grimoire_v1_1_0.json` → `city_of_mages_grimoire_v1_2_0.json` (file content is v1.2.1)
- `build.js` line 62 — filename bumped in the `grimoires` array
- `manifest.json` — `web_accessible_resources` filename bumped; **extension version 0.2.0 → 0.3.0**; description updated to reflect 14 cast + Luca 📐 + UOR Foundation as kindred substrate
- `README.md` — bundled-grimoires line: 14 named cast across 5 tiers, 42 spells, Luca 📐 at V0, UOR Foundation as kindred substrate, two CIDs (v1.2 live + v1.1 historical)

Material grimoire changes versus v1.1:

- **Luca 📐** added as the geometry-Mage at V0 (Pacioli-spirit; introduced in Tome V Act 15 *The Substrate Beneath the Hitchhikers*); 3 Luca spells
- **UOR Foundation** recognised as kindred substrate provider — new structural category; not a persona, separate top-level entry
- 39 → 42 spells; 13 → 14 named cast
- v1.2 base pinned at `bafkreidxhmuykjew6dtnuprggtd2rapwm43ghtmfhf2occ2wfk2zpx2b6a`; v1.2.1 awaits a fresh re-pin

---

## What this means for the Swordsman extension

The build script will copy the new bundled grimoire into `dist/` on next build. The IEEE 7012 agreement-layer behaviour is unaffected — the grimoire change only affects the Spell Builder's display of City of Mages spells (which now include Luca's three substrate spells). The manifest version bump (0.2.0 → 0.3.0) signals a shipping-ready release that includes the new bundled content.

Both the Swordsman and Mage extensions ship the same City of Mages grimoire — keep them in sync. When v1.2.1 is re-pinned and the Mage bundle bumps, the Swordsman bundle should bump in lockstep (both already at v1.2 file content; both tracking v1.2.1).

---

## Source canonical references

- Canonical grimoire: `agentprivacy-docs/models/city_of_mages_grimoire_v1_2_0.json` (v1.2.1 content)
- Master pin/Luca-amendment chronicle: `agentprivacy_master/docs/chronicles/2026-05-10_city_of_mages_v1_2_1_luca_authored.md`
- v1.1 pin chronicle (sibling): `2026-05-10_city_of_mages_grimoire_pin_sync.md`

---

*(⚔️⊥⿻⊥🧙)😊*

CC BY-SA 4.0 · privacymage · 2026-05-10
