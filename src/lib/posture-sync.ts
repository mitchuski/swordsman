/**
 * Posture Sync Module
 *
 * Handles bidirectional sync between the Swordsman extension and training ground:
 *
 * WEBSITE → EXTENSION (localStorage read on agentprivacy.ai):
 * - Reads from localStorage['agentprivacy_spell_repertoire']
 * - Syncs training progress
 * - Updates unlocked stances based on progress
 *
 * EXTENSION → WEBSITE (postMessage):
 * - Broadcasts stance casts
 * - Sends blade forge events
 * - Reports convergence with Mage
 *
 * This maintains the separation principle:
 * - Website owns training progress
 * - Extension owns assertion mechanics & blade forge
 * - localStorage is the sync bridge
 */

import type {
  SwordsmanStance,
  SwordsmanLoadout,
  StanceCastEvent,
  TrainingProgress,
  BladeForgeState,
  ForgedBlade,
  HexagramSnapshot
} from './stance-types'
import {
  ALL_STANCES,
  EXTENDED_STANCES,
  getDefaultLoadout,
  getStanceById,
  calculateGapReduction
} from './stance-definitions'

// ============================================
// CONSTANTS
// ============================================

export const REPERTOIRE_STORAGE_KEY = 'agentprivacy_spell_repertoire'
export const LOADOUT_STORAGE_KEY = 'swordsman_loadout'
export const FORGE_STATE_KEY = 'swordsman_forge_state'
export const CAST_HISTORY_KEY = 'swordsman_cast_history'

const HOME_DOMAINS = [
  'agentprivacy.ai',
  'www.agentprivacy.ai',
  'localhost',
  '127.0.0.1'
]

// ============================================
// WEBSITE MESSAGE TYPES
// ============================================

export type WebsiteMessage =
  | { type: 'STANCE_CAST'; stanceId: string; myTermsMapping: string; position: { x: number; y: number }; domain: string }
  | { type: 'BLADE_FORGED'; blade: ForgedBlade; domain: string }
  | { type: 'CONVERGENCE'; spellCount: number; stanceCount: number; timestamp: number }
  | { type: 'SWORD_PRESENT'; domain: string; orbPosition: { x: number; y: number }; myTermsState: unknown }
  | { type: 'GAP_REDUCED'; domain: string; oldGap: number; newGap: number; stanceId: string }

// ============================================
// STORAGE OPERATIONS
// ============================================

/**
 * Check if we're on a home territory domain (can read training data)
 */
export function isHomeDomain(): boolean {
  const host = location.hostname.replace('www.', '')
  return HOME_DOMAINS.includes(host)
}

/**
 * Get training repertoire from localStorage (only on home domains)
 */
export function getRepertoireFromStorage(): TrainingRepertoire | null {
  if (!isHomeDomain()) return null

  try {
    const raw = localStorage.getItem(REPERTOIRE_STORAGE_KEY)
    if (!raw) return null

    const data = JSON.parse(raw)
    if (data.version !== '1.0') {
      console.warn('[PostureSync] Unknown repertoire version:', data.version)
      return null
    }

    return data as TrainingRepertoire
  } catch (e) {
    console.error('[PostureSync] Failed to load repertoire:', e)
    return null
  }
}

interface TrainingRepertoire {
  version: '1.0'
  learnedSpells: any[]
  castHistory: any[]
  trainingProgress: TrainingProgress
  lastUpdated: number
}

/**
 * Get the Swordsman's stance loadout from chrome.storage
 */
export async function getLoadoutFromStorage(): Promise<SwordsmanLoadout> {
  return new Promise((resolve) => {
    chrome.storage.local.get([LOADOUT_STORAGE_KEY], (result) => {
      if (result[LOADOUT_STORAGE_KEY]) {
        resolve(result[LOADOUT_STORAGE_KEY] as SwordsmanLoadout)
      } else {
        resolve(getDefaultLoadout())
      }
    })
  })
}

/**
 * Save the Swordsman's stance loadout to chrome.storage
 */
export async function saveLoadoutToStorage(loadout: SwordsmanLoadout): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [LOADOUT_STORAGE_KEY]: loadout }, resolve)
  })
}

/**
 * Get blade forge state from chrome.storage
 */
export async function getForgeStateFromStorage(): Promise<BladeForgeState> {
  return new Promise((resolve) => {
    chrome.storage.local.get([FORGE_STATE_KEY], (result) => {
      if (result[FORGE_STATE_KEY]) {
        resolve(result[FORGE_STATE_KEY] as BladeForgeState)
      } else {
        resolve({
          forgedBlades: [],
          currentLayer: 'assertion',
          totalForged: 0
        })
      }
    })
  })
}

/**
 * Save blade forge state to chrome.storage
 */
