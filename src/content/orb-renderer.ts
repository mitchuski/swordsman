/**
 * Orb Renderer - Canvas overlay and orb rendering
 *
 * The Swordsman owns the single canvas overlay per page.
 * It renders both the Swordsman orb and (when detected) the Mage orb.
 */

import type {
  RenderNode,
  RenderEdge,
  DetectedPattern,
  DrakeBodyNode,
  Position,
  AnimationParams
} from '@shared/types/ceremony-types'

// ============================================
// CONSTANTS
// ============================================

export const ORB_COLORS = {
  swordsman: {
    primary: '#534AB7',
    glow: 'rgba(83, 74, 183, 0.3)',
    dark: '#AFA9EC'
  },
  mage: {
    primary: '#1D9E75',
    glow: 'rgba(29, 158, 117, 0.3)',
    dark: '#5DCAA5'
  },
  convergence: '#EF9F27',
  drake: '#FFD700',
  constellation: {
    node: 'rgba(239, 159, 39, 1)',
    nodeGlow: 'rgba(239, 159, 39, 0.3)',
    edge: 'rgba(239, 159, 39, 0.5)'
  }
}

const SWORDSMAN_RADIUS = 16
const MAGE_RADIUS = 16
const GLOW_MULTIPLIER = 2.5

// ============================================
// CANVAS MANAGEMENT
// ============================================

