/**
 * Swordsman Extension - Content Script
 *
 * The blade that guards sovereignty. Renders the Swordsman orb on pages and handles:
 * - Single-orb mode (Swordsman only)
 * - Dual-orb mode (with Mage)
 * - Stance casting interface (7 swords: 6 active + 1 reserve)
 * - Constellation rendering (from Mage data)
 * - Convergence ceremonies
 * - Blade forge system
 *
 * ARCHITECTURAL RULE: The Swordsman owns the canvas.
 * Only ONE canvas overlay exists per page. When the Mage is present,
 * it sends rendering data; the Swordsman renders both orbs.
 *
 * CONTROL SCHEME (Right Side = Master = Right Click):
 * - Right-click tap: Cast current stance
 * - Right-click hold: Show stance wheel (6 active)
 * - S key: Open stance editor
 * - Ctrl+Shift+1-6: Quick cast active stance
 * - Ctrl+Shift+7: Quick cast reserve blade
 * - 7 swords = 7 chakras = sovereignty over the body
 */

import { SpringTether, MouseTracker } from './spring-physics'
import { OrbRenderer } from './orb-renderer'
import { CeremonyChannel, type CeremonyChannelCallbacks } from './ceremony-channel'
import { analyzePage, type PageAnalysis } from './page-analyzer'

import type {
  Position,
  RenderNode,
  RenderEdge,
  DetectedPattern,
  DrakeBodyNode,
  AnimationParams,
  HexagramState,
  DeepScanFindings
} from '@agentprivacy/shared-types'

// Unified stance system
import type { SwordsmanStance, SwordsmanLoadout } from '../lib/stance-types'
import {
  ACTIVE_STANCES,
  DEFAULT_RESERVE_BLADE,
  ALL_STANCES,
  EXTENDED_STANCES,
  getDefaultLoadout,
  getStanceById,
  calculateGapReduction,
  STANCE_MATHEMATICS
} from '../lib/stance-definitions'
import {
  isHomeDomain,
  syncFromTrainingGround,
  getLoadoutFromStorage,
  saveLoadoutToStorage,
  updateLoadoutWithUnlocked,
  broadcastStanceCast,
  broadcastConvergence,
  broadcastGapReduction,
  announceSwordsmanPresence,
  setupWebsiteListener,
  recordStanceCast,
  recordForgedBlade,
  getForgeStateFromStorage
} from '../lib/posture-sync'

// Blade forge and evoke systems
import {
  initializeForge,
  analyzePageForForging,
  forgeBlade,
  getForgeState,
  getCurrentHexagram,
  type DimensionalAnalysis
} from './blade-forge'
import { getEvocationForForging, parseEmojiSpell } from './evoke'

// ============================================
// STATE
// ============================================

let renderer: OrbRenderer | null = null
let tether: SpringTether | null = null
let mouse: MouseTracker | null = null
let channel: CeremonyChannel | null = null

let renderMode: 'single' | 'dual' = 'single'
let pageAnalysis: PageAnalysis | null = null
let isRunning = false

// Spell nodes cast on this page (local to Swordsman)
let localSpellNodes: RenderNode[] = []

// Blade forge state
let forgeAnalysis: {
  dimensions: DimensionalAnalysis
  hexagram: HexagramState
  potentialBlade: any
  canForge: boolean
} | null = null

// Home territory state
let isHomeTerritoryPage = false
let homeTerritoryType: 'agentprivacy' | 'spellweb' | 'bgin' | null = null

// Animation state
let animParams: AnimationParams = {
  orbitRadii: 1.0,
  spellSpawnRate: 0.5,
  phaseCoupling: 0.5,
  edgeThreshold: 180,
  glowIntensity: 0.3,
  gridVisibility: 0.05
}

// ============================================
// STANCE SYSTEM (Right Side = Master = Right Click)
// 7 Swords: 6 active stances + 1 reserve blade
// ============================================

// Current loadout (initialized from storage or defaults)
let currentLoadout: SwordsmanLoadout = getDefaultLoadout()

let stanceState = {
  isHolding: false,
  holdStartTime: 0,
  currentStance: currentLoadout.activeStances[0],
  selectedStanceIndex: 0,
  menuVisible: false,
  menuPosition: { x: 0, y: 0 },
  menuElement: null as HTMLElement | null
}

