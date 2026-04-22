/**
 * Repertoire Sync - Syncs spell repertoire from agentprivacy.ai
 *
 * This module handles the ONE-WAY sync from the training ground website
 * to the Swordsman extension's local storage.
 *
 * The sync only happens when visiting agentprivacy.ai
 */

import {
  REPERTOIRE_STORAGE_KEY,
  SYNC_DOMAINS,
  parseRepertoire,
  type SpellRepertoire,
  type LearnedSpell
} from '@agentprivacy/shared-types'

// ============================================
// SYNC STATE
// ============================================

let lastSyncTimestamp = 0
let syncInProgress = false

// ============================================
// DOMAIN CHECK
// ============================================

/**
 * Check if current domain is whitelisted for sync
 */
function shouldSync(): boolean {
  const hostname = location.hostname.toLowerCase()
  return SYNC_DOMAINS.some(domain =>
    hostname === domain || hostname === `www.${domain}`
  )
}

/**
 * Check if we're on the agentprivacy.ai domain
 */
export function isTrainingGround(): boolean {
  return shouldSync()
}

// ============================================
// SYNC FUNCTIONS
// ============================================

/**
 * Attempt to sync repertoire from website localStorage
 */
export async function syncRepertoireFromWebsite(): Promise<SyncResult> {
  // Only sync on whitelisted domains
  if (!shouldSync()) {
    return { success: false, reason: 'wrong_domain' }
  }

  // Prevent concurrent syncs
  if (syncInProgress) {
    return { success: false, reason: 'sync_in_progress' }
  }

  syncInProgress = true

  try {
    // Read from localStorage
    const raw = localStorage.getItem(REPERTOIRE_STORAGE_KEY)

    if (!raw) {
      return { success: false, reason: 'no_repertoire' }
    }

    // Parse and validate
    const repertoire = parseRepertoire(raw)

    if (!repertoire) {
      return { success: false, reason: 'invalid_repertoire' }
    }

    // Check if newer than what we have
    const existing = await getStoredRepertoire()
    if (existing && existing.lastUpdated >= repertoire.lastUpdated) {
      return { success: true, reason: 'already_synced', spellCount: existing.learnedSpells.length }
    }

    // Store in extension storage
    await chrome.storage.local.set({
      spell_repertoire: repertoire,
      repertoire_synced_at: Date.now()
    })

    lastSyncTimestamp = Date.now()

    console.log('[Swordsman] Synced', repertoire.learnedSpells.length, 'spells from training ground')

    // Notify background about new spells
    chrome.runtime.sendMessage({
      type: 'REPERTOIRE_SYNCED',
      spellCount: repertoire.learnedSpells.length,
      trainingProgress: repertoire.trainingProgress
    })

    return {
      success: true,
      reason: 'synced',
      spellCount: repertoire.learnedSpells.length,
      repertoire
    }
  } catch (error) {
    console.error('[Swordsman] Sync failed:', error)
    return { success: false, reason: 'error', error: String(error) }
  } finally {
    syncInProgress = false
  }
}

/**
 * Get stored repertoire from extension storage
 */
export async function getStoredRepertoire(): Promise<SpellRepertoire | null> {
  const data = await chrome.storage.local.get('spell_repertoire')
  return data.spell_repertoire || null
}

/**
 * Get list of learned spells
 */
export async function getLearnedSpells(): Promise<LearnedSpell[]> {
  const repertoire = await getStoredRepertoire()
  return repertoire?.learnedSpells || []
}

/**
 * Check if a specific spell has been learned
 */
export async function hasLearnedSpell(spellId: string): Promise<boolean> {
  const spells = await getLearnedSpells()
  return spells.some(s => s.id === spellId)
}

/**
 * Get training progress
 */
export async function getTrainingProgress(): Promise<TrainingProgress | null> {
  const repertoire = await getStoredRepertoire()
  return repertoire?.trainingProgress || null
}

// ============================================
// OBSERVER FOR DYNAMIC UPDATES
// ============================================

let storageObserver: MutationObserver | null = null

/**
 * Start observing localStorage changes (for live sync while on agentprivacy.ai)
 */
export function startStorageObserver(): void {
  if (!shouldSync()) return
  if (storageObserver) return

  // Listen for storage events
  window.addEventListener('storage', async (event) => {
    if (event.key === REPERTOIRE_STORAGE_KEY && event.newValue) {
      console.log('[Swordsman] Detected repertoire update')
      await syncRepertoireFromWebsite()
    }
  })

  // Also poll periodically while on training ground (storage event doesn't fire for same-tab changes)
  const pollInterval = setInterval(async () => {
    if (!shouldSync()) {
      clearInterval(pollInterval)
      return
    }
    await syncRepertoireFromWebsite()
  }, 5000) // Check every 5 seconds

  console.log('[Swordsman] Storage observer started')
}

/**
 * Stop observing localStorage changes
 */
export function stopStorageObserver(): void {
  if (storageObserver) {
    storageObserver.disconnect()
    storageObserver = null
  }
}

// ============================================
// TYPES
// ============================================

interface TrainingProgress {
  sectionsVisited: string[]
  orbConvergenceCount: number
  spellsCastCount: number
  drakeSpellUnlocked: boolean
  firstCastTimestamp?: number
  pathUnlocked: boolean
}

interface SyncResult {
  success: boolean
  reason: string
  spellCount?: number
  repertoire?: SpellRepertoire
  error?: string
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize repertoire sync (call on content script load)
 */
export async function initRepertoireSync(): Promise<void> {
  // Try initial sync
  const result = await syncRepertoireFromWebsite()

  if (result.success && result.reason === 'synced') {
    console.log(`[Swordsman] Initial sync complete: ${result.spellCount} spells`)
  }

  // Start observer for live updates
  startStorageObserver()
}
