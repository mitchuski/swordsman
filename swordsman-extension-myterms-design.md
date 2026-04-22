# The Swordsman Extension — MyTerms Orb Game

## Design Document: Chrome Extension Sovereign Overlay System

**Version:** 0.1 — Concept Architecture  
**Author:** privacymage × Claude  
**Date:** March 2026  
**Dependencies:** `@chenglou/pretext`, Chrome Extension Manifest V3, agentprivacy.ai training experience  
**Companion:** "The Living Spellbook" (Website Native Design Document)

---

## 1. Vision

The Swordsman Extension is the sovereign layer that follows you across the web.

On the agentprivacy.ai website, the user learns the orb system — they watch the Swordsman and Mage orbit, they see spells cast, they experience the constellation forming. This is training. The website teaches you the language.

The Chrome extension is where you *speak* it.

When the extension is active, two orbs appear as a floating overlay on any webpage. The **Swordsman orb** represents your sovereign terms — your MyTerms agreement preferences, your privacy boundaries, your data dignity posture. The **Mage orb** represents the site's terms — its cookie policy, its data collection practices, its ToS. The orbs start apart. Your job is to **bring them together** by casting spells — assertions of your terms onto the page.

When the swords cross (the orbs converge), a **MyTerms agreement** is forged. The cursor state changes. You have cast your sovereignty onto the page. The spell you chose — an emoji inscription, an agreement keyword, a proverb — becomes the record of that assertion, inscribed onto the page's surface via pretext's sovereign rendering layer.

The site's scripts never see any of it.

---

## 2. Core Loop: The Orb Game

### 2.1 The Two Orbs

**Your Orb — The Swordsman** (purple, ⚔)

