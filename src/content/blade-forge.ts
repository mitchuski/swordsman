/**
 * Blade Forge - Per-page blade forging using 6-dimensional privacy analysis
 *
 * Maps spellweb's 6 dimensions to hexagram lines:
 *   d1Hide     → Line 1: Key Custody (yang=self, yin=custodial)
 *   d2Commit   → Line 2: Credential Disclosure (yang=ZKP, yin=full)
 *   d3Prove    → Line 3: Agent Delegation (yang=self, yin=emissary)
 *   d4Connect  → Line 4: Data Residency (yang=local, yin=federated)
 *   d5Reflect  → Line 5: Interaction Mode (yang=1st person, yin=delegated)
 *   d6Delegate → Line 6: Trust Boundary (yang=closed, yin=open)
 *
 * The forge creates blades from the 64-blade manifold based on:
 * - Current page hexagram state (from privacy analysis)
 * - Spells cast on this page
 * - VRC attestation level
 */

import type {
  Blade,
  BladeLayer,
  BladeForge,
  Forging,
  HexagramState,
  BLADES_PER_LAYER
} from '@agentprivacy/shared-types'

import type { PageAnalysis } from './page-analyzer'

// ============================================
// 6-DIMENSIONAL ANALYSIS
// ============================================

export interface DimensionalAnalysis {
  d1Hide: number      // 0-1: Privacy of identity
  d2Commit: number    // 0-1: Commitment mechanism
  d3Prove: number     // 0-1: Proof requirements
  d4Connect: number   // 0-1: Connection topology
  d5Reflect: number   // 0-1: Self-reflection capability
  d6Delegate: number  // 0-1: Delegation patterns
}

/**
 * Analyze a page across the 6 dimensions
 */
export function analyzeDimensions(page: PageAnalysis): DimensionalAnalysis {
  // d1Hide: How well does the page hide user identity?
  // High if: no trackers, no fingerprinting, privacy policy exists
  const d1Hide = calculateHideScore(page)

  // d2Commit: Does the page use commitment schemes?
  // High if: has ZK proofs, uses commitments, cryptographic auth
  const d2Commit = calculateCommitScore(page)

  // d3Prove: What proof mechanisms are present?
  // High if: selective disclosure, verifiable credentials
  const d3Prove = calculateProveScore(page)

  // d4Connect: How is data connected/distributed?
  // High if: local storage, no cross-site requests, sovereign data
  const d4Connect = calculateConnectScore(page)

  // d5Reflect: Does the page support self-reflection?
  // High if: data portability, user dashboards, transparency
  const d5Reflect = calculateReflectScore(page)

  // d6Delegate: What delegation patterns exist?
  // High if: first-party only, no third-party delegation
  const d6Delegate = calculateDelegateScore(page)

  return { d1Hide, d2Commit, d3Prove, d4Connect, d5Reflect, d6Delegate }
}

function calculateHideScore(page: PageAnalysis): number {
  let score = 1.0

  // Trackers reduce hide score
  score -= page.trackerCount * 0.05

  // Cookies reduce score
  score -= page.cookieBannerDetected ? 0.1 : 0

  // Dark patterns severely reduce
  score -= page.darkPatterns.length * 0.15

  // Home territory bonus
  if (page.isHomeTurf) score += 0.3

  return Math.max(0, Math.min(1, score))
}

function calculateCommitScore(page: PageAnalysis): number {
  let score = 0.3 // Base low score

  // Look for ZK/crypto indicators in the page
  // This would be enhanced by Mage's deep scan
  if (page.isHomeTurf) score += 0.5

  // Privacy policy present indicates some commitment
  if (page.hasPrivacyPolicy) score += 0.1

  return Math.max(0, Math.min(1, score))
}

function calculateProveScore(page: PageAnalysis): number {
  let score = 0.2

  // Home territory has full prove capability
  if (page.isHomeTurf) score = 0.9

  // Fewer trackers suggests better proof handling
  score += (10 - Math.min(10, page.trackerCount)) * 0.03

  return Math.max(0, Math.min(1, score))
}

function calculateConnectScore(page: PageAnalysis): number {
  let score = 0.5

  // Trackers indicate federated/shared data
  score -= page.trackerCount * 0.04

  // Home territory is sovereign
  if (page.isHomeTurf) score = 1.0

  return Math.max(0, Math.min(1, score))
}

function calculateReflectScore(page: PageAnalysis): number {
  let score = 0.3

  // Privacy policy enables some reflection
  if (page.hasPrivacyPolicy) score += 0.2

  // Home territory has full transparency
  if (page.isHomeTurf) score = 0.95

  return Math.max(0, Math.min(1, score))
}

function calculateDelegateScore(page: PageAnalysis): number {
  let score = 0.5

  // Third-party trackers indicate delegation
  score -= page.trackerCount * 0.05

  // Cookie banners suggest delegation complexity
  if (page.cookieBannerDetected) score -= 0.15

  // Home territory has clean delegation
  if (page.isHomeTurf) score = 1.0

  return Math.max(0, Math.min(1, score))
}

