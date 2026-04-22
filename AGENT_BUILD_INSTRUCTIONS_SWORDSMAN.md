# The Swordsman Extension: Agent Build Instructions

**For:** AI Agents / Autonomous Builders  
**Project:** Swordsman Chrome Extension — MyTerms Orb & Privacy Blade  
**Date:** March 2026  
**Stack:** Chrome Extension Manifest V3, TypeScript, Canvas API, @chenglou/pretext (bundled)  
**Repo:** github.com/mitchuski/swordsman-extension (new repo)  
**Companion:** AGENT_BUILD_INSTRUCTIONS_MAGE.md, AGENT_BUILD_INSTRUCTIONS_TRAINING_GROUND.md

---

## Overview

The Swordsman is the first extension installed. It carries the blade — MyTerms assertions, cookie blocking, page analysis, boundary enforcement. It renders a single purple orb that follows the user's cursor with spring physics. When the Mage extension is also installed, the Swordsman detects it and activates the dual-orb ceremony channel.

**Architectural rule:** The Swordsman and Mage are SEPARATE extensions with SEPARATE extension IDs. They communicate via `chrome.runtime.sendMessage()` to each other's IDs. They do NOT share storage, permissions, or code. This mirrors the core thesis: the sword cannot merge with the spell.

---

## Step 1: Project Structure

```
swordsman-extension/
├── manifest.json
├── src/
│   ├── background/
│   │   ├── service-worker.ts       # Background service worker
│   │   ├── myterms-config.ts       # User's MyTerms configuration
│   │   ├── domain-cache.ts         # Per-domain analysis and assertion cache
│   │   └── mage-handshake.ts       # Discovery and handshake with Mage extension
│   ├── content/
│   │   ├── content-script.ts       # Main content script (injected per tab)
│   │   ├── orb-renderer.ts         # Canvas overlay and orb rendering
│   │   ├── page-analyzer.ts        # Page privacy analysis (trackers, forms, banners)
│   │   ├── pretext-engine.ts       # Pretext integration for page measurement
│   │   ├── spring-physics.ts       # Swordsman orb cursor-tether physics
│   │   ├── spell-caster.ts         # Spell casting on pages (from repertoire)
│   │   ├── constellation.ts        # Spell node and edge management
│   │   ├── cursor-manager.ts       # Cursor state changes
│   │   └── ceremony-channel.ts     # Message channel to/from Mage extension
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.ts                # Popup logic
│   │   └── popup.css
│   └── shared/
│       ├── types.ts                # Shared type definitions
│       ├── ceremony-types.ts       # Ceremony message grammar
│       └── spell-library.ts        # Bundled spell pool (from grimoire JSONs)
├── assets/
│   ├── icons/                      # Extension icons (16, 48, 128)
│   └── cursors/                    # Custom cursor images
├── lib/
│   └── pretext.bundle.js           # Bundled @chenglou/pretext (no CDN)
├── package.json
├── tsconfig.json
└── build.ts                        # Build script (esbuild or similar)
```

## Step 2: Manifest Configuration

File: `manifest.json`

```json
{
  "manifest_version": 3,
  "name": "Swordsman — Privacy Blade",
  "version": "1.0.0",
  "description": "The blade that slashes surveillance focus. MyTerms assertions for the sovereign web.",
  "permissions": [
    "storage",
    "activeTab",
    "scripting"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "background": {
    "service_worker": "dist/background/service-worker.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["dist/content/content-script.js"],
      "css": [],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "dist/popup/popup.html",
    "default_icon": {
      "16": "assets/icons/sword-16.png",
      "48": "assets/icons/sword-48.png",
      "128": "assets/icons/sword-128.png"
    }
  },
  "externally_connectable": {
    "ids": ["MAGE_EXTENSION_ID_PLACEHOLDER"]
  },
  "icons": {
    "16": "assets/icons/sword-16.png",
    "48": "assets/icons/sword-48.png",
    "128": "assets/icons/sword-128.png"
  }
}
```

**Critical:** The `externally_connectable.ids` field must contain the Mage extension's actual ID once built. During development, use `"*"` for testing, then lock down before release.

## Step 3: Content Script — Orb Rendering

### 3.1 Canvas Overlay Injection

File: `src/content/orb-renderer.ts`

On page load, inject a canvas element:

