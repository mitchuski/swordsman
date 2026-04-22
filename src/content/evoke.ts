/**
 * Evoke System - Inscriptions, Proverbs, and Emoji Spells
 *
 * Inspired by spellweb's inscription system:
 * - Each blade forging can trigger an evocation
 * - Evocations are tied to grimoire acts and proverbs
 * - Emoji spells encode semantic privacy assertions
 *
 * The evoke system provides the ceremonial layer on top of blade forging.
 */

import type { Blade, BladeLayer, HexagramState } from '@agentprivacy/shared-types'

// ============================================
// GRIMOIRE ACTS
// ============================================

export interface GrimoireAct {
  id: string
  actNumber: number
  title: string
  spell: string           // Emoji spell sequence
  proverb: string         // Wisdom statement
  spellbook: 'story' | 'zk' | 'canon' | 'parallel' | 'plurality'
  vrcLevel: number        // VRC attestation level
  layerRequired: BladeLayer
}

/**
 * The 15 foundational acts from the grimoire
 * Each maps to a VRC progression level
 */
export const GRIMOIRE_ACTS: GrimoireAct[] = [
  // Story Spellbook (WHAT)
  {
    id: 'act-01-venice',
    actNumber: 1,
    title: 'Venice, 1494 / The Drake\'s First Whisper',
    spell: '📖💰 → 🐉⏳ → ⚔️🔮',
    proverb: 'The ledger that balances itself in darkness still casts a shadow in the light.',
    spellbook: 'story',
    vrcLevel: 1,
    layerRequired: 0
  },
  {
    id: 'act-02-ceremony',
    actNumber: 2,
    title: 'The First Ceremony',
    spell: '🗡️ → 🍪⚔️ → 🔒 → 📖📝 → 🤝📜₁',
    proverb: 'Trust begins unarmored—the swordsman and mage test small betrayals before the first person may grant the keys to more powerful treasures.',
    spellbook: 'story',
    vrcLevel: 1,
    layerRequired: 1
  },
  {
    id: 'act-03-monastery',
    actNumber: 3,
    title: 'The Digital Monastery',
    spell: '🔐⛩️ → 🛡️ → ✨📖 → ⚖️',
    proverb: 'What is known selectively is power; what is known fully is surrender.',
    spellbook: 'story',
    vrcLevel: 3,
    layerRequired: 2
  },

  // ZK Spellbook (HOW)
  {
    id: 'act-04-proof',
    actNumber: 4,
    title: 'The Zero Knowledge Proof',
    spell: '🎭 → 🔏 → ✓ → 🚫👁️',
    proverb: 'To prove without revealing is the highest form of trust.',
    spellbook: 'zk',
    vrcLevel: 3,
    layerRequired: 2
  },
  {
    id: 'act-05-commitment',
    actNumber: 5,
    title: 'The Commitment Scheme',
    spell: '📦🔒 → ⏰ → 📦🔓 → ✓',
    proverb: 'A promise locked is worth more than a promise spoken.',
    spellbook: 'zk',
    vrcLevel: 10,
    layerRequired: 3
  },
  {
    id: 'act-06-nullifier',
    actNumber: 6,
    title: 'The Nullifier',
    spell: '🎫 → ❌ → 🔄🚫 → ✓',
    proverb: 'What has been spent cannot be spent again; this is the law of integrity.',
    spellbook: 'zk',
    vrcLevel: 10,
    layerRequired: 3
  },

  // Canon Spellbook (WHY)
  {
    id: 'act-07-zcash',
    actNumber: 7,
    title: 'The Zcash Protocol',
    spell: '💎🛡️ → 🌐 → ⚡ → 🔐',
    proverb: 'Privacy is not secrecy; it is the power to selectively reveal oneself.',
    spellbook: 'canon',
    vrcLevel: 15,
    layerRequired: 4
  },
  {
    id: 'act-08-inscription',
    actNumber: 8,
    title: 'The On-Chain Inscription',
    spell: '📜 → ⛓️ → 🔮 → ∞',
    proverb: 'What is inscribed endures; what endures becomes law.',
    spellbook: 'canon',
    vrcLevel: 15,
    layerRequired: 4
  },
  {
    id: 'act-09-wallet',
    actNumber: 9,
    title: 'The Sovereign Wallet',
    spell: '🔑🏠 → 🛡️ → 🗂️ → 👤',
    proverb: 'Your keys, your castle; your data, your domain.',
    spellbook: 'canon',
    vrcLevel: 30,
    layerRequired: 5
  },

  // Parallel Society Spellbook (EXIT)
  {
    id: 'act-10-exit',
    actNumber: 10,
    title: 'The Right to Exit',
    spell: '🚪 → 🏃 → 🌍 → 🆓',
    proverb: 'Freedom is not granted but exercised through the door always open.',
    spellbook: 'parallel',
    vrcLevel: 30,
    layerRequired: 5
  },
  {
    id: 'act-11-pseudonym',
    actNumber: 11,
    title: 'The Pseudonymous Identity',
    spell: '👤🎭 → 🔗 → 🌐 → 🔒',
    proverb: 'A name chosen is more honest than a name inherited.',
    spellbook: 'parallel',
    vrcLevel: 30,
    layerRequired: 5
  },
  {
    id: 'act-12-network',
    actNumber: 12,
    title: 'The Parallel Network',
    spell: '🌐🔀 → 🤝 → 🏗️ → 🌱',
    proverb: 'Build the world you wish to live in; do not wait for permission.',
    spellbook: 'parallel',
    vrcLevel: 30,
    layerRequired: 5
  },

  // Plurality Spellbook (COORDINATE)
  {
    id: 'act-13-quadratic',
    actNumber: 13,
    title: 'The Quadratic Mechanism',
    spell: '📊² → ⚖️ → 🗳️ → 🤝',
    proverb: 'The square of voices is more just than the sum.',
    spellbook: 'plurality',
    vrcLevel: 50,
    layerRequired: 6
  },
  {
    id: 'act-14-sybil',
    actNumber: 14,
    title: 'The Sybil Resistance',
    spell: '👥❌ → 🔍 → ✓ → 🛡️',
    proverb: 'One person, one voice—the foundation of coordination.',
    spellbook: 'plurality',
    vrcLevel: 50,
    layerRequired: 6
  },
  {
    id: 'act-15-drake',
    actNumber: 15,
    title: 'The Drake Awakens',
    spell: '🐉 → 🔥 → ⚔️🔮 → 👑',
    proverb: 'When swordsman and mage align, the drake rises to guard the realm.',
    spellbook: 'plurality',
    vrcLevel: 50,
    layerRequired: 6
  }
]