// ============================================
// HOME TERRITORY DETECTION
// ============================================

const HOME_DOMAINS = [
  'agentprivacy.ai',
  'www.agentprivacy.ai',
  'spellweb.ai',
  'www.spellweb.ai',
  'bgin.ai',
  'www.bgin.ai',
  // Local development
  'localhost',
  '127.0.0.1'
]

function checkHomeTerritory(): void {
  const host = location.hostname.replace('www.', '')
  const port = location.port

  // Check if this is a home territory domain
  isHomeTerritoryPage = HOME_DOMAINS.includes(host)

  // Also check for local dev server on port 5000
  if ((host === 'localhost' || host === '127.0.0.1') && port === '5000') {
    isHomeTerritoryPage = true
  }

  if (isHomeTerritoryPage) {
    if (host === 'agentprivacy.ai' || host === 'localhost' || host === '127.0.0.1') {
      homeTerritoryType = 'agentprivacy'
    } else if (host === 'spellweb.ai') {
      homeTerritoryType = 'spellweb'
    } else if (host === 'bgin.ai') {
      homeTerritoryType = 'bgin'
    }
    console.log('[Swordsman Content] Home territory detected:', homeTerritoryType)
  }
}

let websiteListenerCleanup: (() => void) | null = null

function activateHomeTerritoryMode(): void {
  console.log('[Swordsman Content] Activating home territory mode:', homeTerritoryType)

  // Setup website message listener using posture-sync module
  websiteListenerCleanup = setupWebsiteListener({
    onRepertoireSync: async (repertoire) => {
      console.log('[Swordsman Content] Repertoire sync received')
      // Re-sync with training ground
      await syncWithTrainingGround()
    },

    onPathUnlocked: async (progress) => {
      console.log('[Swordsman Content] Path unlocked!', progress)
      // Update loadout with new unlocked stances
      const { unlocked } = await syncFromTrainingGround()
      if (unlocked.length > 0) {
        currentLoadout = await updateLoadoutWithUnlocked(unlocked)
      }
    },

    onMageSpellCast: (spellId, position) => {
      console.log('[Swordsman Content] Mage spell cast:', spellId)
      // Could trigger convergence check
      checkConvergence()
    },

    onManaEarned: (amount, reason) => {
      chrome.runtime.sendMessage({
        type: 'ADD_MANA',
        amount,
        eventType: 'website_earn',
        domain: location.hostname,
        details: reason
      })
    }
  })

  // Also listen for additional website messages
  window.addEventListener('message', handleWebsiteMessage)

  // Announce presence to the website
  announceToWebsite()

  // Re-announce periodically
  setInterval(announceToWebsite, 5000)
}

function announceToWebsite(): void {
  const orbPos = tether ? { x: tether.x, y: tether.y } : { x: 0, y: 0 }

  // Use posture-sync module for announcement
  announceSwordsmanPresence(orbPos, getForgeState())

  // Also send extended announcement with capabilities
  window.postMessage({
    type: 'SWORD_PRESENT',
    domain: location.hostname,
    orbPosition: orbPos,
    homeTerritoryType,
    myTermsState: getForgeState(),
    capabilities: ['spring-physics', 'blade-forge', 'convergence', 'ceremony', 'stance-wheel'],
    stanceCount: STANCE_MATHEMATICS.total,
    activeCount: STANCE_MATHEMATICS.active,
    reserveCount: STANCE_MATHEMATICS.reserve
  }, '*')
}

function handleWebsiteMessage(event: MessageEvent): void {
  // Only handle messages from same origin
  if (event.origin !== location.origin) return

  const { data } = event
  if (!data || !data.type) return

  switch (data.type) {
    case 'WEBSITE_READY':
      console.log('[Swordsman Content] Website ready, capabilities:', data.capabilities)
      announceToWebsite()
      break

    case 'SPELL_CAST':
      // Mage cast a spell - could trigger convergence
      console.log('[Swordsman Content] Spell cast from website/Mage:', data.spellId)
      break

    case 'ORB_CONVERGENCE':
      console.log('[Swordsman Content] Website orb convergence:', data.count)
      // Broadcast our side of the convergence
      broadcastConvergence(data.count, localSpellNodes.length)
      break
  }
}

