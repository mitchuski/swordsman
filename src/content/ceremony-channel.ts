/**
 * Ceremony Channel - Inter-extension communication with Mage
 *
 * Handles discovery, handshake, position sync, and ceremony messages.
 * The Swordsman initiates discovery; the Mage responds.
 */

import { MAGE_EXTENSION_ID } from '@shared/types'
import type {
  SwordMessage,
  MageMessage,
  Position,
  RenderNode,
  RenderEdge,
  DetectedPattern,
  DrakeBodyNode,
  AnimationParams,
  HexagramState,
  DeepScanFindings
} from '@shared/types/ceremony-types'

// ============================================
// TYPES
// ============================================

export interface CeremonyChannelCallbacks {
  onMageDetected: (orbPosition: Position, spellbookState: string[]) => void
  onMageDisconnected: () => void
  onMageOrbPosition: (x: number, y: number) => void
  onConstellationUpdate: (nodes: RenderNode[], edges: RenderEdge[], patterns: DetectedPattern[]) => void
  onConstellationWave: (payload: any, animation: any) => void
  onScanResults: (findings: DeepScanFindings) => void
  onHexagramUpdate: (state: HexagramState, animParams: AnimationParams) => void
  onDrakeFormation: (bodyNodes: DrakeBodyNode[], patrolPath: Position[], progress: number) => void
  onCeremonyBegin: (ceremonyType: string, initiator: string) => void
  onSpellCast: (spell: any) => void
}

// ============================================
// CEREMONY CHANNEL
// ============================================

export class CeremonyChannel {
  private magePresent: boolean = false
  private mageOrbPosition: Position = { x: 0, y: 0 }
  private callbacks: CeremonyChannelCallbacks
  private discoveryInterval: number | null = null
  private positionSendInterval: number | null = null
  private lastPositionSend: number = 0

  // Current state to send
  private currentOrbPosition: Position = { x: 0, y: 0 }
  private currentMyTermsState: any = {}
  private currentHexagramState: HexagramState = { lines: [1, 0, 1, 0, 1, 0] }

  constructor(callbacks: CeremonyChannelCallbacks) {
    this.callbacks = callbacks
    this.setupExternalMessageListener()
  }

  // ============================================
  // DISCOVERY
  // ============================================

  startDiscovery(): void {
    // Initial discovery attempt
    this.discoverMage()

    // Re-check periodically
    this.discoveryInterval = window.setInterval(() => {
      if (!this.magePresent) {
        this.discoverMage()
      }
    }, 30000) as unknown as number
  }

  stopDiscovery(): void {
    if (this.discoveryInterval !== null) {
      clearInterval(this.discoveryInterval)
      this.discoveryInterval = null
    }
  }

  private discoverMage(): void {
    try {
      chrome.runtime.sendMessage(MAGE_EXTENSION_ID, {
        type: 'SWORD_PRESENT',
        domain: location.hostname,
        myTermsState: this.currentMyTermsState,
        orbPosition: this.currentOrbPosition,
        bladeLevel: 1,
        hexagramState: this.currentHexagramState
      } as SwordMessage, (response) => {
        if (chrome.runtime.lastError) {
          // Mage not installed or not responding
          if (this.magePresent) {
            this.magePresent = false
            this.callbacks.onMageDisconnected()
          }
          return
        }

        if (response?.type === 'MAGE_ACKNOWLEDGE') {
          if (!this.magePresent) {
            this.magePresent = true
            this.mageOrbPosition = response.orbPosition || { x: 100, y: 100 }
            this.callbacks.onMageDetected(this.mageOrbPosition, response.spellbookState || [])
            this.startPositionSync()
          }
        }
      })
    } catch {
      // Extension not available
      if (this.magePresent) {
        this.magePresent = false
        this.callbacks.onMageDisconnected()
      }
    }
  }

  // ============================================
  // MESSAGE LISTENER
  // ============================================

  private setupExternalMessageListener(): void {
    chrome.runtime.onMessageExternal.addListener((message: MageMessage, sender, sendResponse) => {
      // Only accept messages from Mage
      if (sender.id !== MAGE_EXTENSION_ID) return

      this.handleMageMessage(message, sendResponse)
      return true // Async response
    })
  }