```typescript
function injectOverlay(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.id = 'swordsman-overlay'
  canvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 2147483646;
    pointer-events: none;
    background: transparent;
  `
  document.documentElement.appendChild(canvas)

  // Size canvas to device pixel ratio
  const resize = () => {
    canvas.width = window.innerWidth * devicePixelRatio
    canvas.height = window.innerHeight * devicePixelRatio
    canvas.getContext('2d')!.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
  }
  resize()
  window.addEventListener('resize', resize)

  return canvas
}
```

### 3.2 Spring Physics Tether

File: `src/content/spring-physics.ts`

The Swordsman orb follows the cursor with spring dynamics:

```typescript
class SpringTether {
  x = 0; y = 0
  vx = 0; vy = 0

  constructor(
    private stiffness = 0.06,
    private damping = 0.75
  ) {}

  update(targetX: number, targetY: number): { x: number; y: number } {
    const ax = (targetX - this.x) * this.stiffness
    const ay = (targetY - this.y) * this.stiffness
    this.vx = (this.vx + ax) * this.damping
    this.vy = (this.vy + ay) * this.damping
    this.x += this.vx
    this.y += this.vy
    return { x: this.x, y: this.y }
  }
}
```

Track mouse position:

```typescript
let mouseX = window.innerWidth / 2
let mouseY = window.innerHeight / 2

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX
  mouseY = e.clientY
}, { passive: true })
```

### 3.3 Single-Orb Render Loop (Swordsman Only)

When only the Swordsman is installed (no Mage detected):

```typescript
const tether = new SpringTether()
const SWORD_COLOR = '#534AB7'
const SWORD_RADIUS = 16

function renderFrame(ctx: CanvasRenderingContext2D): void {
  ctx.clearRect(0, 0, ctx.canvas.width / devicePixelRatio, ctx.canvas.height / devicePixelRatio)

  const pos = tether.update(mouseX, mouseY)

  // Glow
  ctx.globalAlpha = 0.12
  ctx.fillStyle = SWORD_COLOR
  ctx.beginPath()
  ctx.arc(pos.x, pos.y, SWORD_RADIUS * 2.5, 0, Math.PI * 2)
  ctx.fill()

  // Core
  ctx.globalAlpha = 1
  ctx.fillStyle = SWORD_COLOR
  ctx.beginPath()
  ctx.arc(pos.x, pos.y, SWORD_RADIUS, 0, Math.PI * 2)
  ctx.fill()

  // Symbol
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 10px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('⚔', pos.x, pos.y)

  requestAnimationFrame(() => renderFrame(ctx))
}
```

## Step 4: Page Analysis

File: `src/content/page-analyzer.ts`

On page load, analyse the page for privacy signals. This informs the orb gap when the Mage is present, and provides spell suggestions.

```typescript
interface PageAnalysis {
  domain: string
  trackers: string[]              // third-party script hostnames
  cookieBanner: {
    detected: boolean
    hasRejectButton: boolean
    isDarkPattern: boolean        // reject hidden or de-emphasised
  }
  forms: {
    count: number
    sensitiveFields: number       // email, phone, SSN-like inputs
  }
  privacyPolicyLink: string | null
  gapScore: number                // 0-100, higher = more surveillance
}

function analysePage(): PageAnalysis {
  const domain = location.hostname

  // Third-party scripts
  const trackers = [...document.scripts]
    .filter(s => s.src)
    .map(s => { try { return new URL(s.src).hostname } catch { return '' } })
    .filter(h => h && h !== domain && !h.endsWith('.' + domain))

  // Cookie banner detection
  const bannerSelectors = [
    '#onetrust-banner-sdk', '.cookieconsent', '#cookie-banner',
    '[class*="cookie"]', '[id*="cookie"]', '[class*="consent"]',
    '[id*="consent"]', '[class*="gdpr"]'
  ]
  const banner = bannerSelectors.map(s => document.querySelector(s)).find(Boolean)
  let cookieBanner = { detected: false, hasRejectButton: false, isDarkPattern: false }

  if (banner) {
    const buttons = banner.querySelectorAll('button, a[role="button"]')
    const reject = [...buttons].find(b =>
      /reject|decline|refuse|deny|no\s|essential/i.test(b.textContent || '')
    )
    cookieBanner = {
      detected: true,
      hasRejectButton: !!reject,
      isDarkPattern: !reject
    }
  }

  // Forms
  const inputs = document.querySelectorAll('input[type="email"], input[type="tel"], input[name*="ssn"], input[name*="social"]')
  const forms = {
    count: document.querySelectorAll('form').length,
    sensitiveFields: inputs.length
  }

  // Privacy policy
  const privacyLink = document.querySelector('a[href*="privacy"]')
  const privacyPolicyLink = privacyLink ? (privacyLink as HTMLAnchorElement).href : null

  // Gap score
  let gap = 20
  gap += trackers.length * 5
  gap += cookieBanner.isDarkPattern ? 20 : 0
  gap += forms.sensitiveFields * 3
  gap -= cookieBanner.hasRejectButton ? 10 : 0
  gap = Math.min(100, Math.max(0, gap))

  return { domain, trackers, cookieBanner, forms, privacyPolicyLink, gapScore: gap }
}
```

Send analysis to background worker for caching:

```typescript
const analysis = analysePage()
chrome.runtime.sendMessage({ type: 'PAGE_ANALYSIS', data: analysis })
```

## Step 5: Pretext Integration

File: `src/content/pretext-engine.ts`

The Swordsman uses pretext for ONE purpose in single-orb mode: measuring page text layout to position spell suggestions near relevant content (e.g., near cookie banners, near "I agree" buttons).

```typescript
import { prepareWithSegments, layoutWithLines } from '../lib/pretext.bundle'