// ============================================
// HEXAGRAM COMPUTATION
// ============================================

/**
 * Convert dimensional analysis to hexagram state
 * Each dimension maps to a line: ≥0.5 = yang (1), <0.5 = yin (0)
 */
export function dimensionsToHexagram(dims: DimensionalAnalysis): HexagramState {
  const threshold = 0.5
  return [
    dims.d1Hide >= threshold ? 1 : 0,
    dims.d2Commit >= threshold ? 1 : 0,
    dims.d3Prove >= threshold ? 1 : 0,
    dims.d4Connect >= threshold ? 1 : 0,
    dims.d5Reflect >= threshold ? 1 : 0,
    dims.d6Delegate >= threshold ? 1 : 0
  ] as HexagramState
}

/**
 * Convert hexagram state to blade ID (0-63)
 */
export function hexagramToBladeId(hex: HexagramState): number {
  // Binary encoding: line 1 = LSB, line 6 = MSB
  return hex[0] + hex[1] * 2 + hex[2] * 4 + hex[3] * 8 + hex[4] * 16 + hex[5] * 32
}

/**
 * Get blade layer from blade ID
 * Based on number of yang lines (popcount)
 */
export function getBladeLayer(bladeId: number): BladeLayer {
  // Count 1 bits = number of yang lines
  let yangCount = 0
  let n = bladeId
  while (n) {
    yangCount += n & 1
    n >>= 1
  }
  return yangCount as BladeLayer
}

/**
 * Get hexagram number (1-64) using King Wen sequence
 * This maps the binary blade ID to traditional I Ching ordering
 */
export function getHexagramNumber(bladeId: number): number {
  // King Wen sequence - maps binary index to traditional hexagram number
  const kingWen = [
    2, 23, 8, 20, 16, 35, 45, 12,  // 0-7
    15, 52, 39, 53, 62, 56, 31, 33, // 8-15
    7, 4, 29, 59, 40, 64, 47, 6,   // 16-23
    46, 18, 48, 57, 32, 50, 28, 44, // 24-31
    24, 27, 3, 42, 51, 21, 17, 25, // 32-39
    36, 22, 63, 37, 55, 30, 49, 13, // 40-47
    19, 41, 60, 61, 54, 38, 58, 10, // 48-55
    11, 26, 5, 9, 34, 14, 43, 1    // 56-63
  ]
  return kingWen[bladeId]
}

// ============================================
// BLADE DEFINITIONS
// ============================================

const HEXAGRAM_NAMES: Record<number, string> = {
  1: 'The Creative (Qian)',
  2: 'The Receptive (Kun)',
  3: 'Difficulty at the Beginning',
  4: 'Youthful Folly',
  5: 'Waiting',
  6: 'Conflict',
  7: 'The Army',
  8: 'Holding Together',
  // ... full 64 would be added
  63: 'After Completion',
  64: 'Before Completion'
}

/**
 * Generate blade definition from hexagram state
 */
export function createBladeFromHexagram(hex: HexagramState): Blade {
  const bladeId = hexagramToBladeId(hex)
  const layer = getBladeLayer(bladeId)
  const hexNumber = getHexagramNumber(bladeId)

  // Generate emoji based on layer
  const layerEmojis = ['⚫', '🗡️', '⚔️', '🔱', '💠', '🌟', '🐉']

  // Generate assertion based on active yang lines
  const yangLineAssertions = [
    'SELF_CUSTODY',
    'SELECTIVE_DISCLOSURE',
    'SELF_EXECUTE',
    'LOCAL_DATA',
    'FIRST_PERSON',
    'CLOSED_PERIMETER'
  ]
  const activeTerms = hex
    .map((line, i) => line === 1 ? yangLineAssertions[i] : null)
    .filter(Boolean) as string[]

  return {
    id: bladeId,
    name: HEXAGRAM_NAMES[hexNumber] || `Blade ${bladeId}`,
    layer,
    edges: layer, // Number of active dimensions

    hexagram: hex,

    assertion: {
      terms: activeTerms as any[],
      emoji: layerEmojis[layer],
      description: `Layer ${layer} blade with ${layer} active privacy dimensions`
    },

    zk: {
      statement: `User asserts ${activeTerms.join(' ∧ ')}`,
      witnessType: 'spell_constellation_hash',
      verifiable: layer >= 3 // Layer 3+ can be verified on-chain
    },

    unlock: {
      requiredLevel: Math.max(0, layer - 1) as BladeLayer,
      requiredForgings: layer * 3,
      requiredDomains: Math.floor(layer / 2)
    }
  }
}

// ============================================
// FORGE STATE MANAGEMENT
// ============================================

interface ForgeState {
  forge: BladeForge
  currentPageDimensions: DimensionalAnalysis | null
  currentPageHexagram: HexagramState | null
  pendingForging: Partial<Forging> | null
}