  private handleMageMessage(message: MageMessage, sendResponse: (response: any) => void): void {
    switch (message.type) {
      case 'MAGE_PRESENT':
        this.magePresent = true
        this.mageOrbPosition = message.orbPosition
        sendResponse({
          type: 'SWORD_ACKNOWLEDGE',
          orbPosition: this.currentOrbPosition,
          myTermsState: this.currentMyTermsState
        })
        this.callbacks.onMageDetected(message.orbPosition, message.spellbookState)
        this.startPositionSync()
        break

      case 'MAGE_ORB_POSITION':
        this.mageOrbPosition = { x: message.x, y: message.y }
        this.callbacks.onMageOrbPosition(message.x, message.y)
        sendResponse({ acknowledged: true })
        break

      case 'CONSTELLATION_UPDATE':
        this.callbacks.onConstellationUpdate(message.nodes, message.edges, message.patterns)
        sendResponse({ acknowledged: true })
        break

      case 'CONSTELLATION_WAVE':
        this.callbacks.onConstellationWave(message.payload, message.animation)
        sendResponse({ acknowledged: true })
        break

      case 'SCAN_RESULTS':
        this.callbacks.onScanResults(message.findings)
        sendResponse({ acknowledged: true })
        break

      case 'HEXAGRAM_UPDATE':
        this.callbacks.onHexagramUpdate(message.state, message.animationParams)
        sendResponse({ acknowledged: true })
        break

      case 'DRAKE_FORMATION':
        this.callbacks.onDrakeFormation(message.bodyNodes, message.patrolPath, message.formationProgress)
        sendResponse({ acknowledged: true })
        break

      case 'CEREMONY_BEGIN':
        this.callbacks.onCeremonyBegin(message.ceremonyType, message.initiator)
        sendResponse({ acknowledged: true })
        break

      case 'SPELL_CAST':
        this.callbacks.onSpellCast(message.spell)
        sendResponse({ acknowledged: true })
        break

      default:
        sendResponse({ error: 'Unknown message type' })
    }
  }

  // ============================================
  // POSITION SYNC
  // ============================================

  private startPositionSync(): void {
    // Send position at 30fps (throttled)
    this.positionSendInterval = window.setInterval(() => {
      this.maybeSendPosition()
    }, 33) as unknown as number
  }

  private stopPositionSync(): void {
    if (this.positionSendInterval !== null) {
      clearInterval(this.positionSendInterval)
      this.positionSendInterval = null
    }
  }

  private maybeSendPosition(): void {
    if (!this.magePresent) return

    const now = performance.now()
    if (now - this.lastPositionSend < 33) return // 30fps throttle
    this.lastPositionSend = now

    this.sendToMage({
      type: 'ORB_POSITION',
      x: this.currentOrbPosition.x,
      y: this.currentOrbPosition.y
    })
  }

  updateOrbPosition(x: number, y: number): void {
    this.currentOrbPosition = { x, y }
  }

  // ============================================
  // SEND MESSAGES
  // ============================================

  sendToMage(message: SwordMessage): void {
    if (!this.magePresent) return

    try {
      chrome.runtime.sendMessage(MAGE_EXTENSION_ID, message)
    } catch (error) {
      console.error('[Swordsman] Failed to send to Mage:', error)
    }
  }

  sendSlash(target: string, assertion: string, intensity: number = 5): void {
    this.sendToMage({
      type: 'SLASH',
      target,
      domain: location.hostname,
      assertion,
      intensity
    })
  }

  sendWard(boundary: string, terms: string[], hexagramLine: number, yangState: boolean): void {
    this.sendToMage({
      type: 'WARD',
      boundary,
      terms,
      hexagramLine,
      yangState
    })
  }

  sendTermAssert(assertions: any[], constellationHash: string): void {
    this.sendToMage({
      type: 'TERM_ASSERT',
      domain: location.hostname,
      assertions,
      constellationHash,
      hexagram: this.currentHexagramState
    })
  }

  sendCeremonyBegin(ceremonyType: string): void {
    this.sendToMage({
      type: 'CEREMONY_BEGIN',
      ceremonyType: ceremonyType as any,
      initiator: 'SWORD',
      conditions: {
        orbDistance: this.getOrbDistance(),
        spellsCast: 0, // TODO: Track
        gapScore: 50, // TODO: Track
        drakeEligible: false // TODO: Track
      }
    })
  }

  sendSummonDrake(conditions: any): void {
    this.sendToMage({
      type: 'SUMMON_DRAKE',
      conditions
    })
  }

  // ============================================
  // STATE
  // ============================================

  isMagePresent(): boolean {
    return this.magePresent
  }

  getMageOrbPosition(): Position {
    return this.mageOrbPosition
  }

  getOrbDistance(): number {
    const dx = this.currentOrbPosition.x - this.mageOrbPosition.x
    const dy = this.currentOrbPosition.y - this.mageOrbPosition.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  setMyTermsState(state: any): void {
    this.currentMyTermsState = state
  }

  setHexagramState(state: HexagramState): void {
    this.currentHexagramState = state
  }

  // ============================================
  // CLEANUP
  // ============================================

  destroy(): void {
    this.stopDiscovery()
    this.stopPositionSync()
  }
}
