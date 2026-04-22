/**
 * Swordsman Extension Build Script
 *
 * Uses esbuild to bundle TypeScript into browser-ready JavaScript
 */

import * as esbuild from 'esbuild'
import * as fs from 'fs'
import * as path from 'path'

const outdir = 'dist'

// Ensure dist directories exist
const dirs = [
  'dist',
  'dist/background',
  'dist/content',
  'dist/popup'
]

for (const dir of dirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// Common esbuild options
const commonOptions = {
  bundle: true,
  platform: 'browser',
  target: 'chrome110',
  sourcemap: true,
  alias: {
    '@shared': '../shared',
    '@shared/types': '../shared/types',
    '@agentprivacy/shared-types': '../shared/types'
  }
}

// Build background service worker
await esbuild.build({
  ...commonOptions,
  entryPoints: ['src/background/index.ts'],
  outfile: 'dist/background/index.js',
  format: 'esm'
})

// Build content script
await esbuild.build({
  ...commonOptions,
  entryPoints: ['src/content/index.ts'],
  outfile: 'dist/content/index.js',
  format: 'iife'
})

// Copy manifest
fs.copyFileSync('manifest.json', 'dist/manifest.json')

// Helper to copy directory
const copyDir = (src, dest) => {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

// Copy icons
if (fs.existsSync('icons')) {
  copyDir('icons', 'dist/icons')
}

// Copy styles if they exist
if (fs.existsSync('styles')) {
  copyDir('styles', 'dist/styles')
}

// Create popup with extension toggle
const popupHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      width: 340px;
      padding: 16px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 13px;
      background: #1a1a2e;
      color: #eee;
    }
    h1 {
      font-size: 16px;
      margin: 0 0 12px;
      color: #AFA9EC;
    }
    .status {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #534AB7;
    }
    .dot.mage { background: #1D9E75; }
    .stat {
      color: #888;
      font-size: 11px;
    }

    /* Extension Toggle */
    .toggle-section {
      background: #252540;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 16px;
    }
    .toggle-label {
      font-size: 10px;
      text-transform: uppercase;
      color: #666;
      margin-bottom: 8px;
    }
    .toggle-buttons {
      display: flex;
      gap: 4px;
    }
    .toggle-btn {
      flex: 1;
      padding: 8px 4px;
      border: 1px solid #333;
      border-radius: 6px;
      background: #1a1a2e;
      color: #888;
      font-size: 11px;
      cursor: pointer;
      text-align: center;
      transition: all 0.2s;
    }
    .toggle-btn:hover {
      border-color: #555;
      color: #ccc;
    }
    .toggle-btn.active {
      background: #534AB7;
      border-color: #534AB7;
      color: white;
    }
    .toggle-btn.active.mage {
      background: #1D9E75;
      border-color: #1D9E75;
    }
    .toggle-btn.active.dual {
      background: linear-gradient(135deg, #534AB7 50%, #1D9E75 50%);
      border-color: #EF9F27;
    }
    .toggle-btn .icon {
      font-size: 14px;
      display: block;
      margin-bottom: 2px;
    }

    /* Effect Picker */
    .effects-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      margin-top: 8px;
    }
    .effect-btn {
      aspect-ratio: 1;
      border: 1px solid #333;
      border-radius: 8px;
      background: #252540;
      cursor: pointer;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }
    .effect-btn:hover {
      background: #353555;
      border-color: #534AB7;
      transform: scale(1.05);
    }
    .effect-btn.active {
      border-color: #534AB7;
      background: rgba(83, 74, 183, 0.2);
      box-shadow: 0 0 8px rgba(83, 74, 183, 0.3);
    }

    .spells {
      display: flex;
      gap: 8px;
      margin: 12px 0;
    }
    .spell-slot {
      width: 40px;
      height: 40px;
      border: 1px solid #333;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 18px;
      background: #252540;
    }
    .spell-slot:hover {
      background: #353555;
      border-color: #534AB7;
    }
    .section {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #333;
    }
    .section-title {
      font-size: 10px;
      text-transform: uppercase;
      color: #666;
      margin-bottom: 8px;
    }
    .disable-btn {
      width: 100%;
      padding: 8px;
      border: 1px solid #333;
      border-radius: 6px;
      background: transparent;
      color: #888;
      font-size: 11px;
      cursor: pointer;
      margin-top: 12px;
    }
    .disable-btn:hover {
      border-color: #c53030;
      color: #c53030;
    }
  </style>
</head>
<body>
  <h1>⚔ Swordsman</h1>

  <div class="status">
    <span class="dot"></span>
    <span id="domain">—</span>
  </div>

  <!-- Extension Toggle -->
  <div class="toggle-section">
    <div class="toggle-label">Active Extension</div>
    <div class="toggle-buttons">
      <button class="toggle-btn" data-mode="swordsman">
        <span class="icon">⚔️</span>
        Sword
      </button>
      <button class="toggle-btn" data-mode="mage">
        <span class="icon">✦</span>
        Mage
      </button>
      <button class="toggle-btn active dual" data-mode="dual">
        <span class="icon">⚔️✦</span>
        Dual
      </button>
    </div>
  </div>

  <!-- Effect Picker -->
  <div class="section">
    <div class="section-title">Cursor Effect</div>
    <div class="effects-grid" id="effects-grid">
      <div class="effect-btn active" data-effect="blade-classic" title="Classic Blade">⚔️</div>
      <div class="effect-btn" data-effect="shield-guard" title="Shield Guard">🛡️</div>
      <div class="effect-btn" data-effect="dragon-flame" title="Dragon Flame">🐉</div>
      <div class="effect-btn" data-effect="lightning-strike" title="Lightning">⚡</div>
      <div class="effect-btn" data-effect="privacy-lock" title="Privacy Lock">🔒</div>
      <div class="effect-btn" data-effect="eye-of-sovereignty" title="Eye">👁️</div>
      <div class="effect-btn" data-effect="minimal-dot" title="Minimal">•</div>
      <div class="effect-btn" data-effect="cross-guard" title="Cross">✚</div>
    </div>
  </div>

  <div class="stat" style="margin-top: 12px">Gap score: <span id="gap">—</span></div>

  <div class="section">
    <div class="section-title">Quick Cast</div>
    <div class="spells">
      <div class="spell-slot" title="Shield">🛡️</div>
      <div class="spell-slot" title="Do Not Track">🚫</div>
      <div class="spell-slot" title="Privacy">🔒</div>
      <div class="spell-slot" title="Dragon">🐉</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Mage Status</div>
    <div class="status">
      <span class="dot mage" id="mage-dot" style="opacity: 0.3"></span>
      <span id="mage-status">Not detected</span>
    </div>
  </div>

  <button class="disable-btn" id="disable-btn">Disable on this site</button>

  <script src="popup.js"></script>
</body>
</html>`

fs.writeFileSync('dist/popup/popup.html', popupHtml)

// Create popup script
const popupJs = `
const STORAGE_KEY = 'pretext_effect_library'
let currentDomain = ''

// Initialize popup
async function init() {
  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.url) return

  try {
    const url = new URL(tab.url)
    currentDomain = url.hostname
    document.getElementById('domain').textContent = currentDomain
  } catch {}

  // Load settings
  await loadSettings()

  // Request state from content script
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'GET_STATE' }, (response) => {
      if (chrome.runtime.lastError) return

      if (response) {
        document.getElementById('gap').textContent = response.gapScore ?? '—'

        if (response.magePresent) {
          document.getElementById('mage-dot').style.opacity = '1'
          document.getElementById('mage-status').textContent = 'Connected'
        }
      }
    })
  }
}