let state: ForgeState = {
  forge: {
    currentLayer: 0,
    highestBlade: null,
    forgings: [],
    totalForgings: 0,
    domainsForged: [],
    unlockedBlades: [0], // Start with null blade
    progress: {
      forgingsToNextLayer: 3,
      domainsToNextLayer: 1
    }
  },
  currentPageDimensions: null,
  currentPageHexagram: null,
  pendingForging: null
}

/**
 * Initialize forge from storage
 */
export async function initializeForge(): Promise<BladeForge> {
  const stored = await chrome.storage.local.get('blade_forge')
  if (stored.blade_forge) {
    state.forge = stored.blade_forge
  }
  return state.forge
}

/**
 * Save forge state to storage
 */
async function saveForge(): Promise<void> {
  await chrome.storage.local.set({ blade_forge: state.forge })
}

/**
 * Analyze current page and prepare for forging
 */
export function analyzePageForForging(page: PageAnalysis): {
  dimensions: DimensionalAnalysis
  hexagram: HexagramState
  potentialBlade: Blade
  canForge: boolean
} {
  const dimensions = analyzeDimensions(page)
  const hexagram = dimensionsToHexagram(dimensions)
  const potentialBlade = createBladeFromHexagram(hexagram)

  // Check if user can forge this blade
  const canForge = checkCanForge(potentialBlade)

  state.currentPageDimensions = dimensions
  state.currentPageHexagram = hexagram

  return { dimensions, hexagram, potentialBlade, canForge }
}

function checkCanForge(blade: Blade): boolean {
  // Check if blade is already unlocked
  if (state.forge.unlockedBlades.includes(blade.id)) {
    return true // Can re-forge
  }

  // Check unlock requirements
  const { requiredLevel, requiredForgings, requiredDomains } = blade.unlock

  if (state.forge.currentLayer < requiredLevel) return false
  if (requiredForgings && state.forge.totalForgings < requiredForgings) return false
  if (requiredDomains && state.forge.domainsForged.length < requiredDomains) return false

  return true
}

/**
 * Forge a blade on the current page
 */
export async function forgeBlade(
  spellSignatures: string[],
  constellationHash: string
): Promise<Forging | null> {
  if (!state.currentPageHexagram) {
    console.warn('[BladeForge] No hexagram computed for current page')
    return null
  }

  const blade = createBladeFromHexagram(state.currentPageHexagram)

  if (!checkCanForge(blade)) {
    console.warn('[BladeForge] Cannot forge blade', blade.id, '- requirements not met')
    return null
  }

  const forging: Forging = {
    id: crypto.randomUUID(),
    blade,
    domain: location.hostname,
    timestamp: Date.now(),
    witness: {
      constellationHash,
      signatureChain: spellSignatures,
      hexagramAtForge: state.currentPageHexagram
    },
    proof: {
      type: 'local'
    }
  }

  // Update forge state
  state.forge.forgings.push(forging)
  state.forge.totalForgings++

  if (!state.forge.domainsForged.includes(forging.domain)) {
    state.forge.domainsForged.push(forging.domain)
  }

  if (!state.forge.unlockedBlades.includes(blade.id)) {
    state.forge.unlockedBlades.push(blade.id)
  }

  // Update highest blade
  if (!state.forge.highestBlade || blade.layer > state.forge.highestBlade.layer) {
    state.forge.highestBlade = blade
  }

  // Check layer progression
  updateLayerProgression()

  // Save to storage
  await saveForge()

  console.log('[BladeForge] Forged blade:', blade.name, 'layer:', blade.layer)

  return forging
}

function updateLayerProgression(): void {
  const { totalForgings, domainsForged, currentLayer } = state.forge

  // VRC-style progression: 1, 3, 10, 15, 30
  const vrcThresholds = [1, 3, 10, 15, 30, 50]
  const domainThresholds = [0, 1, 3, 5, 10, 20]

  let newLayer = 0
  for (let i = 0; i < vrcThresholds.length; i++) {
    if (totalForgings >= vrcThresholds[i] && domainsForged.length >= domainThresholds[i]) {
      newLayer = i
    }
  }

  if (newLayer > currentLayer) {
    state.forge.currentLayer = newLayer as BladeLayer
    console.log('[BladeForge] LEVEL UP! Now at layer', newLayer)
  }

  // Update progress to next layer
  const nextLevel = Math.min(6, currentLayer + 1)
  state.forge.progress = {
    forgingsToNextLayer: Math.max(0, vrcThresholds[nextLevel] - totalForgings),
    domainsToNextLayer: Math.max(0, domainThresholds[nextLevel] - domainsForged.length)
  }
}

// ============================================
// EXPORTS
// ============================================

export function getForgeState(): BladeForge {
  return state.forge
}

export function getCurrentHexagram(): HexagramState | null {
  return state.currentPageHexagram
}

export function getCurrentDimensions(): DimensionalAnalysis | null {
  return state.currentPageDimensions
}