// ============================================
// INITIALIZATION
// ============================================

async function initialize(): Promise<void> {
  console.log('[Swordsman Content] Initializing...')
  console.log('[Swordsman Content] Stance Mathematics:', STANCE_MATHEMATICS.chakraRepresentation)

  // Load stance loadout from storage
  currentLoadout = await getLoadoutFromStorage()
  stanceState.currentStance = currentLoadout.activeStances[currentLoadout.currentStance] || currentLoadout.activeStances[0]

  // Check for home territory
  checkHomeTerritory()

  // If on home territory, sync with training ground
  if (isHomeTerritoryPage) {
    await syncWithTrainingGround()
  }

  // Create renderer (injects canvas)
  renderer = new OrbRenderer()

  // Create spring physics
  const initialPos = {
    x: window.innerWidth - 100,
    y: window.innerHeight - 100
  }
  tether = new SpringTether(initialPos.x, initialPos.y)

  // Create mouse tracker
  mouse = new MouseTracker()

  // Create ceremony channel
  channel = new CeremonyChannel(createChannelCallbacks())

  // Run page analysis
  pageAnalysis = analyzePage()
  console.log('[Swordsman Content] Page analysis:', pageAnalysis.domain, 'gap:', pageAnalysis.gapScore)

  // Notify background
  chrome.runtime.sendMessage({
    type: 'PAGE_ANALYSIS',
    data: pageAnalysis
  })

  // Set initial gap score
  renderer.setGapScore(pageAnalysis.gapScore)

  // Initialize blade forge
  initializeForge().then(forge => {
    console.log('[Swordsman Content] Forge initialized, layer:', forge.currentLayer)

    // Analyze page for blade forging
    forgeAnalysis = analyzePageForForging(pageAnalysis!)
    console.log('[Swordsman Content] Page hexagram:', forgeAnalysis.hexagram)
    console.log('[Swordsman Content] Potential blade:', forgeAnalysis.potentialBlade.name)

    // Set hexagram on renderer if available
    if (forgeAnalysis.hexagram) {
      channel?.setHexagramState({
        lines: forgeAnalysis.hexagram,
        number: forgeAnalysis.potentialBlade.id + 1,
        name: forgeAnalysis.potentialBlade.name
      })
    }
  })

  // Start discovery
  channel.startDiscovery()

  // Start render loop
  startRenderLoop()

  // Setup event listeners
  setupEventListeners()

  // Activate home territory mode if applicable
  if (isHomeTerritoryPage) {
    activateHomeTerritoryMode()
  }

  console.log('[Swordsman Content] Initialization complete')
}

/**
 * Sync stance loadout with training ground progress
 */
async function syncWithTrainingGround(): Promise<void> {
  try {
    const { progress, unlocked } = await syncFromTrainingGround()

    console.log('[Swordsman Content] Training ground sync:', {
      convergences: progress.orbConvergenceCount,
      pathUnlocked: progress.pathUnlocked,
      unlockedStances: unlocked
    })

    // Update loadout with any newly unlocked stances
    if (unlocked.length > 0) {
      currentLoadout = await updateLoadoutWithUnlocked(unlocked)
      stanceState.currentStance = currentLoadout.activeStances[currentLoadout.currentStance] || currentLoadout.activeStances[0]
    }
  } catch (error) {
    console.error('[Swordsman Content] Training sync failed:', error)
  }
}