// ============================================
// EMOJI SPELL SEMANTICS
// ============================================

export interface EmojiSpellComponent {
  emoji: string
  meaning: string
  privacyDimension: number // 1-6, maps to hexagram line
  yangYin: 'yang' | 'yin' | 'neutral'
}

/**
 * Semantic mapping of emoji to privacy concepts
 */
export const EMOJI_SEMANTICS: Record<string, EmojiSpellComponent> = {
  // Protection/Defense (d1Hide)
  '🛡️': { emoji: '🛡️', meaning: 'Shield/Protect', privacyDimension: 1, yangYin: 'yang' },
  '🔒': { emoji: '🔒', meaning: 'Lock/Secure', privacyDimension: 1, yangYin: 'yang' },
  '🔐': { emoji: '🔐', meaning: 'Encrypted', privacyDimension: 1, yangYin: 'yang' },
  '🚫': { emoji: '🚫', meaning: 'Block/Deny', privacyDimension: 1, yangYin: 'yang' },

  // Commitment/Disclosure (d2Commit)
  '📦': { emoji: '📦', meaning: 'Commitment', privacyDimension: 2, yangYin: 'neutral' },
  '✓': { emoji: '✓', meaning: 'Verify', privacyDimension: 2, yangYin: 'yang' },
  '🎭': { emoji: '🎭', meaning: 'Selective Reveal', privacyDimension: 2, yangYin: 'yang' },
  '👁️': { emoji: '👁️', meaning: 'Observe/Expose', privacyDimension: 2, yangYin: 'yin' },

  // Proof/Verification (d3Prove)
  '🔮': { emoji: '🔮', meaning: 'Magic/Proof', privacyDimension: 3, yangYin: 'yang' },
  '⚖️': { emoji: '⚖️', meaning: 'Justice/Balance', privacyDimension: 3, yangYin: 'neutral' },
  '📜': { emoji: '📜', meaning: 'Contract/Scroll', privacyDimension: 3, yangYin: 'neutral' },
  '✨': { emoji: '✨', meaning: 'Transform', privacyDimension: 3, yangYin: 'yang' },

  // Connection/Data Residency (d4Connect)
  '🌐': { emoji: '🌐', meaning: 'Network/Web', privacyDimension: 4, yangYin: 'neutral' },
  '⛓️': { emoji: '⛓️', meaning: 'Chain/Immutable', privacyDimension: 4, yangYin: 'yang' },
  '🏠': { emoji: '🏠', meaning: 'Home/Local', privacyDimension: 4, yangYin: 'yang' },
  '🔗': { emoji: '🔗', meaning: 'Link/Connect', privacyDimension: 4, yangYin: 'neutral' },

  // Identity/Interaction Mode (d5Reflect)
  '👤': { emoji: '👤', meaning: 'Person/Self', privacyDimension: 5, yangYin: 'yang' },
  '🗡️': { emoji: '🗡️', meaning: 'Swordsman', privacyDimension: 5, yangYin: 'yang' },
  '📖': { emoji: '📖', meaning: 'Knowledge/Story', privacyDimension: 5, yangYin: 'neutral' },
  '🔑': { emoji: '🔑', meaning: 'Key/Authority', privacyDimension: 5, yangYin: 'yang' },

  // Delegation/Trust Boundary (d6Delegate)
  '🤝': { emoji: '🤝', meaning: 'Agreement', privacyDimension: 6, yangYin: 'neutral' },
  '🐉': { emoji: '🐉', meaning: 'Drake/Guardian', privacyDimension: 6, yangYin: 'yang' },
  '⚔️': { emoji: '⚔️', meaning: 'Swords Crossed', privacyDimension: 6, yangYin: 'neutral' },
  '👑': { emoji: '👑', meaning: 'Sovereignty', privacyDimension: 6, yangYin: 'yang' }
}