export async function saveForgeStateToStorage(state: BladeForgeState): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [FORGE_STATE_KEY]: state }, resolve)
  })
}

// ============================================
// SYNC OPERATIONS
// ============================================

/**
 * Sync with training ground to get unlocked stances
 */
export async function syncFromTrainingGround(): Promise<{
  progress: TrainingProgress
  unlocked: string[]
}> {
  const repertoire = getRepertoireFromStorage()

  const defaultProgress: TrainingProgress = {
    sectionsVisited: [],
    orbConvergenceCount: 0,
    stancesCastCount: 0,
    bladesForged: 0,
    pathUnlocked: false
  }

  if (!repertoire) {
    return { progress: defaultProgress, unlocked: [] }
  }

  // Map training progress
  const progress: TrainingProgress = {
    sectionsVisited: repertoire.trainingProgress.sectionsVisited || [],
    orbConvergenceCount: repertoire.trainingProgress.orbConvergenceCount || 0,
    stancesCastCount: repertoire.trainingProgress.spellsCastCount || 0,
    bladesForged: 0, // Extension-owned
    pathUnlocked: repertoire.trainingProgress.pathUnlocked || false,
    firstCastTimestamp: repertoire.trainingProgress.firstCastTimestamp
  }

  // Determine which extended stances are unlocked
  const unlocked: string[] = []

  // Dragon stance unlocked after drake spell
  if (repertoire.trainingProgress.drakeSpellUnlocked) {
    unlocked.push('dragon')
  }

  // Path unlock grants access to extended stances
  if (repertoire.trainingProgress.pathUnlocked) {
    unlocked.push('cipher', 'cypherpunk', 'exit', 'plural', 'ephemeral')
  }

  console.log('[PostureSync] Synced from training ground:', {
    convergences: progress.orbConvergenceCount,
    pathUnlocked: progress.pathUnlocked,
    unlockedStances: unlocked
  })

  return { progress, unlocked }
}

/**
 * Update the loadout with unlocked stances from training
 */
export async function updateLoadoutWithUnlocked(unlockedIds: string[]): Promise<SwordsmanLoadout> {
  const loadout = await getLoadoutFromStorage()

  // Find unlocked stances that aren't already in loadout
  for (const id of unlockedIds) {
    const stance = EXTENDED_STANCES.find(s => s.id === id)
    if (stance) {
      // Check if already in loadout
      const inActive = loadout.activeStances.some(s => s.id === id)
      const isReserve = loadout.reserveBlade.id === id

      if (!inActive && !isReserve) {
        // Replace reserve blade with newly unlocked stance
        // (User can swap back via editor if they prefer)
        console.log('[PostureSync] Unlocked new stance:', stance.name)
        loadout.reserveBlade = stance
      }
    }
  }

  await saveLoadoutToStorage(loadout)
  return loadout
}

// ============================================
// BROADCAST TO WEBSITE
// ============================================

/**
 * Broadcast a stance cast to the website (when on home territory)
 */
export function broadcastStanceCast(
  stanceId: string,
  myTermsMapping: string,
  position: { x: number; y: number },
  domain: string
): void {
  if (!isHomeDomain()) return

  const message: WebsiteMessage = {
    type: 'STANCE_CAST',
    stanceId,
    myTermsMapping,
    position,
    domain
  }

  window.postMessage(message, '*')
}

/**
 * Broadcast a blade forge event to the website
 */
export function broadcastBladeForged(blade: ForgedBlade, domain: string): void {
  if (!isHomeDomain()) return

  const message: WebsiteMessage = {
    type: 'BLADE_FORGED',
    blade,
    domain
  }

  window.postMessage(message, '*')
}

/**
 * Broadcast convergence event to the website
 */
export function broadcastConvergence(spellCount: number, stanceCount: number): void {
  if (!isHomeDomain()) return

  const message: WebsiteMessage = {
    type: 'CONVERGENCE',
    spellCount,
    stanceCount,
    timestamp: Date.now()
  }

  window.postMessage(message, '*')
}

/**
 * Announce Swordsman presence to the website
 */
export function announceSwordsmanPresence(
  position: { x: number; y: number },
  myTermsState: unknown
): void {
  if (!isHomeDomain()) return

  const message: WebsiteMessage = {
    type: 'SWORD_PRESENT',
    domain: location.hostname,
    orbPosition: position,
    myTermsState
  }

  window.postMessage(message, '*')
}

/**
 * Broadcast gap reduction to the website
 */
export function broadcastGapReduction(
  domain: string,
  oldGap: number,
  newGap: number,
  stanceId: string
): void {
  if (!isHomeDomain()) return

  const message: WebsiteMessage = {
    type: 'GAP_REDUCED',
    domain,
    oldGap,
    newGap,
    stanceId
  }

  window.postMessage(message, '*')
}