function createChannelCallbacks(): CeremonyChannelCallbacks {
  return {
    onMageDetected: (orbPosition: Position, spellbookState: string[]) => {
      console.log('[Swordsman Content] Mage detected at:', orbPosition)
      renderMode = 'dual'
      renderer?.setMagePosition(orbPosition.x, orbPosition.y)
      renderer?.setMageVisible(true)
    },

    onMageDisconnected: () => {
      console.log('[Swordsman Content] Mage disconnected')
      renderMode = 'single'
      renderer?.setMageVisible(false)
    },

    onMageOrbPosition: (x: number, y: number) => {
      renderer?.setMagePosition(x, y)
    },

    onConstellationUpdate: (nodes: RenderNode[], edges: RenderEdge[], patterns: DetectedPattern[]) => {
      // Merge with local nodes
      const allNodes = [...localSpellNodes, ...nodes]
      renderer?.setConstellation(allNodes, edges, patterns)
    },

    onConstellationWave: (payload: any, animation: any) => {
      console.log('[Swordsman Content] Constellation wave received:', payload)
      // Update gap score from Mage intelligence
      if (payload.gapScore !== undefined) {
        renderer?.setGapScore(payload.gapScore)
      }
      // TODO: Trigger wave animation
    },

    onScanResults: (findings: DeepScanFindings) => {
      console.log('[Swordsman Content] Mage scan results:', findings.domain)
      // Mage's deeper scan - could update our analysis
      renderer?.setGapScore(findings.gapScore)
    },

    onHexagramUpdate: (state: HexagramState, params: AnimationParams) => {
      console.log('[Swordsman Content] Hexagram update:', state.number || 'unknown')
      animParams = params
      renderer?.setAnimationParams(params)
      channel?.setHexagramState(state)
    },

    onDrakeFormation: (bodyNodes: DrakeBodyNode[], patrolPath: Position[], progress: number) => {
      console.log('[Swordsman Content] Drake formation:', progress)
      renderer?.setDrakeFormation(bodyNodes, patrolPath, progress)
    },

    onCeremonyBegin: (ceremonyType: string, initiator: string) => {
      console.log('[Swordsman Content] Ceremony begin:', ceremonyType, 'by', initiator)
      // TODO: Handle ceremony animations
    },

    onSpellCast: (spell: any) => {
      console.log('[Swordsman Content] Mage spell cast:', spell)
      // Mage cast a spell - already included in constellation update
    }
  }
}

// ============================================
// RENDER LOOP
// ============================================

function startRenderLoop(): void {
  isRunning = true

  function render() {
    if (!isRunning || !renderer || !tether || !mouse) return

    // Update spring physics
    const mousePos = mouse.getPosition()
    const orbPos = tether.update(mousePos.x, mousePos.y)

    // Update renderer
    renderer.setSwordsmanPosition(orbPos.x, orbPos.y)

    // Update channel position (for sync with Mage)
    channel?.updateOrbPosition(orbPos.x, orbPos.y)

    // Render frame
    renderer.render()

    requestAnimationFrame(render)
  }

  requestAnimationFrame(render)
}

function stopRenderLoop(): void {
  isRunning = false
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners(): void {
  // Right-click stance system (Master deliberates)
  document.addEventListener('mousedown', handleMouseDown)
  document.addEventListener('mouseup', handleMouseUp)
  document.addEventListener('mousemove', handleMouseMoveForStance)
  document.addEventListener('contextmenu', handleContextMenu)

  // Listen for messages from background
  chrome.runtime.onMessage.addListener(handleBackgroundMessage)

  // Keyboard shortcuts (S = stance editor)
  document.addEventListener('keydown', handleKeydown)
}

// ============================================
// STANCE CONTROL HANDLERS (Right Click = Master)
// ============================================

function handleMouseDown(e: MouseEvent): void {
  // Right click = stance system (button 2)
  if (e.button === 2) {
    e.preventDefault()
    stanceState.isHolding = true
    stanceState.holdStartTime = Date.now()
    stanceState.menuPosition = { x: e.clientX, y: e.clientY }

    // Show stance menu after brief hold
    setTimeout(() => {
      if (stanceState.isHolding) {
        showStanceMenu(e.clientX, e.clientY)
      }
    }, 150)
  }
}

function handleMouseUp(e: MouseEvent): void {
  if (e.button === 2 && stanceState.isHolding) {
    e.preventDefault()
    const holdDuration = Date.now() - stanceState.holdStartTime

    if (stanceState.menuVisible) {
      // Release with menu visible = cast selected stance
      castStance(stanceState.currentStance, { x: e.clientX, y: e.clientY })
      hideStanceMenu()
    } else if (holdDuration < 150) {
      // Quick tap = cast current stance immediately
      castStance(stanceState.currentStance, { x: e.clientX, y: e.clientY })
    }

    stanceState.isHolding = false
  }
}

function handleMouseMoveForStance(e: MouseEvent): void {
  if (stanceState.isHolding && stanceState.menuVisible) {
    // Calculate which stance is being hovered based on angle from menu center
    const dx = e.clientX - stanceState.menuPosition.x
    const dy = e.clientY - stanceState.menuPosition.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance > 30) { // Must move away from center to select
      const angle = Math.atan2(dy, dx)
      // Normalize angle to 0-1 range, offset to start from top
      let normalizedAngle = (angle + Math.PI / 2) / (2 * Math.PI)
      if (normalizedAngle < 0) normalizedAngle += 1
      const activeStances = currentLoadout.activeStances
      const stanceIndex = Math.floor(normalizedAngle * activeStances.length) % activeStances.length

      if (stanceIndex !== stanceState.selectedStanceIndex) {
        stanceState.selectedStanceIndex = stanceIndex
        stanceState.currentStance = activeStances[stanceIndex]
        updateStanceMenuHighlight()
      }
    }
  }
}