function measurePageText(): void {
  // Only measure the main content area, not the whole DOM
  const main = document.querySelector('main, article, [role="main"], .content') || document.body
  const text = main.innerText
  const font = getComputedStyle(main).font

  const prepared = prepareWithSegments(text, font)
  const containerWidth = main.getBoundingClientRect().width

  // This is the ONE DOM measurement call. Everything after is arithmetic.
  const { lines } = layoutWithLines(prepared, containerWidth, 24)

  // Store line positions for spell placement intelligence
  chrome.storage.session.set({ pageLines: lines.map(l => ({ text: l.text, width: l.width })) })
}
```

**When the Mage is present:** The Mage handles the full pretext-driven text reflow around both orbs (it has the richer measurement engine). The Swordsman delegates measurement to the Mage via the ceremony channel.

## Step 6: MyTerms Configuration

File: `src/background/myterms-config.ts`

```typescript
interface MyTermsConfig {
  doNotTrack: boolean
  doNotSell: boolean
  dataMinimisation: boolean
  cookiePreference: 'essential-only' | 'functional' | 'all'
  credentialDisclosure: 'none' | 'selective' | 'full'
  agentDelegation: 'self-only' | 'emissary-allowed'
  spellPalette: string[]          // spell IDs available in quick-cast
  defaultBundle: string           // preset name e.g., 'social-media-defensive'
  autoAssertDomains: string[]     // domains where MyTerms auto-assert on load
}

const DEFAULT_CONFIG: MyTermsConfig = {
  doNotTrack: true,
  doNotSell: true,
  dataMinimisation: true,
  cookiePreference: 'essential-only',
  credentialDisclosure: 'selective',
  agentDelegation: 'self-only',
  spellPalette: ['🛡️', '🚫📊', 'DO_NOT_SELL', 'DO_NOT_TRACK'],
  defaultBundle: 'standard-defensive',
  autoAssertDomains: []
}
```

Stored in `chrome.storage.local` under key `myterms_config`.

## Step 7: Cursor State Management

File: `src/content/cursor-manager.ts`

```typescript
type CursorState =
  | 'default'             // standard arrow
  | 'blade-active'        // ⚔️ small sword beside arrow
  | 'casting'             // arrow + spell preview at tip
  | 'sovereign'           // ⚔️ shield (MyTerms asserted)
  | 'contested'           // shield + amber exclamation (site changed since last assertion)
  | 'inherited'           // shield + silver tint (auto-asserted from saved config)

function setCursorState(state: CursorState): void {
  const cursorMap: Record<CursorState, string> = {
    'default': 'auto',
    'blade-active': `url(${chrome.runtime.getURL('assets/cursors/blade.png')}) 4 4, auto`,
    'casting': `url(${chrome.runtime.getURL('assets/cursors/casting.png')}) 4 4, auto`,
    'sovereign': `url(${chrome.runtime.getURL('assets/cursors/sovereign.png')}) 4 4, auto`,
    'contested': `url(${chrome.runtime.getURL('assets/cursors/contested.png')}) 4 4, auto`,
    'inherited': `url(${chrome.runtime.getURL('assets/cursors/inherited.png')}) 4 4, auto`,
  }

  document.documentElement.style.cursor = cursorMap[state]
}
```

**Cursor state transitions:**
- Page load → `blade-active` (Swordsman running)
- User casts first spell → `casting` (briefly)
- Orb convergence / MyTerms asserted → `sovereign`
- Revisit previously asserted domain → check if site analysis changed → `sovereign` or `contested`
- Auto-assert domain → `inherited`

## Step 8: Ceremony Channel (Mage Communication)

File: `src/content/ceremony-channel.ts`

**Discovery:** On content script load, attempt to contact the Mage extension:

```typescript
const MAGE_EXTENSION_ID = 'PLACEHOLDER_REPLACE_WITH_REAL_ID'

