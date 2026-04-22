# Swordsman — Privacy Blade

**Chrome Manifest V3 browser extension implementing the IEEE 7012-2025 agreement layer.**

The Swordsman is the First Person's agent on every page: it presents terms, negotiates within the standard's constraints, records the bilateral agreement, and submits disputes to auditors. It is the **agreement layer**, not the full privacy stack — enforcement and delegation sit in adjacent layers.

Paired with:

- [mitchuski/mage](https://github.com/mitchuski/mage) — the delegation layer that operates inside the Σ-scope of agreements the Swordsman signs.
- [mitchuski/myterms](https://github.com/mitchuski/myterms) — the MyTerms Alliance application docs package. The canonical framing for everything here lives there.

---

## What the Swordsman is

Per IEEE Std 7012™-2025 (approved 4 November 2025; published 20 January 2026), the Swordsman implements these roles:

| IEEE 7012 role | Swordsman implementation |
|---|---|
| **Individual's Agent** (§5.2.1) | The extension itself — runs on every page as content script + service worker. |
| **Agreement-Chooser** (§5.2.1.2) | MyTerms configuration UI in the popup. First Person selects preferred `SD-BASE-*` / `PDC-*` defaults. |
| **Proposer** (§5.2.1.3) | Automatic terms presentation to the Entity agent on page visit. |
| **Recorder** (§5.2.4) | Bilateral chronicle. First Person and Entity hold identical immutable copies; audit trail shared only by explicit act. |
| **Auditor function** (§5.2.5) | Dispute-submission pipeline for agreements in breach. |

## What the Swordsman is *not*

- **Not the enforcement layer.** Blocking trackers, shielding data flows, and Γ-aware inference control are concerns that sit above and below the agreement. A signed `SD-BASE` can still be violated without cryptographic backing; the Swordsman's enforcement is best-effort browser-side, not a substitute for ZK / TEE guarantees.
- **Not a wallet or identity system.** It signs agreements on behalf of the First Person, not transactions or credentials.
- **Not a multi-turn negotiator.** §A.1 of the standard caps negotiation at one round (accept / one counter-offer / decline). The Swordsman honors that cap.
- **Not a minter of agreement IDs.** Agreement IDs (`SD-BASE` through `SD-BASE-ATP-S3P`, `PDC-INTENT`, `PDC-AI`, `PDC-GOOD`) are consumed from the Customer Commons registry, not invented locally.

## Architecture position — PVM V5.4

The Swordsman maps primarily to the **Σ (agent separation) axis** of the Privacy Value Model V5.4:

| Axis | Symbol | Swordsman contribution |
|---|---|---|
| Agent | Σ | Defines and honors the role boundary between person-agent and entity-agent; makes separation testable via the agreement artifact. |
| Data | Δ | Chooses coarse-grained policy via `SD-BASE-*` / `PDC-*` agreement lattice. |
| Inference | Γ | Out of scope for the Swordsman. The Mage carries Γ-awareness inside the agreement envelope. |

IEEE 7012 compliance is a **precondition** for measurable Σ — not a substitute for the Swordsman/Mage separation. A single-agent monolith can be standard-compliant and still score Σ ≈ 0.

---

## Install & build

```bash
git clone https://github.com/mitchuski/swordsman.git
cd swordsman
npm install
npm run build       # esbuild via build.js → produces dist/
npm run typecheck   # tsc --noEmit
```

Load into Chrome:

1. Open `chrome://extensions`
2. Toggle **Developer mode** on
3. Click **Load unpacked**
4. Select this directory (the one with `manifest.json`)

The extension appears as **Swordsman - Privacy Blade** and runs on `<all_urls>` at `document_idle`.

---

## Repository layout

```
manifest.json               Chrome MV3 manifest
package.json                npm scripts + esbuild deps
build.js                    esbuild bundler
tsconfig.json               TypeScript config

src/
  background/index.ts       Service worker: chronicle, key derivation,
                            message routing, sticker repertoire sync
  content/
    index.ts                Page-level entry: evoke, cursor, orb renderer
    blade-forge.ts          Blade-generation logic (64-blade lattice)
    ceremony-channel.ts     Σ-boundary negotiation channel (one round)
    cursor-overlay.ts       Visual cursor-state feedback (⚔️ / ⚔️✍️ / ⚔️⚠️)
    evoke.ts                Canonical-act invocation
    orb-renderer.ts         Sword Orb rendering (sticker hex)
    page-analyzer.ts        Tracker classification + resource inventory
    repertoire-sync.ts      Sticker loadout synchronization
    spring-physics.ts       Orb physics
  lib/
    uor.ts                  6D sovereignty lattice (Z/(2⁶)Z)
    stance-definitions.ts   64 stance lattice
    effect-presets.ts       Visual effect templates
    posture-sync.ts         Posture broadcast to Mage

shared/                     Types shared with the Mage extension
  types/                    blade, ceremony, channel, effects,
                            repertoire, spell

styles/content.css          Overlay + cursor CSS

icons/                      Extension icons (SVG, 16/48/128)

privacymage_grimoire_v10_*.json   Unified spellbook data

docs & design:
  swordsman-extension-myterms-design.md
  DUAL_EXTENSION_ARCHITECTURE.md
  INTERFACE_CONTRACT.md
  CONTROL_SCHEME*.md / DUAL_CONTROL_SCHEME.md
  QUICKSTART.md
  AGENT_BUILD_INSTRUCTIONS_SWORDSMAN.md
  ieee7012_integration_plan_v2.md    (current canonical plan)
  CHRONICLE_MYTERMS_V2_ALIGNMENT_2026-04-22.md
  64_blades_reference_sheet_2426.md
  TheCelestialDualCeremony☀️⊥🌙.md
  the-ceremonies_sun-and-moon_pm.md
  CHRONICLE_DRAGONS_ANATOMY_AND_FLIGHT.md
  PLAN_EDGES_TO_FILL_2026-03-31.md
  REVIEW_UOR_CONVERGENCE_GAPS_2026-03-31.md
```

---

## Interaction with the Mage

The Mage (separate extension at [mitchuski/mage](https://github.com/mitchuski/mage)) operates **inside** the Σ-scope of agreements the Swordsman signs. The two extensions communicate via:

- **Shared repertoire** — active sticker loadout (`agentprivacy:active-hex-spells` in `localStorage`, broadcast via `agentprivacy:hex-spells-changed` CustomEvent).
- **Posture sync** (`src/lib/posture-sync.ts`) — Swordsman informs the Mage of the current cursor state / signed agreement so the Mage's operational posture stays coherent.
- **Shared key derivation** — a Web Crypto `CryptoKey` derived via `crypto.subtle.deriveKey` for proverb-level encryption between the two agents.

The Mage never signs agreements. Per §5.4.3, a contract has exactly two named parties (First Person + Entity). The Mage is not a third party — it is a delegation of the First Person, constrained by what the Swordsman has agreed to.

## The Aether — full shared-substrate spec

For the complete contract between the two extensions — message types, storage keys, crypto key derivation, numeric thresholds, and the conceptual boundaries — see [`AETHER.md`](./AETHER.md). This file is **identical** in the Swordsman and Mage repositories; if the two copies drift, the contract is broken. Keep them in sync.

---

## Canonical framing (must match mitchuski/myterms)

- **Plan:** `ieee7012_integration_plan_v2.md` (April 22, 2026). Supersedes the February v1.
- **PVM:** V5.4 — three-axis multiplicative gating `Φ_v5 = Φ_agent(Σ) · Φ_data(Δ) · Φ_inference(Γ)`.
- **Inscription:** `⚔️📜✍️🔐` (four glyphs — blade, scroll, signature, lock). The decorative `✨` from earlier versions is retired.
- **Working group:** Doc Searls (Chair), Justin Byrd (Vice Chair), Mary Hodder (Editor), Scott Mace (Secretary). Neutral host: Customer Commons.
- **Defensible headline claim:**

  > IEEE 7012-2025 provides the agreement layer agentprivacy's dual-agent architecture requires. Compliance with the standard is a precondition for the Σ (agent) axis being measurable, and enables bilateral chronicles that can serve as evidentiary basis for VRCs. Standard compliance alone is not equivalent to the full agentprivacy architecture; the standard specifies agreement, not enforcement.

See `CHRONICLE_MYTERMS_V2_ALIGNMENT_2026-04-22.md` in this repository for the alignment checklist this extension is tracked against.

---

## Known alignment gaps

Tracked against the V2 plan (see the chronicle for the full list):

- [ ] `privacymage_grimoire_v10_*.json` — add top-level `standards.ieee_7012_2025` block per plan §2.1.
- [ ] `swordsman-extension-myterms-design.md` — add section noting IEEE 7012 compliance alone leaves Σ ≈ 0 without Swordsman/Mage separation.
- [ ] Create `IEEE_7012_BRIDGE.md` (short technical mapping doc per plan §2.3).
- [ ] Create `IEEE_7012_AGREEMENT_REGISTRY_MIRROR.md` (non-authoritative mirror of agreement IDs with Customer Commons URLs).
- [ ] Reframe remaining "foundational infrastructure" language to "agreement layer."
- [ ] Ground the 7-stance / 8-spell naming in actual Customer Commons registry IDs instead of local invention.

---

## Copyright and attribution

When any document in this repository references IEEE Std 7012™-2025:

- **Paraphrase** all definitions and specifications. Do not quote more than a few words at a stretch.
- **Do not reproduce** Figure A.1 (the sequence diagram). Link to IEEE Xplore or the Customer Commons mirror.
- **Customer Commons** is named as the neutral host throughout the standard; this attribution appears wherever the standard is referenced.
- **IEEE AI-training disclaimer (p.4):** the standard PDF must not be ingested into AI training corpora without IEEE SA's written consent.

---

## Contact

**privacymage**

- mage@agentprivacy.ai
- https://agentprivacy.ai
- https://github.com/mitchuski

---

*The blade slashes. The contract binds. The standard names what the contract is. All three serve the First Person.*

`⚔️📜✍️🔐`