function handleContextMenu(e: MouseEvent): void {
  // Prevent default context menu - we use right-click for stances
  e.preventDefault()
}

// ============================================
// STANCE MENU UI
// ============================================

function showStanceMenu(x: number, y: number): void {
  if (stanceState.menuElement) return

  stanceState.menuVisible = true
  const activeStances = currentLoadout.activeStances
  const reserveBlade = currentLoadout.reserveBlade

  // Create radial menu element
  const menu = document.createElement('div')
  menu.id = 'swordsman-stance-menu'
  menu.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    transform: translate(-50%, -50%);
    width: 220px;
    height: 220px;
    pointer-events: none;
    z-index: 2147483647;
  `

  // Create 6 active stance items in a radial layout (60° hexagonal symmetry)
  activeStances.forEach((stance, i) => {
    const angle = (i / activeStances.length) * Math.PI * 2 - Math.PI / 2
    const radius = 75
    const itemX = Math.cos(angle) * radius
    const itemY = Math.sin(angle) * radius

    // Use stance's color if defined, otherwise default purple
    const stanceColor = stance.color || '#534AB7'
    const glowColor = stance.glowColor || 'rgba(83, 74, 183, 0.5)'

    const item = document.createElement('div')
    item.className = 'stance-item'
    item.dataset.index = String(i)
    item.dataset.assertion = stance.myTermsMapping
    item.style.cssText = `
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%) translate(${itemX}px, ${itemY}px);
      width: 48px;
      height: 48px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: ${i === stanceState.selectedStanceIndex ? stanceColor : 'rgba(20, 20, 30, 0.85)'};
      border: 2px solid ${i === stanceState.selectedStanceIndex ? '#AFA9EC' : stanceColor};
      border-radius: 50%;
      color: white;
      font-size: 20px;
      transition: all 0.15s ease;
      box-shadow: 0 0 ${i === stanceState.selectedStanceIndex ? '15px' : '5px'} ${glowColor};
    `
    item.innerHTML = `<span>${stance.emoji}</span>`
    menu.appendChild(item)
  })

  // Center indicator showing current stance name and proverb
  const center = document.createElement('div')
  center.id = 'stance-center-label'
  center.style.cssText = `
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    background: rgba(20, 20, 30, 0.95);
    border: 2px solid #534AB7;
    border-radius: 8px;
    padding: 8px 12px;
    color: #AFA9EC;
    font-family: system-ui, sans-serif;
    font-size: 11px;
    text-align: center;
    white-space: nowrap;
    min-width: 70px;
  `
  const stanceProverb = stanceState.currentStance.proverb
    ? `<br><span style="color: #666; font-size: 7px; font-style: italic;">${stanceState.currentStance.proverb.slice(0, 35)}...</span>`
    : ''
  center.innerHTML = `<strong>${stanceState.currentStance.name}</strong><br><span style="color: #888; font-size: 9px;">${stanceState.currentStance.description}</span>${stanceProverb}`
  menu.appendChild(center)

  // Reserve blade indicator (small, below center)
  const reserve = document.createElement('div')
  reserve.id = 'stance-reserve'
  reserve.style.cssText = `
    position: absolute;
    left: 50%;
    bottom: 15px;
    transform: translateX(-50%);
    background: rgba(40, 35, 60, 0.9);
    border: 1px solid #534AB7;
    border-radius: 4px;
    padding: 2px 6px;
    color: #888;
    font-family: system-ui, sans-serif;
    font-size: 9px;
    white-space: nowrap;
  `
  reserve.innerHTML = `reserve: ${reserveBlade.emoji}`
  menu.appendChild(reserve)

  document.body.appendChild(menu)
  stanceState.menuElement = menu
}

function updateStanceMenuHighlight(): void {
  if (!stanceState.menuElement) return

  const activeStances = currentLoadout.activeStances
  const items = stanceState.menuElement.querySelectorAll('.stance-item')
  items.forEach((item, i) => {
    const el = item as HTMLElement
    const stance = activeStances[i]
    const isSelected = i === stanceState.selectedStanceIndex
    const stanceColor = stance?.color || '#534AB7'
    const glowColor = stance?.glowColor || 'rgba(83, 74, 183, 0.5)'

    el.style.background = isSelected ? stanceColor : 'rgba(20, 20, 30, 0.85)'
    el.style.borderColor = isSelected ? '#AFA9EC' : stanceColor
    el.style.boxShadow = `0 0 ${isSelected ? '15px' : '5px'} ${glowColor}`
  })

  const center = stanceState.menuElement.querySelector('#stance-center-label')
  if (center) {
    const stance = stanceState.currentStance
    const proverbSnippet = stance.proverb
      ? `<br><span style="color: #666; font-size: 7px; font-style: italic;">${stance.proverb.slice(0, 35)}...</span>`
      : ''
    center.innerHTML = `<strong>${stance.name}</strong><br><span style="color: #888; font-size: 9px;">${stance.description}</span>${proverbSnippet}`
  }
}

function hideStanceMenu(): void {
  if (stanceState.menuElement) {
    stanceState.menuElement.remove()
    stanceState.menuElement = null
  }
  stanceState.menuVisible = false
}

function castStance(stance: SwordsmanStance, position: Position): void {
  console.log('[Swordsman Content] Casting stance:', stance.name, 'at', position)
  console.log('[Swordsman Content] Stance proverb:', stance.proverb || '(none)')

  // Calculate gap reduction
  const currentGap = pageAnalysis?.gapScore || 50
  const gapReduction = calculateGapReduction(stance, currentGap)
  const newGap = Math.max(0, currentGap - gapReduction)

  // Update page analysis gap score
  if (pageAnalysis) {
    pageAnalysis.gapScore = newGap
    renderer?.setGapScore(newGap)
  }

  // Cast as spell node
  castSpell({
    type: 'emoji',
    content: stance.emoji,
    yangYin: 'yang'
  }, position)

  // Update current stance in loadout
  const stanceIndex = currentLoadout.activeStances.findIndex(s => s.id === stance.id)
  if (stanceIndex >= 0) {
    currentLoadout.currentStance = stanceIndex
    saveLoadoutToStorage(currentLoadout)
  }

  // Record cast in local history
  recordStanceCast(stance.id, position, location.hostname, gapReduction)

  // Broadcast to website if on home territory
  if (isHomeTerritoryPage) {
    broadcastStanceCast(
      stance.id,
      stance.myTermsMapping,
      position,
      location.hostname
    )

    // Also broadcast gap reduction
    if (gapReduction > 0) {
      broadcastGapReduction(location.hostname, currentGap, newGap, stance.id)
    }
  }

  // Notify background as MyTerms assertion
  chrome.runtime.sendMessage({
    type: 'STANCE_CAST',
    stance: {
      id: stance.id,
      name: stance.name,
      emoji: stance.emoji,
      myTermsMapping: stance.myTermsMapping,
      grimoireId: stance.grimoireId,
      proverb: stance.proverb
    },
    position,
    gapReduction,
    timestamp: Date.now()
  })

  // Visual feedback - flash with stance color
  flashStanceCast(position.x, position.y, stance.emoji, stance.glowColor)
}

function flashStanceCast(x: number, y: number, emoji: string, glowColor?: string): void {
  const glow = glowColor || 'rgba(83, 74, 183, 0.8)'
  const flash = document.createElement('div')
  flash.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    transform: translate(-50%, -50%) scale(1);
    font-size: 32px;
    pointer-events: none;
    z-index: 2147483647;
    opacity: 1;
    transition: all 0.5s ease-out;
    filter: drop-shadow(0 0 10px ${glow});
  `
  flash.textContent = emoji
  document.body.appendChild(flash)

  // Animate out
  requestAnimationFrame(() => {
    flash.style.transform = 'translate(-50%, -50%) scale(2)'
    flash.style.opacity = '0'
  })

  // Remove after animation
  setTimeout(() => flash.remove(), 500)
}