// ============================================
// EVOCATION
// ============================================

export interface Evocation {
  id: string
  act: GrimoireAct
  blade: Blade
  timestamp: number
  domain: string
  matchScore: number      // How well the blade matches the act (0-1)
}

/**
 * Find the best matching act for a blade
 */
export function findMatchingAct(blade: Blade, currentLayer: BladeLayer): GrimoireAct | null {
  // Filter acts by requirements
  const eligible = GRIMOIRE_ACTS.filter(act =>
    currentLayer >= act.layerRequired
  )

  if (eligible.length === 0) return null

  // Find best match based on layer proximity
  const sorted = eligible.sort((a, b) => {
    const aDistance = Math.abs(a.layerRequired - blade.layer)
    const bDistance = Math.abs(b.layerRequired - blade.layer)
    return aDistance - bDistance
  })

  return sorted[0]
}

/**
 * Calculate match score between blade and act
 */
export function calculateMatchScore(blade: Blade, act: GrimoireAct): number {
  // Base score from layer match
  const layerDiff = Math.abs(blade.layer - act.layerRequired)
  let score = 1 - (layerDiff / 6)

  // Bonus for same spellbook as blade's primary dimension
  const primaryDim = blade.hexagram.findIndex(l => l === 1) + 1
  const spellbookDimMap: Record<string, number> = {
    'story': 5,       // d5Reflect
    'zk': 2,          // d2Commit
    'canon': 4,       // d4Connect
    'parallel': 1,    // d1Hide
    'plurality': 6    // d6Delegate
  }

  if (spellbookDimMap[act.spellbook] === primaryDim) {
    score += 0.2
  }

  return Math.min(1, score)
}

/**
 * Parse emoji spell into components
 */
export function parseEmojiSpell(spell: string): EmojiSpellComponent[] {
  const components: EmojiSpellComponent[] = []

  // Extract emojis using regex
  const emojiRegex = /[\p{Emoji}]/gu
  const emojis = spell.match(emojiRegex) || []

  for (const emoji of emojis) {
    const semantic = EMOJI_SEMANTICS[emoji]
    if (semantic) {
      components.push(semantic)
    }
  }

  return components
}

/**
 * Create an evocation for a blade forging
 */
export function createEvocation(blade: Blade, currentLayer: BladeLayer): Evocation | null {
  const act = findMatchingAct(blade, currentLayer)
  if (!act) return null

  return {
    id: crypto.randomUUID(),
    act,
    blade,
    timestamp: Date.now(),
    domain: location.hostname,
    matchScore: calculateMatchScore(blade, act)
  }
}

// ============================================
// EVOCATION DISPLAY
// ============================================

/**
 * Generate evocation text for display
 */
export function formatEvocation(evocation: Evocation): string {
  const { act, blade, matchScore } = evocation

  return `
╔══════════════════════════════════════╗
║  ${act.spell}
║
║  "${act.proverb}"
║
║  — Act ${act.actNumber}: ${act.title}
║
║  Blade: ${blade.name} (Layer ${blade.layer})
║  Match: ${Math.round(matchScore * 100)}%
╚══════════════════════════════════════╝
  `.trim()
}

/**
 * Get evocation for current forge session
 */
export function getEvocationForForging(
  blade: Blade,
  currentLayer: BladeLayer
): { text: string; spell: string; proverb: string } | null {
  const evocation = createEvocation(blade, currentLayer)
  if (!evocation) return null

  return {
    text: formatEvocation(evocation),
    spell: evocation.act.spell,
    proverb: evocation.act.proverb
  }
}

// ============================================
// SPELL BOOK QUERIES
// ============================================

/**
 * Get all acts for a specific spellbook
 */
export function getActsBySpellbook(spellbook: GrimoireAct['spellbook']): GrimoireAct[] {
  return GRIMOIRE_ACTS.filter(act => act.spellbook === spellbook)
}

/**
 * Get acts available at a given VRC level
 */
export function getActsAtVRCLevel(vrcLevel: number): GrimoireAct[] {
  return GRIMOIRE_ACTS.filter(act => act.vrcLevel <= vrcLevel)
}

/**
 * Get the next act to unlock
 */
export function getNextActToUnlock(currentLayer: BladeLayer): GrimoireAct | null {
  const locked = GRIMOIRE_ACTS.filter(act => act.layerRequired > currentLayer)
  return locked.sort((a, b) => a.layerRequired - b.layerRequired)[0] || null
}
