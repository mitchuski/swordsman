/**
 * Swordsman Stance Definitions
 *
 * The 7 swords of the Master:
 * - 6 Active stances (quick access via right-click hold)
 * - 1 Reserve blade (swappable via S key editor)
 *
 * Each stance maps to:
 * - A MyTerms assertion (privacy preference)
 * - A grimoire entry (proverb + emoji sequence)
 * - A privacy posture (blocking/passive/sovereign)
 *
 * The Swordsman ASSERTS - projecting sovereignty onto the page.
 *
 * CONTROL SCHEME:
 * - Right-click tap: Cast current stance
 * - Right-click hold: Show stance wheel (6 active)
 * - S key: Open stance editor
 * - Ctrl+Shift+1-6: Quick cast active stance
 * - Ctrl+Shift+7: Quick cast reserve blade
 */

import type { SwordsmanStance, SwordsmanLoadout } from './stance-types'

// ============================================
// 6 ACTIVE STANCES (Right-click hold menu)
// ============================================

export const ACTIVE_STANCES: SwordsmanStance[] = [
  {
    id: 'guardian',
    name: 'Guardian',
    emoji: '🛡️',
    emojiSequence: '🛡️⚔️',
    description: 'Block all tracking',
    slot: 'active',
    grimoireId: 'canon-chapter-3',
    proverb: 'Privacy is necessary for an open society.',
    myTermsMapping: 'DO_NOT_TRACK',
    weight: 3,
    color: '#534AB7',
    glowColor: 'rgba(83, 74, 183, 0.5)'
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    emoji: '✂️',
    emojiSequence: '✂️📉',
    description: 'Minimal data sharing',
    slot: 'active',
    grimoireId: 'act-03-gap',
    proverb: 'The gap is where you live.',
    myTermsMapping: 'DATA_MINIMISATION',
    weight: 3,
    color: '#7B68EE',
    glowColor: 'rgba(123, 104, 238, 0.5)'
  },
  {
    id: 'fortress',
    name: 'Fortress',
    emoji: '🏰',
    emojiSequence: '🏰🔒',
    description: 'Essential cookies only',
    slot: 'active',
    grimoireId: 'act-12-forgetting',
    proverb: 'To forget is not weakness but sovereignty over memory.',
    myTermsMapping: 'COOKIE_ESSENTIAL_ONLY',
    weight: 4,
    color: '#6A5ACD',
    glowColor: 'rgba(106, 90, 205, 0.5)'
  },
  {
    id: 'sovereign',
    name: 'Sovereign',
    emoji: '👑',
    emojiSequence: '👑✨⚖️',
    description: 'Full user control',
    slot: 'active',
    grimoireId: 'act-26-sovereign',
    proverb: 'Sovereignty is not given but exercised.',
    myTermsMapping: 'FULL_SOVEREIGNTY',
    weight: 5,
    color: '#9370DB',
    glowColor: 'rgba(147, 112, 219, 0.6)'
  },
  {
    id: 'shadow',
    name: 'Shadow',
    emoji: '🌑',
    emojiSequence: '🌑🌙✨',
    description: 'Maximum privacy',
    slot: 'active',
    grimoireId: 'act-09-zcash-shield',
    proverb: 'The shield is not armor but absence—you cannot strike what is not there.',
    myTermsMapping: 'DO_NOT_SELL',
    weight: 4,
    color: '#483D8B',
    glowColor: 'rgba(72, 61, 139, 0.5)'
  },
  {
    id: 'witness',
    name: 'Witness',
    emoji: '👁️',
    emojiSequence: '👁️📖',
    description: 'Observe only',
    slot: 'active',
    grimoireId: 'act-07-mirror',
    proverb: 'The mirror shows not what we wish, but what we are.',
    myTermsMapping: 'READ_ONLY',
    weight: 2,
    color: '#8A2BE2',
    glowColor: 'rgba(138, 43, 226, 0.5)'
  }
]

// ============================================
// 1 RESERVE BLADE (Swappable via editor)
// ============================================

export const DEFAULT_RESERVE_BLADE: SwordsmanStance = {
  id: 'proverb',
  name: 'Proverb',
  emoji: '📜',
  emojiSequence: '📜✍️💬',
  description: 'Invoke grimoire wisdom',
  slot: 'reserve',
  grimoireId: 'act-13-book-of-promises',
  proverb: 'The book of promises binds without chains.',
  myTermsMapping: 'PROVERB_ASSERTION',
  weight: 2,
  color: '#9932CC',
  glowColor: 'rgba(153, 50, 204, 0.5)'
}

// ============================================
// ALL 7 SWORDS
// ============================================

export const ALL_STANCES: SwordsmanStance[] = [...ACTIVE_STANCES, DEFAULT_RESERVE_BLADE]

// ============================================
// EXTENDED STANCE LIBRARY (unlockable)
// ============================================

/**
 * Additional stances that can be swapped into active/reserve slots
 * These are unlocked through training or blade forging
 */