function openStanceEditor(): void {
  // Send message to open popup/editor
  chrome.runtime.sendMessage({ type: 'OPEN_STANCE_EDITOR' })
  console.log('[Swordsman Content] Opening stance editor (S key)')
}

function handleBackgroundMessage(message: any, sender: any, sendResponse: (response: any) => void): void {
  switch (message.type) {
    case 'CAST_SPELL':
      // Cast spell from popup or keyboard shortcut
      if (mouse) {
        castSpell(message.spell, mouse.getPosition())
      }
      sendResponse({ success: true })
      break

    case 'GET_STATE':
      sendResponse({
        renderMode,
        magePresent: channel?.isMagePresent(),
        gapScore: pageAnalysis?.gapScore,
        localSpellCount: localSpellNodes.length
      })
      break

    default:
      sendResponse({ received: true })
  }
}

function handleKeydown(e: KeyboardEvent): void {
  // Don't trigger if user is typing in an input
  if (document.activeElement?.tagName === 'INPUT' ||
      document.activeElement?.tagName === 'TEXTAREA' ||
      (document.activeElement as HTMLElement)?.isContentEditable) {
    return
  }

  // S key = Open stance editor (Swordsman's full editor)
  if (e.key === 's' || e.key === 'S') {
    e.preventDefault()
    openStanceEditor()
    return
  }

  // Quick stance shortcuts with Ctrl+Shift (1-6 for active stances, 7 for reserve)
  if (e.ctrlKey && e.shiftKey) {
    const num = parseInt(e.key)
    const activeStances = currentLoadout.activeStances
    if (num >= 1 && num <= 6 && mouse && activeStances[num - 1]) {
      // Cast active stance 1-6
      castStance(activeStances[num - 1], mouse.getPosition())
      e.preventDefault()
    } else if (num === 7 && mouse) {
      // Cast reserve blade
      castStance(currentLoadout.reserveBlade, mouse.getPosition())
      e.preventDefault()
    }
  }
}