This orb represents YOU. It carries your MyTerms configuration:
- Your privacy preferences (do not track, do not sell, data minimisation)
- Your credential disclosure settings (what you're willing to prove vs. reveal)
- Your agent delegation preferences (what can act on your behalf)
- Your trust boundary (which domains you've previously asserted terms on)

The Swordsman orb is anchored to your cursor by a spring-physics tether. It follows your mouse with a slight lag, like a guardian trailing a few steps behind. When you're reading, it drifts lazily. When you move fast, it snaps closer.

**The Site's Orb — The Mage** (teal, ✦)

This orb represents the SITE. It is generated from analysis of the current page:
- Detected cookie consent patterns
- Privacy policy signals (if parseable)
- Third-party tracker presence
- Data collection form elements
- Terms of Service keywords

The Mage orb is anchored to the page's "gravity center" — typically near the primary content area, but it gravitates toward data-collecting elements (forms, login buttons, cookie banners). It drifts autonomously, representing the site's interests.

### 2.2 The Convergence Game

The orbs start at a distance proportional to the **privacy gap** between your terms and the site's detected practices:

- **Small gap** (privacy-respecting site, few trackers) → Orbs start close, easy convergence
- **Large gap** (heavy tracking, dark patterns) → Orbs start far apart, requires more deliberate casting
- **Unknown** (new site, no analysis yet) → Medium distance, neutral state

**The user's goal:** Bring the orbs together by casting spells. Each spell narrows the gap.

### 2.3 Spell Casting Mechanics

The user casts a spell by:

1. **Selecting a spell** from their spell palette (configurable in extension settings)
2. **Aiming** by moving their cursor toward the Mage orb (the Swordsman follows)
3. **Casting** by clicking, pressing a hotkey, or using a gesture

When a spell is cast:

- The spell content (emoji, keyword, proverb) appears at the cursor position
- A visual thread connects the spell to the Swordsman orb
- The **gap between orbs decreases** by an amount proportional to the spell's "weight"
- The spell persists on the page as a spell node (visible only to the user via the sovereign overlay)

### 2.4 Spell Types and the MyTerms Mapping

The spells are not decorative. Each one corresponds to a **specific MyTerms assertion**:

| Spell Type | Example | MyTerms Assertion | Gap Reduction |
|------------|---------|-------------------|---------------|
| **Emoji Inscription** | 🛡️🔑 | "I assert self-custody of credentials on this domain" | Medium |
| **Agreement Keyword** | `DO_NOT_SELL` | "I invoke my right to opt out of data sale" | High |
| **Proverb** | "The shadow remembers its shape" | "I assert data portability rights" | Low (ambient) |
| **Boundary Marker** | 🚫📊 | "I do not consent to analytics tracking" | High |
| **Trust Extension** | 🤝✅ | "I extend limited trust to this domain" | Negative (widens gap intentionally) |
| **ZKP Assertion** | 🔮 | "I am willing to prove [attribute] without revealing it" | Medium |

The user configures their **spell palette** in the extension settings. They can choose which types of spells are available, customise the emoji/proverb mappings, and set default assertion bundles for common scenarios (e.g., "Social Media Defensive" = DO_NOT_SELL + DO_NOT_TRACK + MINIMAL_COOKIES).

### 2.5 Convergence and the Cursor State Change

When the orbs converge (distance < convergence threshold):

**The swords cross.** A brief animation shows the two orbs touching, a burst of light at the intersection, and then:

1. **Cursor state changes** — The cursor transforms from the standard arrow to a **sovereign cursor**: a small shield icon (⚔) indicating that MyTerms have been asserted on this page
2. **The MyTerms agreement is forged** — The extension records the specific assertions made (which spells were cast) and the domain they apply to
3. **The constellation crystallises** — All spell nodes cast during this session connect into a final constellation pattern, which is saved as the visual signature of this agreement
4. **The Mage orb changes color** — From teal (unknown/unasserted) to a shade reflecting the agreement strength:
   - Gold (strong assertion, many spells cast)
   - Silver (moderate assertion)
   - Bronze (minimal assertion, few spells)

The cursor state persists for the session. On subsequent visits to the same domain, the extension recognises the prior assertion and starts with the orbs already converged (cursor already sovereign), unless the site's detected practices have changed.

---

## 3. The Sovereign Overlay: Pretext as Anti-Fingerprint Rendering

### 3.1 Why Pretext for the Extension

The extension needs to render its UI (orbs, spells, constellation) **over** any website without:

1. The host site's scripts detecting the overlay
2. The overlay triggering DOM reflow that the host can observe
3. The extension's measurement of the page leaking to surveillance scripts

Pretext solves all three. Here's how:

### 3.2 Measuring the Host Page

The extension needs to know the page's text layout to position spells intelligently (e.g., placing a spell near a data collection form, or flowing text annotations around existing content). Traditionally, this requires `getBoundingClientRect` calls that trigger layout reflow — observable by the host page.

With pretext:

```javascript
// In the content script, measure the page's text once
const pageText = document.body.innerText
const prepared = prepareWithSegments(pageText, getComputedStyle(document.body).font)

// Now we can calculate positions without touching the DOM again
const lineInfo = layoutWithLines(prepared, containerWidth, lineHeight)

// We know where every line of text is, without ever calling
// getBoundingClientRect or triggering reflow
```

The initial `innerText` read is a single DOM access. Everything after that is arithmetic. The extension knows the page layout without ongoing DOM interrogation.

### 3.3 Rendering the Sovereign Layer

The overlay renders on a `<canvas>` element injected by the extension's content script, positioned with `position: fixed; z-index: 2147483647; pointer-events: none;` (pointer-events enabled selectively for interactive elements).

Because the canvas is:
- Not part of the page's DOM tree (from the page's perspective)
- Not triggering any layout calculations
- Not observable via MutationObserver (it's injected by the extension, not the page)

The host page cannot detect the overlay. The orbs, spells, and constellation exist in a rendering layer that is **physically present but logically invisible** to the page's JavaScript context.

This is **Refractive Disclosure** at the UI level: the user sees the sovereign layer, but the page's surveillance substrate sees nothing.

### 3.4 Spell Positioning Intelligence

Using pretext's measurement data, spells can be placed intelligently:

```javascript
// Find the position of a specific text pattern on the page
function findTextPosition(prepared, searchText, lineHeight) {
  const lines = layoutWithLines(prepared, containerWidth, lineHeight).lines
  for (let i = 0; i < lines.length; i++) {
    const idx = lines[i].text.indexOf(searchText)
    if (idx !== -1) {
      return {
        x: estimateCharX(lines[i], idx),
        y: i * lineHeight,
        line: lines[i]
      }
    }
  }
  return null
}

// Place a spell near "I agree to the Terms of Service"
const tosPosition = findTextPosition(prepared, "I agree to the Terms", lineHeight)
if (tosPosition) {
  suggestSpellPlacement(tosPosition, 'DO_NOT_SELL')
}
```

The extension can **highlight** terms of service clauses and suggest relevant spells to cast near them, all without the page knowing it's being read.

---

## 4. Training: The agentprivacy.ai Experience

### 4.1 The Learning Arc

The agentprivacy.ai website is the training ground. The user learns the orb system there before the extension deploys it everywhere. The training arc:

**Act 1: Observation (Passive)**
The user visits agentprivacy.ai. The dual orbs are already orbiting, spells are casting automatically, the constellation is forming. The user watches. They see the hexagram mutating, the text reflowing, the proverbs appearing. This is world-building — establishing the visual language.

**Act 2: Interaction (Active)**
The user is prompted to interact. "Click the Mage orb to cast a spell." They click. A spell appears. They see it connect to the constellation. "Now try bringing the orbs together." They move their cursor, the Swordsman follows, the gap closes. The first manual convergence happens. The user feels the mechanic.

**Act 3: Configuration (Intentional)**
The user is shown the spell palette. "Choose your first spell." They select from the proverb pool, the emoji inscriptions, the agreement keywords. "These are your MyTerms." The connection between the game mechanic and the privacy assertion is made explicit.

**Act 4: Deployment (Sovereign)**
"Ready to take the Swordsman with you?" The user installs the extension. The orbs they trained with on agentprivacy.ai now appear on every page. The visual language is already learned. The game is already understood. The user knows what it means to bring the swords together.

### 4.2 Skill Transfer

Specific skills learned on the website that transfer to the extension:

| Website Skill | Extension Application |
|--------------|----------------------|
| Watching orb convergence | Recognising privacy gap on new sites |
| Manual spell casting | Asserting MyTerms on specific page elements |
| Reading the hexagram | Understanding the current privacy posture |
| Observing constellation formation | Seeing the history of assertions on a domain |
| Understanding proverb meanings | Knowing which spell to cast in which situation |
| Experiencing text reflow around orbs | Trusting the sovereign overlay concept |

### 4.3 Progressive Reveal

The extension starts simple and adds complexity as the user demonstrates mastery:

**Level 1: Orbs Only** — Just the two orbs, basic convergence. One spell type (emoji). Cursor state change on convergence.

**Level 2: Spell Palette** — Full spell selection. Agreement keywords unlocked. Constellation edges visible.

**Level 3: Smart Suggestions** — Extension analyses page content and suggests relevant spells near ToS clauses, cookie banners, and data collection forms.

**Level 4: Auto-Assert** — For trusted domains, the extension can auto-cast saved spell configurations. The orbs converge immediately. Full MyTerms automation.

**Level 5: Constellation History** — The user can view their constellation across all domains — a map of every assertion they've ever made. The promise graph made visible.

---

## 5. Extension Architecture

### 5.1 Component Map

```
┌──────────────────────────────────────────────────┐
│                  Extension Popup                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │  Hexagram │  │  Spell   │  │ Domain Stats │   │
│  │  Display  │  │  Palette │  │  & History   │   │
│  └──────────┘  └──────────┘  └──────────────┘   │
├──────────────────────────────────────────────────┤
│               Background Service Worker           │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │  MyTerms │  │  Domain  │  │ Constellation│   │
│  │  Config  │  │ Analysis │  │   Storage    │   │
│  └──────────┘  └──────────┘  └──────────────┘   │
├──────────────────────────────────────────────────┤
│                  Content Script                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │  Pretext │  │  Canvas  │  │  Orb Physics │   │
│  │  Engine  │  │  Overlay │  │   & Spells   │   │
│  └──────────┘  └──────────┘  └──────────────┘   │
└──────────────────────────────────────────────────┘
```

### 5.2 Content Script (Per-Tab)

The content script runs on every page and is responsible for:

1. **Page Analysis** — On page load, extract text content and detect:
   - Cookie consent elements (known patterns: OneTrust, Cookiebot, custom)
   - Privacy policy links and their content (if accessible)
   - Third-party script domains (via `document.scripts` enumeration)
   - Data collection forms (`<form>` elements with input types email, tel, etc.)
   - Dark pattern indicators (pre-checked consent boxes, hidden opt-outs)

2. **Pretext Initialisation** — Prepare the page's text for measurement:
   ```javascript
   const sections = extractContentSections(document)
   const preparedSections = sections.map(s =>
     prepareWithSegments(s.text, s.computedFont)
   )
   ```

3. **Overlay Rendering** — Create and manage the canvas overlay:
   - Orb rendering (position, animation, glow effects)
   - Spell node rendering (placement, fade lifecycle, labels)
   - Constellation edge rendering (proximity detection, opacity)
   - Cursor state management (default → sovereign)

4. **Input Handling** — Capture user interactions:
   - Mouse position (for Swordsman tethering)
   - Click events on the overlay (spell casting, orb interaction)
   - Keyboard shortcuts (cast spell, toggle overlay, cycle spell palette)

### 5.3 Background Service Worker

The background script manages persistent state:

1. **MyTerms Configuration** — The user's sovereign terms:
   ```javascript
   {
     doNotTrack: true,
     doNotSell: true,
     dataMinimsation: true,
     cookiePreference: "essential-only",
     credentialDisclosure: "selective", // or "full" or "none"
     agentDelegation: "self-only", // or "emissary-allowed"
     spellPalette: ["🛡️🔑", "DO_NOT_SELL", "DO_NOT_TRACK", ...],
     defaultBundle: "social-media-defensive",
     autoAssertDomains: ["example.com", ...],
   }
   ```

2. **Domain Analysis Cache** — Cached analysis results per domain:
   ```javascript
   {
     "example.com": {
       trackerCount: 12,
       cookieConsentType: "dark-pattern",
       privacyPolicyScore: 0.3,  // 0=hostile, 1=friendly
       lastAnalysis: "2026-03-29T...",
       assertions: [...],        // historical spell casts
       constellationState: {...}  // saved constellation
     }
   }
   ```

3. **Constellation Storage** — The persistent promise graph across all domains. This is the user's sovereign assertion history — it never leaves the device.

### 5.4 Extension Popup

The popup provides:

1. **Current Domain Status** — Privacy gap score, tracker count, assertion history
2. **Hexagram Display** — Current privacy state for this domain (same I Ching system as the website)
3. **Spell Palette** — Quick access to available spells, with drag-to-reorder
4. **Constellation Viewer** — Minimap of the current domain's constellation
5. **Global Stats** — Total assertions across all domains, domains asserted on, constellation size

### 5.5 Data Flow

```
User moves cursor
  → Content script updates Swordsman position (spring physics)
  → Canvas overlay redraws orbs

User casts spell (click / hotkey)
  → Content script places spell node at cursor
  → Spell type mapped to MyTerms assertion
  → Gap between orbs reduced
  → Message sent to background: { type: 'spell_cast', domain, assertion, position }
  → Background updates domain analysis cache
  → Background checks: has gap reached zero? → trigger convergence

Orbs converge
  → Content script plays convergence animation
  → Cursor state changes to sovereign (⚔)
  → Constellation crystallises (edges finalized)
  → Background records MyTerms assertion for domain
  → On next visit: orbs start converged, cursor starts sovereign
```

---

## 6. MyTerms Agreement Protocol

### 6.1 What Is a MyTerms Agreement?

A MyTerms agreement is a **unilateral declaration** by the user of the terms under which they interact with a website. It is not a negotiation (there is no response channel from the site). It is an assertion of sovereignty.

The agreement is structured as:

```javascript
{
  version: "1.0",
  domain: "example.com",
  timestamp: "2026-03-29T12:00:00Z",
  assertions: [
    { type: "DO_NOT_SELL", spell: "🛡️", weight: 3 },
    { type: "DO_NOT_TRACK", spell: "🚫📊", weight: 3 },
    { type: "DATA_MINIMISATION", spell: "The shadow remembers its shape", weight: 1 },
  ],
  hexagramState: [1, 0, 1, 1, 0, 1],  // privacy posture at time of assertion
  constellationHash: "abc123...",        // hash of the constellation geometry
  gapScore: 0,                           // 0 = fully converged
}
```

### 6.2 Mapping to IEEE 7012

The MyTerms assertion structure maps to the IEEE 7012 standard for machine-readable personal privacy terms:

| MyTerms Field | IEEE 7012 Concept |
|---------------|-------------------|
| `assertions[]` | Data Contribution Agreement terms |
| `domain` | Data Controller identifier |
| `hexagramState` | Privacy posture vector (novel extension) |
| `constellationHash` | Proof of assertion process (novel extension) |
| `timestamp` | Temporal binding |

The constellation hash is significant: it provides a **verifiable record** that the user went through the assertion process (cast specific spells, achieved convergence) without revealing the specific content of each spell. The geometry of the constellation is a privacy-preserving proof of intentional term-setting.

### 6.3 Future Protocol Extensions

**Phase 2: Bilateral MyTerms** — If a site implements a MyTerms-compatible endpoint, the extension could *send* the assertion and receive an acknowledgment. The Mage orb would respond — moving toward the Swordsman, meeting halfway. True convergence.

**Phase 3: On-Chain Inscription** — The constellation hash and assertion summary could be inscribed on-chain (Ethereum, Zcash) as a timestamped proof of sovereign term assertion. The agentprivacy-zypher system (Zcash proverb inscription) provides the mechanism.

**Phase 4: Agent Interoperability** — The MyTerms agreement becomes a credential that sovereign AI agents carry. When the Mage agent (Emissary) visits a site on your behalf, it presents the MyTerms constellation as its credential. The swords are already crossed.

---

## 7. Spell Design: The Inscription System

### 7.1 Emoji Inscriptions

Drawing from the threat/defense compression system (MITRE ATT&CK → emoji):

| Emoji Spell | Meaning | MyTerms Mapping |
|-------------|---------|-----------------|
| 🛡️🔑 | Sovereign key custody | "I manage my own credentials" |
| 🚫📊 | Reject analytics | "Do not track my behaviour" |
| 🚫💰 | Reject data sale | "Do not sell my data" |
| 🔮 | Zero-knowledge proof available | "I will prove, not reveal" |
| 🏰 | Fortress mode | "Minimal data, maximum boundary" |
| 🤝✅ | Trust extension | "I accept this site's terms conditionally" |
| 📖→🌊 | Data portability | "My data must be exportable" |
| 🌊→📖 | Data reclamation | "Return my data on request" |
| ⚡🔒 | Ephemeral session | "Delete all data when I leave" |
| 👤❌ | No profiling | "Do not build a profile of me" |

### 7.2 Agreement Keywords

These are formal assertion tokens, machine-readable:

```
DO_NOT_TRACK          — Global tracking opt-out
DO_NOT_SELL           — CCPA/equivalent data sale opt-out
DATA_MINIMISATION     — Collect only what is necessary
ESSENTIAL_COOKIES_ONLY — Reject all non-essential cookies
RIGHT_TO_DELETE       — Assert deletion right
RIGHT_TO_PORTABILITY  — Assert data portability right
NO_PROFILING          — Opt out of automated profiling
CONSENT_REQUIRED      — Require explicit consent for each use
EPHEMERAL_SESSION     — No persistent data after session end
SELECTIVE_DISCLOSURE  — Will prove attributes via ZKP only
```

### 7.3 Proverbs

From the Relationship Proverb Protocol:

| Proverb | Encoded Meaning |
|---------|----------------|
| "Privacy is the path to value" | Core sovereignty assertion |
| "The tool that measures without touching the surface" | Anti-fingerprinting stance |
| "Trust is earned, not assumed" | Default-deny posture |
| "The shadow remembers its shape" | Data portability right |
| "What is held too tightly shatters" | Warning against over-collection |
| "The Emissary speaks for the sovereign" | Delegated agent authority |
| "Your keys, your identity" | Self-sovereign identity |
| "The narrow attention of the watcher reveals the watcher" | Counter-surveillance |

### 7.4 Configurable Spell Mode

In extension settings, the user chooses their default spell mode:

- **Emoji Mode** — Quick visual inscriptions. Best for casual browsing. Fast to cast.
- **Agreement Mode** — Formal keyword assertions. Best for sites where you want machine-readable terms.
- **Proverb Mode** — Narrative inscriptions. Best for the philosophically inclined. Each proverb carries encoded meaning.
- **Mixed Mode** — All types available in a radial palette around the Swordsman orb.

---

## 8. Visual Design

### 8.1 Orb Appearance

**Swordsman (User)**
- Core: 20px radius circle, deep purple (#534AB7) with 1px white inner ring
- Glow: 40px radius ambient glow, 15% opacity
- Symbol: ⚔ centered, 10px, white
- Tether: 0.5px dashed line to cursor, fading with distance
- Trail: 3-frame motion blur (opacity 0.3 → 0.1 → 0.05)

**Mage (Site)**
- Core: 20px radius circle, teal (#1D9E75) with 1px white inner ring
- Glow: 40px radius ambient glow, 15% opacity
- Symbol: ✦ centered, 10px, white
- Anchor: 0.5px dotted line to nearest data-collecting element
- Drift: Autonomous movement, slightly irregular (Perlin noise on orbit)

**Convergence Animation**
- Orbs approach: glow intensifies, color bleeds into each other
- Contact: Burst of amber (#EF9F27) particles at intersection point
- Resolution: Brief white flash, then both orbs settle into a combined "sovereign" state
- Post-convergence: Single larger orb (25px), purple-teal gradient rim, ⚔✦ combined symbol

### 8.2 Cursor States

| State | Appearance | Meaning |
|-------|------------|---------|
| Default | Standard arrow | No assertion active |
| Casting | Arrow + small spell preview at tip | Spell selected, ready to cast |
| Sovereign | Small shield icon (⚔) replacing arrow | MyTerms asserted on this domain |
| Contested | Shield with amber exclamation | Site has changed since last assertion |
| Inherited | Shield with silver tint | Auto-asserted from saved config |

### 8.3 Spell Node Appearance

- Yang spells: Solid circle, 6px, amber (#EF9F27), full opacity, pulses gently
- Yin spells: Hollow circle, 6px, amber stroke, 50% opacity, no pulse
- On hover: Expands to 12px, reveals text label with spell content
- Fade: After 60 seconds or on scroll-past, opacity drops to 20% over 2 seconds
- Permanent: On convergence, all active spells lock to full opacity and join the constellation

### 8.4 Constellation Appearance

- Edges: 0.5px lines, amber (#EF9F27) with opacity proportional to node proximity
- Strong edges (same-type nodes): Solid line, higher opacity
- Tension edges (different-type nodes): Dashed line, lower opacity
- Constellation background: Very faint amber wash (3% opacity) filling the convex hull of all nodes
- On convergence: Edges brighten briefly, then settle to a permanent constellation state

---

## 9. Implementation Phases

### Phase 1: Core Orbs (3 weeks)

- Manifest V3 extension scaffold (content script, background worker, popup)
- Canvas overlay injection and rendering
- Swordsman orb with cursor-tether spring physics
- Mage orb with autonomous drift (Perlin noise orbit)
- Basic convergence detection (distance threshold)
- Pretext integration for page text measurement (single `prepare()` call on load)

### Phase 2: Spell Casting (3 weeks)

- Spell palette UI (radial menu around Swordsman orb on right-click)
- Spell node rendering with lifecycle (appear, pulse, fade)
- Emoji, keyword, and proverb spell types
- Gap reduction mechanics (spell weight → orb distance delta)
- Convergence animation and cursor state change
- MyTerms assertion recording (local storage)

### Phase 3: Page Intelligence (3 weeks)

- Cookie consent pattern detection (OneTrust, Cookiebot, custom banner heuristics)
- Third-party script enumeration and categorisation
- Privacy policy link detection and basic scoring
- Form/input element detection for data collection awareness
- Mage orb gravity toward detected data-collecting elements
- Smart spell suggestions near ToS clauses (using pretext position data)

### Phase 4: Constellation + Persistence (2 weeks)

- Constellation edge formation and rendering
- Domain-specific constellation storage
- Cross-session persistence (orbs start converged on revisit)
- Constellation viewer in popup (minimap)
- Export constellation as image or data structure

### Phase 5: agentprivacy.ai Training Integration (2 weeks)

- Define the 4-act training sequence on the website
- Implement progressive reveal (extension starts at Level 1, unlocks with use)
- Save training progress to extension storage
- "Graduate" moment: extension fully unlocked after completing the website experience
- Sync spell palette preferences from website training to extension

### Phase 6: Protocol + Future (Ongoing)

- IEEE 7012 MyTerms format export
- Bilateral MyTerms endpoint discovery (if sites implement receivers)
- On-chain inscription integration (agentprivacy-zypher)
- Agent credential export (for sovereign AI agent delegation)

---

## 10. Privacy Properties of the Extension Itself

The Swordsman extension must be sovereign in its own behaviour:

1. **No telemetry.** The extension sends no data to any server. All analysis, storage, and rendering happen locally.

2. **No remote config.** Spell libraries and detection heuristics are bundled with the extension. Updates come only through the Chrome Web Store update mechanism.

3. **Pretext as anti-fingerprint primitive.** All page measurement goes through pretext's canvas-based engine. The extension never calls `getBoundingClientRect`, `offsetHeight`, or any DOM measurement API that could be observed by the host page. One `innerText` read, then pure arithmetic.

4. **Canvas overlay isolation.** The overlay canvas is injected into the page's DOM but operates in a separate rendering context. The host page's JavaScript cannot read the canvas content (same-origin policy on canvas drawing). MutationObserver can detect the canvas element's insertion but not its content.

5. **No cross-domain state leakage.** Each domain's constellation is stored separately. The extension never transfers data between domains. Visiting site A does not reveal your assertions on site B.

6. **Ephemeral computation.** Pretext's `prepare()` cache is per-tab and garbage-collected on tab close. No persistent measurement data survives the session.

7. **User-sovereign storage.** All stored data (MyTerms config, domain analysis cache, constellation history) is in `chrome.storage.local`, encrypted at rest by Chrome's storage layer, and deletable by the user at any time from the extension popup.

The extension asserts sovereignty. The extension *is* sovereign.

---

## Appendix A: Spring Physics for Swordsman Tether

```javascript
class SpringTether {
  constructor(stiffness = 0.08, damping = 0.7) {
    this.stiffness = stiffness
    this.damping = damping
    this.vx = 0
    this.vy = 0
    this.x = 0
    this.y = 0
  }

  update(targetX, targetY) {
    const dx = targetX - this.x
    const dy = targetY - this.y

    // Spring force
    const ax = dx * this.stiffness
    const ay = dy * this.stiffness

    // Apply with damping
    this.vx = (this.vx + ax) * this.damping
    this.vy = (this.vy + ay) * this.damping

    this.x += this.vx
    this.y += this.vy

    return { x: this.x, y: this.y }
  }
}

// Usage: Swordsman follows cursor with elegant lag
const swordTether = new SpringTether(0.06, 0.75)

document.addEventListener('mousemove', (e) => {
  const pos = swordTether.update(e.clientX, e.clientY)
  swordsmanOrb.setPosition(pos.x, pos.y)
})
```

## Appendix B: Page Analysis Heuristics

```javascript
function analysePagePrivacy() {
  const signals = {
    trackers: detectThirdPartyScripts(),
    cookieBanner: detectCookieConsent(),
    forms: detectDataCollectionForms(),
    darkPatterns: detectDarkPatterns(),
  }

  // Calculate initial orb gap (0 = no gap, 100 = maximum gap)
  let gap = 20 // base gap for any site

  gap += signals.trackers.length * 5          // each tracker adds distance
  gap += signals.cookieBanner.isDark ? 20 : 0 // dark pattern cookie banner
  gap += signals.forms.sensitiveFields * 3    // email, phone, SSN fields
  gap += signals.darkPatterns.count * 10      // each dark pattern adds distance
  gap -= signals.cookieBanner.hasReject ? 10 : 0 // easy reject reduces gap

  return Math.min(100, Math.max(0, gap))
}

function detectThirdPartyScripts() {
  const currentDomain = location.hostname
  return [...document.scripts]
    .filter(s => s.src)
    .map(s => new URL(s.src).hostname)
    .filter(h => h !== currentDomain && !h.endsWith('.' + currentDomain))
}

function detectCookieConsent() {
  const bannerSelectors = [
    '#onetrust-banner-sdk', '.cookieconsent',
    '#cookie-banner', '[class*="cookie"]',
    '[id*="cookie"]', '[class*="consent"]',
    '[id*="consent"]', '[class*="gdpr"]'
  ]
  const banner = bannerSelectors
    .map(s => document.querySelector(s))
    .find(el => el)

  if (!banner) return { detected: false }

  const buttons = banner.querySelectorAll('button, a[role="button"]')
  const rejectButton = [...buttons].find(b =>
    /reject|decline|refuse|deny|no|essential/i.test(b.textContent)
  )
  const hasReject = !!rejectButton
  const isDark = !hasReject || (rejectButton &&
    getComputedStyle(rejectButton).opacity < 0.7)

  return { detected: true, hasReject, isDark }
}

function detectDarkPatterns() {
  let count = 0

  // Pre-checked consent boxes
  const checkboxes = document.querySelectorAll('input[type="checkbox"]')
  for (const cb of checkboxes) {
    if (cb.checked && /consent|agree|opt|subscri/i.test(
      cb.closest('label')?.textContent || cb.name || ''
    )) {
      count++
    }
  }

  // Hidden or de-emphasized reject options
  // (detected via computed styles comparison)

  return { count }
}
```

## Appendix C: Constellation Hash Algorithm

The constellation hash provides a privacy-preserving proof that the user completed an assertion process:

```javascript
function hashConstellation(spells) {
  // Create a geometry-only representation (no content)
  const geometry = spells.map(s => ({
    relativeX: s.x / viewportWidth,   // normalised position
    relativeY: s.y / viewportHeight,
    type: s.yang ? 1 : 0,             // yang/yin only
    order: s.castOrder                 // sequence number
  }))

  // Sort by cast order for deterministic hashing
  geometry.sort((a, b) => a.order - b.order)

  // Hash the geometry
  const data = JSON.stringify(geometry)
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(data))
    .then(buffer => Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(''))
}
```

The hash encodes *where* and *in what order* spells were cast, and whether they were yang or yin — but not the specific content (proverb, emoji, keyword). This means the hash can be shared or inscribed on-chain without revealing the user's specific assertions, while still proving they went through a deliberate term-setting process.