export const EXTENDED_STANCES: SwordsmanStance[] = [
  // From Zero Knowledge
  {
    id: 'cipher',
    name: 'Cipher',
    emoji: '🔐',
    emojiSequence: '🔐⚡✓',
    description: 'Encrypted assertion',
    slot: 'reserve',
    grimoireId: 'zero-tale-5',
    proverb: 'The proof convinces without revealing the secret.',
    myTermsMapping: 'SELECTIVE_DISCLOSURE',
    weight: 4,
    color: '#4B0082',
    glowColor: 'rgba(75, 0, 130, 0.5)'
  },
  // From Canon
  {
    id: 'cypherpunk',
    name: 'Cypherpunk',
    emoji: '⚡',
    emojiSequence: '⚡🔑🛡️',
    description: 'Invoke cypherpunk lineage',
    slot: 'reserve',
    grimoireId: 'canon-chapter-1',
    proverb: 'We must defend our own privacy if we expect to have any.',
    myTermsMapping: 'DO_NOT_TRACK',
    weight: 3,
    color: '#663399',
    glowColor: 'rgba(102, 51, 153, 0.5)'
  },
  // From Society
  {
    id: 'exit',
    name: 'Exit',
    emoji: '🚪',
    emojiSequence: '🚪➡️🏝️',
    description: 'Parallel society exit',
    slot: 'reserve',
    grimoireId: 'parallel-1',
    proverb: 'Exit is the ultimate expression of voice.',
    myTermsMapping: 'FULL_SOVEREIGNTY',
    weight: 3,
    color: '#8B008B',
    glowColor: 'rgba(139, 0, 139, 0.5)'
  },
  // From Plurality
  {
    id: 'plural',
    name: 'Plural',
    emoji: '⿻',
    emojiSequence: '⿻🤝🌐',
    description: 'Plural coordination',
    slot: 'reserve',
    grimoireId: 'plurality-act-1',
    proverb: 'Plurality is collaborative technology for collaborative society.',
    myTermsMapping: 'SELECTIVE_DISCLOSURE',
    weight: 3,
    color: '#9400D3',
    glowColor: 'rgba(148, 0, 211, 0.5)'
  },
  // Dragon stance (unlocked through convergence)
  {
    id: 'dragon',
    name: 'Dragon',
    emoji: '🐉',
    emojiSequence: '🐉🔥✨',
    description: 'Summon the manifold dragon',
    slot: 'reserve',
    grimoireId: 'act-23-manifold-dragon',
    proverb: 'The dragon is not one but many, not many but one.',
    myTermsMapping: 'FULL_SOVEREIGNTY',
    weight: 5,
    color: '#BA55D3',
    glowColor: 'rgba(186, 85, 211, 0.7)'
  },
  // Ephemeral stance
  {
    id: 'ephemeral',
    name: 'Ephemeral',
    emoji: '💨',
    emojiSequence: '💨🌧️',
    description: 'Session-only mode',
    slot: 'reserve',
    grimoireId: 'act-15-weather',
    proverb: 'Build weather, not monuments.',
    myTermsMapping: 'EPHEMERAL_SESSION',
    weight: 2,
    color: '#DDA0DD',
    glowColor: 'rgba(221, 160, 221, 0.5)'
  }
]

// ============================================
// DEFAULT LOADOUT
// ============================================

export function getDefaultLoadout(): SwordsmanLoadout {
  return {
    version: 2,
    activeStances: [...ACTIVE_STANCES],
    reserveBlade: DEFAULT_RESERVE_BLADE,
    currentStance: 0
  }
}

// ============================================
// STANCE LOOKUP
// ============================================

export function getStanceById(id: string): SwordsmanStance | undefined {
  return ALL_STANCES.find(s => s.id === id) ||
         EXTENDED_STANCES.find(s => s.id === id)
}

export function getStanceByGrimoireId(grimoireId: string): SwordsmanStance | undefined {
  return ALL_STANCES.find(s => s.grimoireId === grimoireId) ||
         EXTENDED_STANCES.find(s => s.grimoireId === grimoireId)
}

export function getStancesByAssertion(assertion: string): SwordsmanStance[] {
  return [...ALL_STANCES, ...EXTENDED_STANCES].filter(s => s.myTermsMapping === assertion)
}

export function getBlockingStances(): SwordsmanStance[] {
  const blockingAssertions = ['DO_NOT_TRACK', 'DO_NOT_SELL', 'COOKIE_ESSENTIAL_ONLY']
  return ALL_STANCES.filter(s => blockingAssertions.includes(s.myTermsMapping))
}

export function getPassiveStances(): SwordsmanStance[] {
  const passiveAssertions = ['READ_ONLY', 'TRANSPARENCY_REQUEST']
  return ALL_STANCES.filter(s => passiveAssertions.includes(s.myTermsMapping))
}

// ============================================
// STANCE MATHEMATICS
// ============================================

/**
 * 7 swords = complete coverage of the sovereignty spectrum
 * 6 active + 1 reserve
 *
 * The 7 represents:
 * - Chakras: 7 energy centers
 * - Days of creation: 6 + 1 rest
 * - Musical notes: 7 before the octave
 * - The 7th capital: privacy as foundation
 *
 * The Swordsman deals in ASSERTION and POSTURE.
 */
export const STANCE_MATHEMATICS = {
  total: 7,
  active: 6,
  reserve: 1,
  blockingCount: getBlockingStances().length,
  passiveCount: getPassiveStances().length,
  chakraRepresentation: '7 stances = 7 chakras = sovereignty over the body'
} as const

// ============================================
// GAP REDUCTION WEIGHTS
// ============================================

/**
 * Calculate total gap reduction from a stance cast
 */
export function calculateGapReduction(stance: SwordsmanStance, currentGap: number): number {
  // Base reduction from stance weight
  let reduction = stance.weight * 2

  // Blocking stances have stronger effect on high-gap pages
  if (['DO_NOT_TRACK', 'DO_NOT_SELL', 'COOKIE_ESSENTIAL_ONLY'].includes(stance.myTermsMapping)) {
    reduction += Math.floor(currentGap / 20)
  }

  // Sovereign stance has maximum effect
  if (stance.myTermsMapping === 'FULL_SOVEREIGNTY') {
    reduction += 5
  }

  return Math.min(reduction, currentGap) // Can't reduce below 0
}