// ============================================
// LISTEN TO WEBSITE
// ============================================

export type WebsiteEventHandler = {
  onRepertoireSync?: (repertoire: TrainingRepertoire) => void
  onPathUnlocked?: (progress: { sectionsVisited: number; spellsCast: number; convergences: number }) => void
  onMageSpellCast?: (spellId: string, position: { x: number; y: number }) => void
  onManaEarned?: (amount: number, reason: string) => void
}

/**
 * Setup listeners for messages from the website
 */
export function setupWebsiteListener(handlers: WebsiteEventHandler): () => void {
  const listener = (event: MessageEvent) => {
    // Only accept messages from same origin
    if (event.origin !== location.origin) return

    const { data } = event
    if (!data || !data.type) return

    switch (data.type) {
      case 'REPERTOIRE_SYNC':
        handlers.onRepertoireSync?.(data.repertoire)
        break

      case 'PATH_UNLOCKED':
        handlers.onPathUnlocked?.(data.progress)
        break

      case 'SPELL_CAST':
        // Mage cast a spell - could trigger convergence check
        handlers.onMageSpellCast?.(data.spellId, data.position)
        break

      case 'MANA_EARNED':
        handlers.onManaEarned?.(data.amount, data.reason)
        break
    }
  }

  window.addEventListener('message', listener)
  return () => window.removeEventListener('message', listener)
}

// ============================================
// CAST HISTORY (local to extension)
// ============================================

const MAX_HISTORY_SIZE = 100

/**
 * Record a stance cast in extension-local history
 */
export async function recordStanceCast(
  stanceId: string,
  position: { x: number; y: number },
  domain: string,
  gapReduction: number
): Promise<void> {
  const event: StanceCastEvent = {
    stanceId,
    timestamp: Date.now(),
    position,
    domain,
    gapReduction
  }

  return new Promise((resolve) => {
    chrome.storage.local.get([CAST_HISTORY_KEY], (result) => {
      const history: StanceCastEvent[] = result[CAST_HISTORY_KEY] || []
      history.push(event)

      // Trim to max size
      while (history.length > MAX_HISTORY_SIZE) {
        history.shift()
      }

      chrome.storage.local.set({ [CAST_HISTORY_KEY]: history }, resolve)
    })
  })
}

/**
 * Get recent cast history
 */
export async function getCastHistory(limit = 20): Promise<StanceCastEvent[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get([CAST_HISTORY_KEY], (result) => {
      const history: StanceCastEvent[] = result[CAST_HISTORY_KEY] || []
      resolve(history.slice(-limit))
    })
  })
}

// ============================================
// STATS
// ============================================

export async function getSwordsmanStats(): Promise<{
  totalCasts: number
  uniqueStances: Set<string>
  favoriteStance: string | null
  totalGapReduction: number
  lastCastTime: number | null
}> {
  const history = await getCastHistory(MAX_HISTORY_SIZE)

  const stanceCounts = new Map<string, number>()
  let totalGapReduction = 0

  for (const cast of history) {
    stanceCounts.set(cast.stanceId, (stanceCounts.get(cast.stanceId) || 0) + 1)
    totalGapReduction += cast.gapReduction
  }

  let favoriteStance: string | null = null
  let maxCount = 0
  for (const [id, count] of stanceCounts) {
    if (count > maxCount) {
      maxCount = count
      favoriteStance = id
    }
  }

  return {
    totalCasts: history.length,
    uniqueStances: new Set(history.map(h => h.stanceId)),
    favoriteStance,
    totalGapReduction,
    lastCastTime: history.length > 0 ? history[history.length - 1].timestamp : null
  }
}

// ============================================
// BLADE FORGE HELPERS
// ============================================

/**
 * Record a forged blade in the forge state
 */
export async function recordForgedBlade(blade: ForgedBlade): Promise<BladeForgeState> {
  const state = await getForgeStateFromStorage()

  state.forgedBlades.push(blade)
  state.totalForged++
  state.lastForgeTimestamp = Date.now()

  // Progress to next layer based on forge count
  if (state.totalForged >= 10 && state.currentLayer === 'assertion') {
    state.currentLayer = 'protection'
  } else if (state.totalForged >= 25 && state.currentLayer === 'protection') {
    state.currentLayer = 'sovereignty'
  }

  await saveForgeStateToStorage(state)

  // Broadcast to website
  broadcastBladeForged(blade, blade.forgedOnDomain)

  return state
}

/**
 * Get forged blades for a specific domain
 */
export async function getForgedBladesForDomain(domain: string): Promise<ForgedBlade[]> {
  const state = await getForgeStateFromStorage()
  return state.forgedBlades.filter(b => b.forgedOnDomain === domain)
}
