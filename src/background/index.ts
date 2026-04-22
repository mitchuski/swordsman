/**
 * Swordsman Extension - Background Service Worker
 *
 * The blade that guards sovereignty. Handles:
 * - MyTerms configuration
 * - Blade forge management
 * - Agreement storage
 * - Communication with Mage extension
 */

import { MAGE_EXTENSION_ID } from '@shared/types'
import type {
  SwordToMageMessage,
  MageToSwordMessage,
  MyTermsState,
  Forging
} from '@shared/types'

// ============================================
// STATE
// ============================================

let myTermsState: MyTermsState | null = null
let mageDetected = false
let sharedSecret: CryptoKey | null = null

// ============================================
// INITIALIZATION
// ============================================

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[Swordsman] Extension installed:', details.reason)

  if (details.reason === 'install') {
    // First install - initialize defaults
    await initializeMyTerms()
    await loadSpellWalletFromTraining()
  }

  // Start Mage detection
  startMageDetection()
})

chrome.runtime.onStartup.addListener(async () => {
  console.log('[Swordsman] Extension started')
  await loadState()
  startMageDetection()
})

// ============================================
// MYTERMS MANAGEMENT
// ============================================

async function initializeMyTerms(): Promise<void> {
  const defaultState: MyTermsState = {
    preferences: {
      doNotTrack: true,
      doNotSell: true,
      dataMinimisation: true,
      cookiePreference: 'essential-only',
      credentialDisclosure: 'selective',
      agentDelegation: 'self-only'
    },
    spellPalette: [],
    autoAssertDomains: []
  }

  await chrome.storage.local.set({ myTermsState: defaultState })
  myTermsState = defaultState
  console.log('[Swordsman] MyTerms initialized')
}

async function loadState(): Promise<void> {
  const data = await chrome.storage.local.get(['myTermsState', 'bladeForge'])
  myTermsState = data.myTermsState || null
  console.log('[Swordsman] State loaded')
}

// ============================================
// SPELL WALLET (FROM TRAINING)
// ============================================

async function loadSpellWalletFromTraining(): Promise<void> {
  // Check for spells learned on agentprivacy.ai
  const data = await chrome.storage.sync.get('spellWallet')

  if (data.spellWallet?.spells) {
    const spellIds = Object.keys(data.spellWallet.spells)
    console.log(`[Swordsman] Loaded ${spellIds.length} spells from training`)

    // Add to spell palette
    if (myTermsState) {
      myTermsState.spellPalette = spellIds
      await chrome.storage.local.set({ myTermsState })
    }
  }
}

// ============================================
// MAGE COMMUNICATION
// ============================================

function startMageDetection(): void {
  // Periodic ping to check if Mage is installed
  setInterval(async () => {
    try {
      await chrome.runtime.sendMessage(MAGE_EXTENSION_ID, { type: 'PING' })
      if (!mageDetected) {
        console.log('[Swordsman] Mage extension detected!')
        mageDetected = true
        await performKeyExchange()
      }
    } catch {
      if (mageDetected) {
        console.log('[Swordsman] Mage extension disconnected')
        mageDetected = false
        sharedSecret = null
      }
    }
  }, 5000)
}

async function performKeyExchange(): Promise<void> {
  // Generate ephemeral keypair
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey']
  )

  // Export and send public key
  const publicKey = await crypto.subtle.exportKey('jwk', keyPair.publicKey)

  const response = await chrome.runtime.sendMessage(MAGE_EXTENSION_ID, {
    type: 'KEY_EXCHANGE',
    publicKey
  })

  if (response?.publicKey) {
    // Import Mage's public key
    const magePublicKey = await crypto.subtle.importKey(
      'jwk',
      response.publicKey,
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      []
    )

    // Derive shared secret
    sharedSecret = await crypto.subtle.deriveKey(
      { name: 'ECDH', public: magePublicKey },
      keyPair.privateKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    )

    console.log('[Swordsman] Key exchange complete')
  }
}

async function sendToMage(message: SwordToMageMessage): Promise<void> {
  if (!mageDetected) {
    console.log('[Swordsman] Mage not detected, message not sent')
    return
  }

  try {
    await chrome.runtime.sendMessage(MAGE_EXTENSION_ID, message)
  } catch (error) {
    console.error('[Swordsman] Failed to send to Mage:', error)
  }
}

// ============================================
// MESSAGE HANDLERS
// ============================================

// From Mage extension
chrome.runtime.onMessageExternal.addListener(
  (message: MageToSwordMessage, sender, sendResponse) => {
    if (sender.id !== MAGE_EXTENSION_ID) {
      console.warn('[Swordsman] Received message from unknown extension')
      return
    }

    handleMageMessage(message, sendResponse)
    return true // Async response
  }
)