let magePresent = false

function discoverMage(): void {
  try {
    chrome.runtime.sendMessage(MAGE_EXTENSION_ID, {
      type: 'SWORD_PRESENT',
      domain: location.hostname,
      myTermsState: getCurrentAssertions(),
      orbPosition: { x: tether.x, y: tether.y }
    }, (response) => {
      if (chrome.runtime.lastError) {
        // Mage not installed — single-orb mode
        magePresent = false
        return
      }
      if (response?.type === 'MAGE_ACKNOWLEDGE') {
        magePresent = true
        activateDualOrbMode(response)
      }
    })
  } catch {
    magePresent = false
  }
}

// Run discovery on content script init, and re-check every 30 seconds
discoverMage()
setInterval(discoverMage, 30000)
```

**Sending messages (Sword → Mage):**

```typescript
function sendToMage(message: SwordMessage): void {
  if (!magePresent) return
  chrome.runtime.sendMessage(MAGE_EXTENSION_ID, message)
}

// Message types the Swordsman sends:
type SwordMessage =
  | { type: 'SWORD_PRESENT'; domain: string; myTermsState: any; orbPosition: {x:number,y:number} }
  | { type: 'ORB_POSITION'; x: number; y: number }
  | { type: 'SLASH'; target: string; domain: string; assertion: string }
  | { type: 'WARD'; boundary: string; terms: string[]; hexagramLine: number; yangState: boolean }
  | { type: 'TERM_ASSERT'; domain: string; assertions: any[]; constellationHash: string }
  | { type: 'CEREMONY_BEGIN'; ceremonyType: string; initiator: 'SWORD' }
  | { type: 'SUMMON_DRAKE'; conditions: any }
```

**Receiving messages (Mage → Sword):**

```typescript
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (sender.id !== MAGE_EXTENSION_ID) return

  switch (message.type) {
    case 'MAGE_PRESENT':
      magePresent = true
      sendResponse({ type: 'SWORD_ACKNOWLEDGE' })
      break
    case 'MAGE_ORB_POSITION':
      updateMageOrbPosition(message.x, message.y)
      break
    case 'CONSTELLATION_WAVE':
      handleConstellationWave(message)
      break
    case 'SCAN_RESULTS':
      handleMageScanResults(message.findings)
      break
    case 'SPELL_CAST':
      handleMageSpellCast(message.spell)
      break
    case 'CEREMONY_BEGIN':
      handleCeremonyFromMage(message)
      break
  }
})
```

**Position sync:** When Mage is present, send orb position at 30fps (throttled from 60fps):

```typescript
let lastPositionSend = 0
function maybeSendPosition(x: number, y: number): void {
  const now = performance.now()
  if (now - lastPositionSend < 33) return // 30fps throttle
  lastPositionSend = now
  sendToMage({ type: 'ORB_POSITION', x, y })
}
```

## Step 9: Dual-Orb Mode Activation

When the Mage is detected, the rendering changes:

```typescript
function activateDualOrbMode(mageResponse: any): void {
  // The Swordsman now renders BOTH orbs (it owns the canvas)
  // The Mage sends position updates; the Swordsman renders them
  // This avoids two overlapping canvases

  mageOrbPosition = mageResponse.orbPosition

  // Switch render loop to dual-orb mode
  renderMode = 'dual'

  // Load ceremony animations
  loadCeremonyAnimations()

  // Start convergence detection
  startConvergenceDetection()
}
```

**Important:** Only ONE canvas overlay exists per page (the Swordsman's). The Mage extension sends position data; the Swordsman extension renders both orbs. This prevents z-index conflicts and double-rendering.

## Step 10: Background Service Worker

File: `src/background/service-worker.ts`

```typescript
// Domain analysis cache
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'PAGE_ANALYSIS':
      // Cache analysis for this domain
      chrome.storage.local.get('domain_cache', (result) => {
        const cache = result.domain_cache || {}
        cache[message.data.domain] = {
          ...message.data,
          lastAnalysis: Date.now()
        }
        chrome.storage.local.set({ domain_cache: cache })
      })
      break

    case 'TERM_ASSERT':
      // Record MyTerms assertion for domain
      chrome.storage.local.get('assertions', (result) => {
        const assertions = result.assertions || {}
        assertions[message.domain] = {
          terms: message.terms,
          timestamp: Date.now(),
          constellationHash: message.constellationHash,
          hexagram: message.hexagram
        }
        chrome.storage.local.set({ assertions })
      })
      break
  }
})