// ============================================
// SPELL CASTING
// ============================================

interface SpellData {
  type: 'emoji' | 'proverb' | 'keyword' | 'hexagram'
  content: string
  yangYin: 'yang' | 'yin'
}

function castSpell(spell: SpellData, position: Position): void {
  console.log('[Swordsman Content] Casting spell:', spell.content, 'at', position)

  // Create local spell node
  const node: RenderNode = {
    id: crypto.randomUUID(),
    x: position.x,
    y: position.y,
    yangYin: spell.yangYin,
    opacity: 1,
    pulse: 1, // Start with pulse animation
    emoji: spell.type === 'emoji' ? spell.content : undefined
  }

  localSpellNodes.push(node)

  // Fade pulse over time
  let pulseStart = performance.now()
  function animatePulse() {
    const elapsed = performance.now() - pulseStart
    const progress = Math.min(1, elapsed / 1000)
    node.pulse = 1 - progress
    if (progress < 1) {
      requestAnimationFrame(animatePulse)
    }
  }
  requestAnimationFrame(animatePulse)

  // Notify background
  chrome.runtime.sendMessage({
    type: 'SPELL_CAST',
    spell: {
      ...spell,
      id: node.id,
      position,
      timestamp: Date.now()
    }
  })

  // Notify Mage if present
  if (channel?.isMagePresent()) {
    channel.sendToMage({
      type: 'SLASH',
      target: 'page',
      domain: location.hostname,
      assertion: spell.content,
      intensity: 5
    })
  }

  // Update local constellation rendering
  updateLocalConstellation()

  // Check if we should forge a blade
  checkAndForge()
}

/**
 * Check if conditions are met for blade forging
 */