async function handleMageMessage(
  message: MageToSwordMessage,
  sendResponse: (response: unknown) => void
): Promise<void> {
  switch (message.type) {
    case 'MAGE_PRESENT':
      console.log('[Swordsman] Mage presence confirmed on:', message.domain)
      // Notify content script to enter dual-orb mode
      notifyContentScript({ type: 'MAGE_DETECTED', analysis: message.analysis })
      sendResponse({ acknowledged: true })
      break

    case 'INTELLIGENCE':
      console.log('[Swordsman] Received intelligence:', message.suggestedBlade?.name)
      notifyContentScript({
        type: 'INTELLIGENCE_RECEIVED',
        suggestedSpells: message.suggestedSpells,
        suggestedBlade: message.suggestedBlade
      })
      sendResponse({ acknowledged: true })
      break

    case 'HEXAGRAM_UPDATE':
      console.log('[Swordsman] Hexagram update:', message.hexagram.name)
      notifyContentScript({ type: 'HEXAGRAM_UPDATE', hexagram: message.hexagram })
      sendResponse({ acknowledged: true })
      break

    case 'CONSTELLATION_WAVE':
      console.log('[Swordsman] Constellation wave received')
      notifyContentScript({ type: 'WAVE_INCOMING', payload: message.payload })
      sendResponse({ acknowledged: true })
      break

    case 'CONVERGENCE_READY':
      console.log('[Swordsman] Mage ready for convergence')
      notifyContentScript({ type: 'CONVERGENCE_READY', position: message.position })
      sendResponse({ acknowledged: true })
      break

    case 'KEY_EXCHANGE':
      // Return our public key (handled in performKeyExchange)
      sendResponse({ acknowledged: true })
      break

    default:
      console.log('[Swordsman] Unknown message type:', (message as any).type)
      sendResponse({ error: 'Unknown message type' })
  }
}

// From content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleContentMessage(message, sender.tab?.id, sendResponse)
  return true
})

async function handleContentMessage(
  message: any,
  tabId: number | undefined,
  sendResponse: (response: unknown) => void
): Promise<void> {
  switch (message.type) {
    case 'SPELL_CAST':
      await handleSpellCast(message, tabId)
      sendResponse({ success: true })
      break

    case 'CONVERGENCE':
      await handleConvergence(message, tabId)
      sendResponse({ success: true })
      break

    case 'REQUEST_STATE':
      sendResponse({
        myTermsState,
        mageDetected,
        bladeForge: await chrome.storage.local.get('bladeForge')
      })
      break

    case 'BROADCAST_TO_MAGE':
      await sendToMage(message.payload)
      sendResponse({ sent: true })
      break

    default:
      sendResponse({ error: 'Unknown message type' })
  }
}

// ============================================
// SPELL & BLADE HANDLING
// ============================================

async function handleSpellCast(
  message: { spell: any; position: { x: number; y: number } },
  tabId?: number
): Promise<void> {
  console.log('[Swordsman] Spell cast:', message.spell.content)

  // Sign the spell
  const signedSpell = await signSpell(message.spell)

  // Store in local constellation
  await storeSpellNode(signedSpell, message.position, tabId)

  // Notify Mage
  await sendToMage({
    type: 'SPELL_CAST',
    spell: signedSpell,
    position: message.position,
    timestamp: Date.now()
  })
}

async function handleConvergence(
  message: { spellsCast: any[]; hexagramState: number[] },
  tabId?: number
): Promise<void> {
  console.log('[Swordsman] Convergence triggered!')

  // TODO: Import from blade-forge module
  // const forging = await forgeBlade(message.spellsCast, message.hexagramState, domain)

  // Notify Mage
  await sendToMage({
    type: 'CONVERGENCE_INITIATED',
    spellsCast: message.spellsCast,
    convergencePoint: { x: 0, y: 0 } // TODO: Get actual position
  })
}

async function signSpell(spell: any): Promise<any> {
  // TODO: Implement actual signing
  return {
    ...spell,
    signature: 'placeholder_signature',
    timestamp: Date.now(),
    signedBy: 'swordsman'
  }
}

async function storeSpellNode(spell: any, position: { x: number; y: number }, tabId?: number): Promise<void> {
  // TODO: Implement constellation storage
  console.log('[Swordsman] Stored spell node at', position)
}

// ============================================
// UTILITIES
// ============================================

async function notifyContentScript(message: any): Promise<void> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tabs[0]?.id) {
    chrome.tabs.sendMessage(tabs[0].id, message)
  }
}

console.log('[Swordsman] Background service worker initialized')