// Load settings from storage
async function loadSettings() {
  const result = await chrome.storage.local.get(STORAGE_KEY)
  const library = result[STORAGE_KEY]

  if (library) {
    // Set active extension mode
    const mode = library.settings?.activeExtension || 'dual'
    updateToggleUI(mode)

    // Set active effect
    const effectId = library.activeEffectId || 'blade-classic'
    updateEffectUI(effectId)

    // Check if domain is disabled
    if (library.settings?.disabledDomains?.includes(currentDomain)) {
      document.getElementById('disable-btn').textContent = 'Enable on this site'
    }
  }
}

// Update toggle button UI
function updateToggleUI(mode) {
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.classList.remove('active')
    if (btn.dataset.mode === mode) {
      btn.classList.add('active')
    }
  })
}

// Update effect picker UI
function updateEffectUI(effectId) {
  document.querySelectorAll('.effect-btn').forEach(btn => {
    btn.classList.remove('active')
    if (btn.dataset.effect === effectId) {
      btn.classList.add('active')
    }
  })
}

// Extension toggle handlers
document.querySelectorAll('.toggle-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const mode = btn.dataset.mode

    // Update storage
    const result = await chrome.storage.local.get(STORAGE_KEY)
    const library = result[STORAGE_KEY] || {
      version: '1.0',
      activeEffectId: 'blade-classic',
      effects: [],
      settings: { activeExtension: 'dual', globalOpacity: 0.9, disabledDomains: [] }
    }

    library.settings.activeExtension = mode
    await chrome.storage.local.set({ [STORAGE_KEY]: library })

    // Update UI
    updateToggleUI(mode)

    // Notify all tabs
    const tabs = await chrome.tabs.query({})
    for (const tab of tabs) {
      if (tab.id) {
        try {
          chrome.tabs.sendMessage(tab.id, {
            type: 'ACTIVE_EXTENSION_CHANGED',
            active: mode
          })
        } catch {}
      }
    }

    // Notify Mage extension
    try {
      chrome.runtime.sendMessage('MAGE_EXTENSION_ID_PLACEHOLDER', {
        type: 'ACTIVE_EXTENSION_CHANGED',
        active: mode
      })
    } catch {}
  })
})