// Spell repertoire sync from agentprivacy.ai
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' &&
      (tab.url?.includes('agentprivacy.ai'))) {
    chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const rep = localStorage.getItem('agentprivacy_spell_repertoire')
        if (rep) {
          chrome.runtime.sendMessage({ type: 'SYNC_REPERTOIRE', data: JSON.parse(rep) })
        }
      }
    })
  }
})
```

## Step 11: Popup UI

File: `src/popup/popup.html`

The popup shows:
1. Current domain status (privacy gap score, tracker count)
2. MyTerms assertion state for this domain (asserted / not asserted)
3. Quick spell palette (4 spell slots, configurable)
4. Mage connection status (connected / not installed)
5. Stats: total domains asserted, total spells cast, VRC trust score

Keep the popup simple. No heavy frameworks. Plain HTML + vanilla JS + minimal CSS.

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { width: 320px; padding: 16px; font-family: system-ui; font-size: 13px; }
    .status { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; }
    .dot.green { background: #1D9E75; }
    .dot.amber { background: #EF9F27; }
    .dot.red { background: #E24B4A; }
    .spells { display: flex; gap: 8px; margin: 12px 0; }
    .spell-slot { width: 40px; height: 40px; border: 1px solid #ddd; border-radius: 8px;
                  display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 18px; }
    .spell-slot:hover { background: #f5f5f0; }
    .stat { color: #666; }
    .mage-status { font-size: 11px; color: #999; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="status">
    <span class="dot" id="status-dot"></span>
    <span id="domain-name">—</span>
    <span class="stat" id="gap-score"></span>
  </div>
  <div id="assertion-state"></div>
  <div class="spells" id="spell-palette"></div>
  <div class="stat" id="stats"></div>
  <div class="mage-status" id="mage-status"></div>
  <script src="popup.js"></script>
</body>
</html>
```

---

## Testing Checklist

- [ ] Extension loads in Chrome developer mode without errors
- [ ] Canvas overlay injects on all pages without breaking page layout
- [ ] Swordsman orb follows cursor with spring lag (not snapping)
- [ ] Single-orb mode renders correctly when Mage is not installed
- [ ] Page analysis detects trackers, cookie banners, and forms
- [ ] MyTerms config saves and loads from chrome.storage.local
- [ ] Cursor state changes correctly on assertion
- [ ] Spell repertoire syncs from agentprivacy.ai localStorage
- [ ] Mage discovery handshake works when both extensions are installed
- [ ] Dual-orb mode activates correctly (Swordsman renders both orbs)
- [ ] Position sync to Mage runs at 30fps throttled
- [ ] Ceremony channel messages serialize/deserialize correctly
- [ ] Popup shows correct domain status and stats
- [ ] No network requests to any external server (zero telemetry)
- [ ] All data in chrome.storage.local only (no remote sync)
- [ ] Pretext bundled locally (no CDN fetch at runtime)
- [ ] Extension does not break on: YouTube, Twitter/X, GitHub, Google Search, banking sites
- [ ] Canvas pointer-events: none does not block page clicks
- [ ] Reduced motion: orb static at last cursor position, no spring animation

---

## Privacy Verification Checklist

These are non-negotiable. If any fail, the extension is not shippable.

- [ ] Zero network requests from the extension (verify with Chrome DevTools Network tab)
- [ ] No `getBoundingClientRect` or `offsetHeight` calls after initial page analysis
- [ ] Canvas content not readable by page scripts (verify with cross-origin canvas test)
- [ ] MutationObserver on the page cannot read canvas drawing operations
- [ ] chrome.storage.local encrypted at rest by Chrome (verify documentation)
- [ ] No cross-domain data leakage (domain A assertions not visible on domain B)
- [ ] Spell repertoire sync ONLY on agentprivacy.ai domain (whitelist check)

---

*"The blade goes first. Always. Everything else follows the blade."*
