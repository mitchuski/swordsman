/**
 * Swordsman Effect Presets
 *
 * Built-in cursor effects for the Swordsman extension.
 * These use spring physics and emphasize protection/assertion.
 */

import type { PretextEffect } from '@agentprivacy/shared-types'

export const SWORDSMAN_PRESETS: PretextEffect[] = [
  // ============================================
  // CLASSIC PRESETS
  // ============================================
  {
    id: 'blade-classic',
    name: 'Classic Blade',
    type: 'preset',
    visual: {
      emoji: '⚔️',
      scale: 1.2,
      cssFilter: 'drop-shadow(0 0 3px rgba(83, 74, 183, 0.6))'
    },
    physics: {
      mode: 'spring',
      stiffness: 0.08,
      damping: 0.85
    },
    trail: {
      enabled: true,
      length: 8,
      fadeRate: 0.15,
      style: 'solid'
    },
    animations: {
      onClick: 'slash',
      onHover: 'glow'
    },
    createdAt: 0,
    source: 'builtin',
    extension: 'swordsman'
  },

  {
    id: 'shield-guard',
    name: 'Shield Guard',
    type: 'preset',
    visual: {
      emoji: '🛡️',
      scale: 1.0,
      cssFilter: 'drop-shadow(0 0 4px rgba(83, 74, 183, 0.5))'
    },
    physics: {
      mode: 'spring',
      stiffness: 0.04,
      damping: 0.9
    },
    trail: {
      enabled: false,
      length: 0,
      fadeRate: 0
    },
    animations: {
      onClick: 'ripple',
      onHover: 'glow'
    },
    createdAt: 0,
    source: 'builtin',
    extension: 'swordsman'
  },

  {
    id: 'dragon-flame',
    name: 'Dragon Flame',
    type: 'preset',
    visual: {
      emoji: '🐉',
      scale: 1.5,
      cssFilter: 'drop-shadow(0 0 6px rgba(239, 159, 39, 0.7))'
    },
    physics: {
      mode: 'spring',
      stiffness: 0.06,
      damping: 0.82
    },
    trail: {
      enabled: true,
      length: 12,
      fadeRate: 0.1,
      color: '#EF9F27',
      style: 'particles'
    },
    animations: {
      onClick: 'burst',
      onHover: 'glow',
      onConvergence: 'explosion'
    },
    createdAt: 0,
    source: 'builtin',
    extension: 'swordsman'
  },

  // ============================================
  // MINIMAL PRESETS
  // ============================================
  {
    id: 'minimal-dot',
    name: 'Minimal Dot',
    type: 'preset',
    visual: {
      emoji: '•',
      scale: 2.0,
      color: '#534AB7'
    },
    physics: {
      mode: 'spring',
      stiffness: 0.1,
      damping: 0.88
    },
    trail: {
      enabled: true,
      length: 5,
      fadeRate: 0.2,
      style: 'dotted'
    },
    animations: {
      onClick: 'pulse'
    },
    createdAt: 0,
    source: 'builtin',
    extension: 'swordsman'
  },

  {
    id: 'cross-guard',
    name: 'Cross Guard',
    type: 'preset',
    visual: {
      emoji: '✚',
      scale: 1.3,
      color: '#534AB7',
      cssFilter: 'drop-shadow(0 0 2px rgba(83, 74, 183, 0.8))'
    },
    physics: {
      mode: 'spring',
      stiffness: 0.05,
      damping: 0.87
    },
    trail: {
      enabled: false,
      length: 0,
      fadeRate: 0
    },
    animations: {
      onClick: 'ripple',
      onHover: 'spin'
    },
    createdAt: 0,
    source: 'builtin',
    extension: 'swordsman'
  },

  // ============================================
  // EXPRESSIVE PRESETS
  // ============================================
  {
    id: 'lightning-strike',
    name: 'Lightning Strike',
    type: 'preset',
    visual: {
      emoji: '⚡',
      scale: 1.4,
      cssFilter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.8))'
    },
    physics: {
      mode: 'spring',
      stiffness: 0.15,
      damping: 0.78
    },
    trail: {
      enabled: true,
      length: 6,
      fadeRate: 0.25,
      color: '#FFD700',
      style: 'solid'
    },
    animations: {
      onClick: 'burst',
      onScroll: 'stretch'
    },
    createdAt: 0,
    source: 'builtin',
    extension: 'swordsman'
  },

  {
    id: 'eye-of-sovereignty',
    name: 'Eye of Sovereignty',
    type: 'preset',
    visual: {
      emoji: '👁️',
      scale: 1.1,
      cssFilter: 'drop-shadow(0 0 3px rgba(83, 74, 183, 0.6))'
    },
    physics: {
      mode: 'spring',
      stiffness: 0.03,
      damping: 0.92
    },
    trail: {
      enabled: false,
      length: 0,
      fadeRate: 0
    },
    animations: {
      onClick: 'pulse',
      onHover: 'glow'
    },
    createdAt: 0,
    source: 'builtin',
    extension: 'swordsman'
  },

  {
    id: 'privacy-lock',
    name: 'Privacy Lock',
    type: 'preset',
    visual: {
      emoji: '🔒',
      scale: 1.0,
      cssFilter: 'drop-shadow(0 0 2px rgba(83, 74, 183, 0.5))'
    },
    physics: {
      mode: 'spring',
      stiffness: 0.06,
      damping: 0.88
    },
    trail: {
      enabled: true,
      length: 4,
      fadeRate: 0.2,
      style: 'solid'
    },
    animations: {
      onClick: 'ripple'
    },
    createdAt: 0,
    source: 'builtin',
    extension: 'swordsman'
  }
]

/**
 * Get all Swordsman presets
 */
export function getSwordsmanPresets(): PretextEffect[] {
  return SWORDSMAN_PRESETS
}

/**
 * Get a specific preset by ID
 */
export function getSwordsmanPreset(id: string): PretextEffect | undefined {
  return SWORDSMAN_PRESETS.find(p => p.id === id)
}