export class OrbRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private dpr: number

  // Render state
  private swordsmanPos: Position = { x: 0, y: 0 }
  private magePos: Position | null = null
  private mageVisible: boolean = false

  // Constellation state (from Mage)
  private constellationNodes: RenderNode[] = []
  private constellationEdges: RenderEdge[] = []
  private patterns: DetectedPattern[] = []

  // Drake state
  private drakeNodes: DrakeBodyNode[] = []
  private drakePatrolPath: Position[] = []
  private drakeProgress: number = 0

  // Animation params
  private animParams: AnimationParams = {
    orbitRadii: 1.0,
    spellSpawnRate: 0.5,
    phaseCoupling: 0.5,
    edgeThreshold: 180,
    glowIntensity: 0.3,
    gridVisibility: 0.05
  }

  // Gap indicator
  private gapScore: number = 50

  constructor() {
    this.canvas = this.createCanvas()
    this.ctx = this.canvas.getContext('2d')!
    this.dpr = window.devicePixelRatio || 1

    this.setupCanvas()
    this.setupResizeHandler()
  }

  private createCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.id = 'swordsman-overlay'
    canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 2147483646;
      pointer-events: none;
      background: transparent;
    `
    document.documentElement.appendChild(canvas)
    return canvas
  }

  private setupCanvas(): void {
    const width = window.innerWidth
    const height = window.innerHeight

    this.canvas.width = width * this.dpr
    this.canvas.height = height * this.dpr
    this.canvas.style.width = `${width}px`
    this.canvas.style.height = `${height}px`

    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
  }

  private setupResizeHandler(): void {
    window.addEventListener('resize', () => {
      this.setupCanvas()
    })
  }

  // ============================================
  // STATE UPDATES
  // ============================================

  setSwordsmanPosition(x: number, y: number): void {
    this.swordsmanPos = { x, y }
  }

  setMagePosition(x: number, y: number): void {
    this.magePos = { x, y }
    this.mageVisible = true
  }

  setMageVisible(visible: boolean): void {
    this.mageVisible = visible
  }

  setConstellation(nodes: RenderNode[], edges: RenderEdge[], patterns: DetectedPattern[]): void {
    this.constellationNodes = nodes
    this.constellationEdges = edges
    this.patterns = patterns
  }

  setDrakeFormation(nodes: DrakeBodyNode[], patrolPath: Position[], progress: number): void {
    this.drakeNodes = nodes
    this.drakePatrolPath = patrolPath
    this.drakeProgress = progress
  }

  setAnimationParams(params: AnimationParams): void {
    this.animParams = params
  }

  setGapScore(score: number): void {
    this.gapScore = score
  }

  // ============================================
  // RENDERING
  // ============================================

  render(): void {
    const width = window.innerWidth
    const height = window.innerHeight

    // Clear canvas
    this.ctx.clearRect(0, 0, width, height)

    // Draw background grid (subtle)
    this.drawGrid(width, height)

    // Draw tether line (Swordsman to cursor)
    this.drawTether()

    // Draw constellation edges
    this.drawConstellationEdges()

    // Draw constellation nodes
    this.drawConstellationNodes()

    // Draw Drake if summoned
    if (this.drakeNodes.length > 0 && this.drakeProgress > 0) {
      this.drawDrake()
    }

    // Draw gap indicator (if Mage visible)
    if (this.mageVisible && this.magePos) {
      this.drawGapIndicator()
    }

    // Draw Mage orb (if visible)
    if (this.mageVisible && this.magePos) {
      this.drawMageOrb()
    }

    // Draw Swordsman orb (always)
    this.drawSwordsmanOrb()
  }

  private drawGrid(width: number, height: number): void {
    const visibility = this.animParams.gridVisibility

    if (visibility < 0.01) return

    this.ctx.strokeStyle = `rgba(83, 74, 183, ${visibility})`
    this.ctx.lineWidth = 0.5

    const gridSize = 50

    // Vertical lines
    for (let x = 0; x < width; x += gridSize) {
      this.ctx.beginPath()
      this.ctx.moveTo(x, 0)
      this.ctx.lineTo(x, height)
      this.ctx.stroke()
    }

    // Horizontal lines
    for (let y = 0; y < height; y += gridSize) {
      this.ctx.beginPath()
      this.ctx.moveTo(0, y)
      this.ctx.lineTo(width, y)
      this.ctx.stroke()
    }
  }

  private drawTether(): void {
    // Tether is drawn from orb to where cursor is (mouse position)
    // This is handled externally - we just draw the orb at its position
  }

  private drawSwordsmanOrb(): void {
    const { x, y } = this.swordsmanPos

    // Glow
    const glowRadius = SWORDSMAN_RADIUS * GLOW_MULTIPLIER
    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, glowRadius)
    gradient.addColorStop(0, `rgba(83, 74, 183, ${this.animParams.glowIntensity})`)
    gradient.addColorStop(1, 'rgba(83, 74, 183, 0)')

    this.ctx.beginPath()
    this.ctx.arc(x, y, glowRadius, 0, Math.PI * 2)
    this.ctx.fillStyle = gradient
    this.ctx.fill()

    // Core
    this.ctx.beginPath()
    this.ctx.arc(x, y, SWORDSMAN_RADIUS, 0, Math.PI * 2)
    this.ctx.fillStyle = ORB_COLORS.swordsman.primary
    this.ctx.fill()

    // Inner ring
    this.ctx.beginPath()
    this.ctx.arc(x, y, SWORDSMAN_RADIUS - 2, 0, Math.PI * 2)
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    this.ctx.lineWidth = 1
    this.ctx.stroke()

    // Symbol
    this.ctx.font = 'bold 12px sans-serif'
    this.ctx.fillStyle = 'white'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText('⚔', x, y)
  }

  private drawMageOrb(): void {
    if (!this.magePos) return

    const { x, y } = this.magePos

    // Glow
    const glowRadius = MAGE_RADIUS * GLOW_MULTIPLIER
    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, glowRadius)
    gradient.addColorStop(0, `rgba(29, 158, 117, ${this.animParams.glowIntensity})`)
    gradient.addColorStop(1, 'rgba(29, 158, 117, 0)')

    this.ctx.beginPath()
    this.ctx.arc(x, y, glowRadius, 0, Math.PI * 2)
    this.ctx.fillStyle = gradient
    this.ctx.fill()

    // Core
    this.ctx.beginPath()
    this.ctx.arc(x, y, MAGE_RADIUS, 0, Math.PI * 2)
    this.ctx.fillStyle = ORB_COLORS.mage.primary
    this.ctx.fill()

    // Inner ring
    this.ctx.beginPath()
    this.ctx.arc(x, y, MAGE_RADIUS - 2, 0, Math.PI * 2)
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    this.ctx.lineWidth = 1
    this.ctx.stroke()

    // Symbol
    this.ctx.font = 'bold 10px sans-serif'
    this.ctx.fillStyle = 'white'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText('✦', x, y)
  }

  private drawConstellationEdges(): void {
    for (const edge of this.constellationEdges) {
      const fromNode = this.constellationNodes.find(n => n.id === edge.from)
      const toNode = this.constellationNodes.find(n => n.id === edge.to)

      if (!fromNode || !toNode) continue

      this.ctx.beginPath()
      this.ctx.moveTo(fromNode.x, fromNode.y)
      this.ctx.lineTo(toNode.x, toNode.y)

      this.ctx.strokeStyle = `rgba(239, 159, 39, ${edge.strength * 0.5})`
      this.ctx.lineWidth = edge.type === 'solid' ? 1 : 0.5

      if (edge.type === 'dashed') {
        this.ctx.setLineDash([4, 4])
      }

      this.ctx.stroke()
      this.ctx.setLineDash([])
    }
  }

  private drawConstellationNodes(): void {
    for (const node of this.constellationNodes) {
      const { x, y, opacity, yangYin, emoji } = node

      // Glow
      this.ctx.beginPath()
      this.ctx.arc(x, y, 12, 0, Math.PI * 2)
      this.ctx.fillStyle = `rgba(239, 159, 39, ${opacity * 0.3})`
      this.ctx.fill()

      // Core - yang is filled, yin is stroked
      this.ctx.beginPath()
      this.ctx.arc(x, y, 6, 0, Math.PI * 2)

      if (yangYin === 'yang') {
        this.ctx.fillStyle = `rgba(239, 159, 39, ${opacity})`
        this.ctx.fill()
      } else {
        this.ctx.strokeStyle = `rgba(239, 159, 39, ${opacity})`
        this.ctx.lineWidth = 1.5
        this.ctx.stroke()
      }

      // Emoji if present
      if (emoji) {
        this.ctx.font = '10px sans-serif'
        this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
        this.ctx.textAlign = 'center'
        this.ctx.textBaseline = 'middle'
        this.ctx.fillText(emoji, x, y - 12)
      }

      // Pulse animation
      if (node.pulse > 0) {
        this.ctx.beginPath()
        this.ctx.arc(x, y, 6 + node.pulse * 10, 0, Math.PI * 2)
        this.ctx.strokeStyle = `rgba(239, 159, 39, ${(1 - node.pulse) * 0.5})`
        this.ctx.lineWidth = 1
        this.ctx.stroke()
      }
    }
  }

  private drawGapIndicator(): void {
    if (!this.magePos) return

    const sx = this.swordsmanPos.x
    const sy = this.swordsmanPos.y
    const mx = this.magePos.x
    const my = this.magePos.y

    // Dashed line between orbs
    this.ctx.beginPath()
    this.ctx.moveTo(sx, sy)
    this.ctx.lineTo(mx, my)

    // Color based on gap score
    const t = this.gapScore / 100
    const r = Math.round(239 * t + 29 * (1 - t))
    const g = Math.round(159 * (1 - t) + 158 * (1 - t))
    const b = Math.round(39 * (1 - t) + 117 * (1 - t))

    this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.2)`
    this.ctx.lineWidth = 1
    this.ctx.setLineDash([4, 8])
    this.ctx.stroke()
    this.ctx.setLineDash([])

    // Gap score indicator at midpoint
    const midX = (sx + mx) / 2
    const midY = (sy + my) / 2

    this.ctx.font = '10px monospace'
    this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.5)`
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText(`${this.gapScore}`, midX, midY - 10)
  }

  private drawDrake(): void {
    if (this.drakeNodes.length === 0) return

    const progress = this.drakeProgress

    // Draw Drake body (connected nodes)
    this.ctx.beginPath()
    this.ctx.strokeStyle = `rgba(255, 215, 0, ${progress * 0.8})`
    this.ctx.lineWidth = 3

    for (let i = 0; i < this.drakeNodes.length; i++) {
      const node = this.drakeNodes[i]
      if (i === 0) {
        this.ctx.moveTo(node.position.x, node.position.y)
      } else {
        this.ctx.lineTo(node.position.x, node.position.y)
      }
    }
    this.ctx.stroke()

    // Draw body nodes
    for (const node of this.drakeNodes) {
      const { x, y } = node.position

      // Glow
      this.ctx.beginPath()
      this.ctx.arc(x, y, 15 * progress, 0, Math.PI * 2)
      this.ctx.fillStyle = `rgba(255, 215, 0, ${progress * 0.3})`
      this.ctx.fill()

      // Core
      this.ctx.beginPath()
      this.ctx.arc(x, y, 8 * progress, 0, Math.PI * 2)
      this.ctx.fillStyle = `rgba(255, 215, 0, ${progress * node.health})`
      this.ctx.fill()

      // PVM condition label
      this.ctx.font = '8px monospace'
      this.ctx.fillStyle = `rgba(255, 255, 255, ${progress})`
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      this.ctx.fillText(node.pvmCondition, x, y)
    }

    // Draw patrol path
    if (this.drakePatrolPath.length > 1) {
      this.ctx.beginPath()
      this.ctx.setLineDash([2, 4])
      this.ctx.strokeStyle = `rgba(255, 215, 0, ${progress * 0.2})`
      this.ctx.lineWidth = 1

      for (let i = 0; i < this.drakePatrolPath.length; i++) {
        const point = this.drakePatrolPath[i]
        if (i === 0) {
          this.ctx.moveTo(point.x, point.y)
        } else {
          this.ctx.lineTo(point.x, point.y)
        }
      }
      this.ctx.closePath()
      this.ctx.stroke()
      this.ctx.setLineDash([])
    }
  }

  // ============================================
  // CLEANUP
  // ============================================

  destroy(): void {
    this.canvas.remove()
  }
}