// Effect picker handlers
document.querySelectorAll('.effect-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const effectId = btn.dataset.effect

    // Update storage
    const result = await chrome.storage.local.get(STORAGE_KEY)
    const library = result[STORAGE_KEY] || {
      version: '1.0',
      activeEffectId: 'blade-classic',
      effects: [],
      settings: { activeExtension: 'dual', globalOpacity: 0.9, disabledDomains: [] }
    }

    library.activeEffectId = effectId
    await chrome.storage.local.set({ [STORAGE_KEY]: library })

    // Update UI
    updateEffectUI(effectId)

    // Notify all tabs
    const tabs = await chrome.tabs.query({})
    for (const tab of tabs) {
      if (tab.id) {
        try {
          chrome.tabs.sendMessage(tab.id, {
            type: 'ACTIVE_EFFECT_CHANGED',
            effectId
          })
        } catch {}
      }
    }
  })
})

// Spell slot click handlers
document.querySelectorAll('.spell-slot').forEach((slot, index) => {
  slot.addEventListener('click', async () => {
    const spells = [
      { type: 'emoji', content: '🛡️', yangYin: 'yang' },
      { type: 'keyword', content: 'DO_NOT_TRACK', yangYin: 'yang' },
      { type: 'keyword', content: 'PRIVACY', yangYin: 'yang' },
      { type: 'emoji', content: '🐉', yangYin: 'yang' }
    ]

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'CAST_SPELL',
        spell: spells[index]
      })
    }
  })
})

// Disable on site button
document.getElementById('disable-btn').addEventListener('click', async () => {
  const result = await chrome.storage.local.get(STORAGE_KEY)
  const library = result[STORAGE_KEY] || {
    version: '1.0',
    activeEffectId: 'blade-classic',
    effects: [],
    settings: { activeExtension: 'dual', globalOpacity: 0.9, disabledDomains: [] }
  }

  const disabled = library.settings.disabledDomains || []
  const index = disabled.indexOf(currentDomain)

  if (index === -1) {
    disabled.push(currentDomain)
    document.getElementById('disable-btn').textContent = 'Enable on this site'
  } else {
    disabled.splice(index, 1)
    document.getElementById('disable-btn').textContent = 'Disable on this site'
  }

  library.settings.disabledDomains = disabled
  await chrome.storage.local.set({ [STORAGE_KEY]: library })

  // Notify current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: 'DOMAIN_TOGGLE',
      domain: currentDomain,
      disabled: index === -1
    })
  }
})

// Initialize
init()
`

fs.writeFileSync('dist/popup/popup.js', popupJs)

console.log('✅ Swordsman extension built successfully')
console.log('   Load "dist" folder in chrome://extensions')
