/**
 * Swordsman Stance Types
 *
 * Unified stance system for the Swordsman extension, integrating:
 * - Privacy posture definitions
 * - Blade forge state
 * - Training ground repertoire sync
 *
 * The Swordsman (Master) deals in ASSERTION:
 * - 7 swords total: 6 active + 1 reserve
 * - Right-click tap = cast current stance
 * - Right-click hold = view stance menu
 * - S key = stance editor
 *
 * CONTROL SCHEME MATHEMATICS:
 * - 7 represents chakras, days of creation, musical notes
 * - 6 active + 1 reserve = completeness without excess
 * - Master acts decisively (low frequency, deliberate)
 */

// ============================================
// CORE STANCE TYPES
// ============================================

export type StanceSlot = 'active' | 'reserve'

export type PrivacyPosture =
  | 'guardian'      // Block tracking (DO_NOT_TRACK)
  | 'minimalist'    // Minimal data sharing (DATA_MINIMISATION)
  | 'fortress'      // Essential cookies only (COOKIE_ESSENTIAL_ONLY)
  | 'sovereign'     // Full user control (FULL_SOVEREIGNTY)
  | 'shadow'        // Maximum privacy (DO_NOT_SELL)
  | 'witness'       // Observe only mode (READ_ONLY)
  | 'reserve'       // Swappable reserve slot

export type MyTermsAssertion =
  | 'DO_NOT_TRACK'
  | 'DO_NOT_SELL'
  | 'DATA_MINIMISATION'
  | 'COOKIE_ESSENTIAL_ONLY'
  | 'FULL_SOVEREIGNTY'
  | 'READ_ONLY'
  | 'SELECTIVE_DISCLOSURE'
  | 'PROVERB_ASSERTION'
  | 'TRANSPARENCY_REQUEST'
  | 'EPHEMERAL_SESSION'

/**
 * Core stance definition - the Swordsman's privacy posture
 */
export interface SwordsmanStance {
  id: string
  name: string
  emoji: string
  emojiSequence?: string
  description: string
  slot: StanceSlot

  // MyTerms assertion (what privacy preference this stance asserts)
  myTermsMapping: MyTermsAssertion

  // Grimoire reference (from canon/story)
  grimoireId?: string
  proverb?: string

  // Weight for gap reduction (higher = more impact)
  weight: number

  // Visual properties (purple theme for Swordsman)
  color?: string
  glowColor?: string
}

/**
 * Stance cast event for history tracking
 */
export interface StanceCastEvent {
  stanceId: string
  timestamp: number
  position: { x: number; y: number }
  domain: string
  gapReduction: number
}

/**
 * Swordsman's stance loadout configuration
 * 7 total: 6 active + 1 reserve
 */
export interface SwordsmanLoadout {
  version: 2
  activeStances: SwordsmanStance[]   // 6 active stances in wheel
  reserveBlade: SwordsmanStance      // 1 reserve blade
  currentStance: number              // Index of current active stance
  hexagramState?: HexagramSnapshot
}

// ============================================
// BLADE FORGE TYPES
// ============================================

export type BladeLayer = 'assertion' | 'protection' | 'sovereignty'

export type BladeTier = 'light' | 'heavy' | 'dragon'

export interface ForgedBlade {
  id: string
  name: string
  layer: BladeLayer
  tier: BladeTier
  dimensions: BladeDimensions
  hexagram: number
  forgedAt: number
  forgedOnDomain: string
  constellationHash: string
}

export interface BladeDimensions {
  protection: boolean    // d1: Boundaries forged
  delegation: boolean    // d2: Agency transferred
  memory: boolean        // d3: State accumulated
  connection: boolean    // d4: Multi-party coordination
  computation: boolean   // d5: ZK proof active
  value: boolean         // d6: Economic flow
}

export interface BladeForgeState {
  forgedBlades: ForgedBlade[]
  currentLayer: BladeLayer
  totalForged: number
  lastForgeTimestamp?: number
}

// ============================================
// HEXAGRAM STATE
// ============================================

export interface HexagramSnapshot {
  lines: [0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1]
  number: number
  name: string
}

// ============================================
// REPERTOIRE TYPES (synced from training)
// ============================================

export interface SwordsmanRepertoire {
  version: '1.0'
  learnedStances: LearnedStance[]
  castHistory: StanceCastEvent[]
  forgeState: BladeForgeState
  trainingProgress: TrainingProgress
  lastUpdated: number
}

export interface LearnedStance {
  id: string
  myTermsMapping: MyTermsAssertion
  learnedAt: number
  learnedInSection: string
  weight: number
}

export interface TrainingProgress {
  sectionsVisited: string[]
  orbConvergenceCount: number
  stancesCastCount: number
  bladesForged: number
  pathUnlocked: boolean
  firstCastTimestamp?: number
}

// ============================================
// STORAGE KEYS
// ============================================

export const SWORDSMAN_STORAGE_KEYS = {
  repertoire: 'swordsman_repertoire',
  loadout: 'swordsman_loadout',
  castHistory: 'swordsman_cast_history',
  forgeState: 'swordsman_forge_state',
  hexagram: 'swordsman_hexagram_state'
} as const

// ============================================
// TYPE GUARDS
// ============================================

export function isActiveStance(stance: SwordsmanStance): boolean {
  return stance.slot === 'active'
}

export function isReserveStance(stance: SwordsmanStance): boolean {
  return stance.slot === 'reserve'
}

export function isBlockingAssertion(assertion: MyTermsAssertion): boolean {
  return ['DO_NOT_TRACK', 'DO_NOT_SELL', 'COOKIE_ESSENTIAL_ONLY'].includes(assertion)
}

export function isPassiveAssertion(assertion: MyTermsAssertion): boolean {
  return ['READ_ONLY', 'TRANSPARENCY_REQUEST'].includes(assertion)
}
