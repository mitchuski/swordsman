/**
 * Swordsman Blade Library
 *
 * Unified stance system exports for the Swordsman extension
 */

// Types
export type {
  StanceSlot,
  PrivacyPosture,
  MyTermsAssertion,
  SwordsmanStance,
  StanceCastEvent,
  SwordsmanLoadout,
  BladeLayer,
  BladeTier,
  ForgedBlade,
  BladeDimensions,
  BladeForgeState,
  HexagramSnapshot,
  SwordsmanRepertoire,
  LearnedStance,
  TrainingProgress
} from './stance-types'

// Type guards
export {
  isActiveStance,
  isReserveStance,
  isBlockingAssertion,
  isPassiveAssertion,
  SWORDSMAN_STORAGE_KEYS
} from './stance-types'

// Stance definitions
export {
  ACTIVE_STANCES,
  DEFAULT_RESERVE_BLADE,
  ALL_STANCES,
  EXTENDED_STANCES,
  getDefaultLoadout,
  getStanceById,
  getStanceByGrimoireId,
  getStancesByAssertion,
  getBlockingStances,
  getPassiveStances,
  STANCE_MATHEMATICS,
  calculateGapReduction
} from './stance-definitions'

// Posture sync
export {
  REPERTOIRE_STORAGE_KEY,
  LOADOUT_STORAGE_KEY,
  FORGE_STATE_KEY,
  CAST_HISTORY_KEY,
  isHomeDomain,
  getRepertoireFromStorage,
  getLoadoutFromStorage,
  saveLoadoutToStorage,
  getForgeStateFromStorage,
  saveForgeStateToStorage,
  syncFromTrainingGround,
  updateLoadoutWithUnlocked,
  broadcastStanceCast,
  broadcastBladeForged,
  broadcastConvergence,
  announceSwordsmanPresence,
  broadcastGapReduction,
  setupWebsiteListener,
  recordStanceCast,
  getCastHistory,
  getSwordsmanStats,
  recordForgedBlade,
  getForgedBladesForDomain
} from './posture-sync'

export type { WebsiteMessage, WebsiteEventHandler } from './posture-sync'

// UOR (Universal Object Reference) - Ring algebra Z/(2^6)Z
export {
  UOR,
  RING_MODULUS,
  BIT_WIDTH,
  MAX_VALUE,
  getTier,
  TIER_COLORS,
  PASCAL_ROW_6,
  DIMENSIONS,
  NOTABLE_BLADES,
  DihedralGroup,
  HOLOGRAPHIC,
  contentAddress,
  ZK_PRINCIPLE,
  MODULE_INFO as UOR_INFO
} from './uor'

export type {
  TriadicCoordinates,
  BladeTier as UORBladeTier
} from './uor'