async function checkAndForge(): Promise<void> {
  // Need at least 3 spells to forge
  if (localSpellNodes.length < 3) return

  // Need forge analysis
  if (!forgeAnalysis || !forgeAnalysis.canForge) return

  // Generate spell signatures and constellation hash
  const spellSignatures = localSpellNodes.map(n => n.id)
  const constellationHash = generateConstellationHash(localSpellNodes)

  // Forge the blade
  const forging = await forgeBlade(spellSignatures, constellationHash)

  if (forging) {
    console.log('[Swordsman Content] BLADE FORGED:', forging.blade.name)

    // Get evocation for this forging
    const forge = getForgeState()
    const evocation = getEvocationForForging(forging.blade, forge.currentLayer)

    if (evocation) {
      console.log('[Swordsman Content] Evocation:', evocation.proverb)

      // Notify background about the forging and evocation
      chrome.runtime.sendMessage({
        type: 'BLADE_FORGED',
        forging: {
          bladeId: forging.blade.id,
          bladeName: forging.blade.name,
          layer: forging.blade.layer,
          domain: forging.domain
        },
        evocation: {
          spell: evocation.spell,
          proverb: evocation.proverb
        }
      })
    }

    // Clear spell nodes after forging
    localSpellNodes = []
    updateLocalConstellation()
  }
}

/**
 * Generate a hash of the constellation geometry
 */
function generateConstellationHash(nodes: RenderNode[]): string {
  // Simple hash based on node positions and types
  const data = nodes.map(n => `${n.x},${n.y},${n.yangYin}`).join('|')
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data.charCodeAt(i)
    hash |= 0
  }
  return hash.toString(16)
}

function updateLocalConstellation(): void {
  // Build edges between local nodes
  const edges: RenderEdge[] = []

  for (let i = 0; i < localSpellNodes.length; i++) {
    for (let j = i + 1; j < localSpellNodes.length; j++) {
      const dx = localSpellNodes[i].x - localSpellNodes[j].x
      const dy = localSpellNodes[i].y - localSpellNodes[j].y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < animParams.edgeThreshold) {
        const sameType = localSpellNodes[i].yangYin === localSpellNodes[j].yangYin
        edges.push({
          from: localSpellNodes[i].id,
          to: localSpellNodes[j].id,
          strength: 1 - dist / animParams.edgeThreshold,
          type: sameType ? 'solid' : 'dashed'
        })
      }
    }
  }

  // If Mage is not present, render local constellation
  if (!channel?.isMagePresent()) {
    renderer?.setConstellation(localSpellNodes, edges, [])
  }
}

// ============================================
// CONVERGENCE CHECK
// ============================================

function checkConvergence(): void {
  if (!channel?.isMagePresent()) return

  const distance = channel.getOrbDistance()
  const CONVERGENCE_THRESHOLD = 60 // pixels

  if (distance < CONVERGENCE_THRESHOLD && localSpellNodes.length > 0) {
    triggerConvergence()
  }
}

function triggerConvergence(): void {
  console.log('[Swordsman Content] CONVERGENCE TRIGGERED!')

  // Notify Mage
  channel?.sendCeremonyBegin('dual_convergence')

  // Notify background
  chrome.runtime.sendMessage({
    type: 'CONVERGENCE',
    spellsCast: localSpellNodes.map(n => ({
      id: n.id,
      content: n.emoji || 'spell',
      yangYin: n.yangYin,
      position: { x: n.x, y: n.y }
    })),
    hexagramState: [1, 0, 1, 0, 1, 0] // TODO: Get from Mage
  })

  // TODO: Play convergence animation
  // TODO: Change cursor state to sovereign
}

// Check convergence periodically
setInterval(() => {
  if (channel?.isMagePresent()) {
    checkConvergence()
  }
}, 500)

// ============================================
// CLEANUP
// ============================================

function cleanup(): void {
  stopRenderLoop()
  renderer?.destroy()
  channel?.destroy()

  renderer = null
  tether = null
  mouse = null
  channel = null
}

// Cleanup on page unload
window.addEventListener('unload', cleanup)

// ============================================
// START
// ============================================

// Wait for DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize)
} else {
  initialize()
}

console.log('[Swordsman Content] Script loaded')
