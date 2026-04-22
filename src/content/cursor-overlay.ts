/**
 * Cursor Overlay - Pretext Effect Renderer
 *
 * Renders custom cursor effects on top of web pages.
 * Uses canvas for smooth animation and physics.
 *
 * The Swordsman version uses spring physics by default.
 */

import type { PretextEffect, EffectPhysics, EffectTrail, ActiveExtensionMode } from '@agentprivacy/shared-types'
import { getActiveEffect, getEffectSettings, isDomainDisabled } from '../lib/effect-storage'
import { getSwordsmanPresets } from '../lib/effect-presets'

// ============================================
// STATE
// ============================================

let canvas: HTMLCanvasElement | null = null
let ctx: CanvasRenderingContext2D | null = null
let animFrameId: number | null = null
let isEnabled = true

// Current effect
let activeEffect: PretextEffect | null = null
let activeMode: ActiveExtensionMode = 'dual'

// Cursor position tracking
let mouseX = 0
let mouseY = 0
let orbX = 0
let orbY = 0
let orbVx = 0
let orbVy = 0

// Trail history
let trailHistory: Array<{ x: number; y: number; opacity: number }> = []

// Time tracking for animations
let lastTime = performance.now()
let animTime = 0

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize the cursor overlay
 */
export async function initCursorOverlay(): Promise<void> {
  // Check if domain is disabled
  const disabled = await isDomainDisabled(location.hostname)
  if (disabled) {
    console.log('[CursorOverlay] Disabled on this domain')
    return
  }

  // Get settings
  const settings = await getEffectSettings()
  activeMode = settings.activeExtension

  // Check if Swordsman should be active
  if (activeMode !== 'swordsman' && activeMode !== 'dual') {
    console.log('[CursorOverlay] Swordsman not active')
    return
  }

  // Load active effect or use default preset
  activeEffect = await getActiveEffect()
  if (!activeEffect) {
    const presets = getSwordsmanPresets()
    activeEffect = presets[0] // blade-classic
  }

  // Create canvas
  createCanvas()

  // Setup event listeners
  setupEventListeners()

  // Initialize orb position to center
  orbX = window.innerWidth / 2
  orbY = window.innerHeight / 2
  mouseX = orbX
  mouseY = orbY

  // Start render loop
  startRenderLoop()

  console.log('[CursorOverlay] Initialized with effect:', activeEffect?.name)
}

/**
 * Create the canvas element
 */
function createCanvas(): void {
  canvas = document.createElement('canvas')
  canvas.id = 'pretext-cursor-overlay'
  canvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 2147483646;
  `

  // Handle high DPI displays
  const dpr = window.devicePixelRatio || 1
  canvas.width = window.innerWidth * dpr
  canvas.height = window.innerHeight * dpr

  ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.scale(dpr, dpr)
  }

  document.body.appendChild(canvas)
}

/**
 * Setup event listeners
 */
function setupEventListeners(): void {
  // Mouse tracking
  document.addEventListener('mousemove', handleMouseMove, { passive: true })

  // Window resize
  window.addEventListener('resize', handleResize)

  // Listen for effect changes from background
  chrome.runtime.onMessage.addListener(handleMessage)
}

// ============================================
// EVENT HANDLERS
// ============================================

function handleMouseMove(e: MouseEvent): void {
  mouseX = e.clientX
  mouseY = e.clientY
}

function handleResize(): void {
  if (!canvas || !ctx) return

  const dpr = window.devicePixelRatio || 1
  canvas.width = window.innerWidth * dpr
  canvas.height = window.innerHeight * dpr
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.scale(dpr, dpr)
}

function handleMessage(message: any): void {
  switch (message.type) {
    case 'ACTIVE_EFFECT_CHANGED':
      activeEffect = message.effect
      trailHistory = [] // Clear trail on effect change
      console.log('[CursorOverlay] Effect changed to:', activeEffect?.name)
      break

    case 'ACTIVE_EXTENSION_CHANGED':
      activeMode = message.active
      if (activeMode !== 'swordsman' && activeMode !== 'dual') {
        disableCursorOverlay()
      } else if (!isEnabled) {
        enableCursorOverlay()
      }
      break
  }
}

// ============================================
// RENDER LOOP
// ============================================

function startRenderLoop(): void {
  isEnabled = true

  function render(timestamp: number) {
    if (!isEnabled || !ctx || !canvas) return

    const dt = (timestamp - lastTime) / 1000
    lastTime = timestamp
    animTime += dt

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Update physics
    updatePhysics(dt)

    // Update trail
    updateTrail()

    // Draw trail
    drawTrail()

    // Draw effect
    drawEffect()

    // Continue loop
    animFrameId = requestAnimationFrame(render)
  }

  animFrameId = requestAnimationFrame(render)
}

function stopRenderLoop(): void {
  if (animFrameId !== null) {
    cancelAnimationFrame(animFrameId)
    animFrameId = null
  }
}

// ============================================
// PHYSICS
// ============================================

function updatePhysics(dt: number): void {
  if (!activeEffect) return

  const physics = activeEffect.physics

  switch (physics.mode) {
    case 'spring':
      updateSpringPhysics(physics, dt)
      break
    case 'drift':
      updateDriftPhysics(physics, dt)
      break
    case 'hybrid':
      updateHybridPhysics(physics, dt)
      break
  }

  // Clamp to viewport
  orbX = Math.max(20, Math.min(window.innerWidth - 20, orbX))
  orbY = Math.max(20, Math.min(window.innerHeight - 20, orbY))
}

function updateSpringPhysics(physics: EffectPhysics, dt: number): void {
  const stiffness = physics.stiffness ?? 0.04
  const damping = physics.damping ?? 0.85

  // Spring force toward mouse
  const dx = mouseX - orbX
  const dy = mouseY - orbY
  const ax = dx * stiffness
  const ay = dy * stiffness

  // Apply acceleration with damping
  orbVx = (orbVx + ax) * damping
  orbVy = (orbVy + ay) * damping

  // Update position
  orbX += orbVx
  orbY += orbVy
}

function updateDriftPhysics(physics: EffectPhysics, dt: number): void {
  const driftSpeed = physics.driftSpeed ?? 0.3
  const attractorStrength = physics.attractorStrength ?? 0.2

  // Organic drift (Perlin-like movement)
  const driftX = Math.sin(animTime * 0.7) * driftSpeed
  const driftY = Math.cos(animTime * 0.5) * driftSpeed * 0.7

  // Weak attraction to mouse
  const dx = mouseX - orbX
  const dy = mouseY - orbY
  const dist = Math.sqrt(dx * dx + dy * dy) + 1
  const attractX = (dx / dist) * attractorStrength
  const attractY = (dy / dist) * attractorStrength

  // Combine forces
  orbVx = (orbVx + driftX + attractX) * 0.95
  orbVy = (orbVy + driftY + attractY) * 0.95

  // Update position
  orbX += orbVx
  orbY += orbVy
}

function updateHybridPhysics(physics: EffectPhysics, dt: number): void {
  const balance = physics.hybridBalance ?? 0.5

  // Calculate both physics modes
  const springResult = { x: orbX, y: orbY, vx: orbVx, vy: orbVy }
  const driftResult = { x: orbX, y: orbY, vx: orbVx, vy: orbVy }

  // Spring component
  const stiffness = physics.stiffness ?? 0.02
  const damping = physics.damping ?? 0.9
  const sdx = mouseX - springResult.x
  const sdy = mouseY - springResult.y
  springResult.vx = (springResult.vx + sdx * stiffness) * damping
  springResult.vy = (springResult.vy + sdy * stiffness) * damping

  // Drift component
  const driftSpeed = physics.driftSpeed ?? 0.15
  const attractorStrength = physics.attractorStrength ?? 0.1
  const driftX = Math.sin(animTime * 0.7) * driftSpeed
  const driftY = Math.cos(animTime * 0.5) * driftSpeed * 0.7
  const ddx = mouseX - driftResult.x
  const ddy = mouseY - driftResult.y
  const dist = Math.sqrt(ddx * ddx + ddy * ddy) + 1
  driftResult.vx = (driftResult.vx + driftX + (ddx / dist) * attractorStrength) * 0.95
  driftResult.vy = (driftResult.vy + driftY + (ddy / dist) * attractorStrength) * 0.95

  // Blend based on balance
  orbVx = springResult.vx * (1 - balance) + driftResult.vx * balance
  orbVy = springResult.vy * (1 - balance) + driftResult.vy * balance

  // Update position
  orbX += orbVx
  orbY += orbVy
}

// ============================================
// TRAIL
// ============================================

function updateTrail(): void {
  if (!activeEffect?.trail?.enabled) {
    trailHistory = []
    return
  }

  const trail = activeEffect.trail
  const maxLength = trail.length

  // Add current position to trail
  trailHistory.unshift({ x: orbX, y: orbY, opacity: 1 })

  // Trim to max length
  if (trailHistory.length > maxLength) {
    trailHistory = trailHistory.slice(0, maxLength)
  }

  // Fade trail points
  for (let i = 0; i < trailHistory.length; i++) {
    trailHistory[i].opacity = 1 - (i / maxLength)
  }
}

function drawTrail(): void {
  if (!ctx || !activeEffect?.trail?.enabled || trailHistory.length < 2) return

  const trail = activeEffect.trail
  const color = trail.color || activeEffect.visual.color || '#534AB7'

  ctx.save()

  switch (trail.style) {
    case 'solid':
      drawSolidTrail(color)
      break
    case 'dotted':
      drawDottedTrail(color)
      break
    case 'particles':
      drawParticleTrail(color)
      break
    default:
      drawSolidTrail(color)
  }

  ctx.restore()
}

function drawSolidTrail(color: string): void {
  if (!ctx || trailHistory.length < 2) return

  ctx.beginPath()
  ctx.moveTo(trailHistory[0].x, trailHistory[0].y)

  for (let i = 1; i < trailHistory.length; i++) {
    const point = trailHistory[i]
    ctx.lineTo(point.x, point.y)
  }

  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.globalAlpha = 0.6
  ctx.stroke()
}

function drawDottedTrail(color: string): void {
  if (!ctx) return

  for (let i = 0; i < trailHistory.length; i++) {
    const point = trailHistory[i]
    ctx.beginPath()
    ctx.arc(point.x, point.y, 3, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.globalAlpha = point.opacity * 0.6
    ctx.fill()
  }
}

function drawParticleTrail(color: string): void {
  if (!ctx) return

  for (let i = 0; i < trailHistory.length; i++) {
    const point = trailHistory[i]
    const size = 2 + Math.random() * 3
    const offsetX = (Math.random() - 0.5) * 8
    const offsetY = (Math.random() - 0.5) * 8

    ctx.beginPath()
    ctx.arc(point.x + offsetX, point.y + offsetY, size, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.globalAlpha = point.opacity * 0.4
    ctx.fill()
  }
}

// ============================================
// EFFECT DRAWING
// ============================================

function drawEffect(): void {
  if (!ctx || !activeEffect) return

  const visual = activeEffect.visual
  const scale = visual.scale ?? 1.0
  const rotation = visual.rotation ?? 0

  ctx.save()
  ctx.translate(orbX, orbY)
  ctx.rotate((rotation * Math.PI) / 180)

  // Apply animation effects
  const pulseScale = 1 + Math.sin(animTime * 3) * 0.05

  // Draw based on visual type
  if (visual.emoji) {
    drawEmoji(visual.emoji, scale * pulseScale, visual.cssFilter)
  } else if (visual.svgData) {
    drawSvg(visual.svgData, scale * pulseScale)
  }

  ctx.restore()
}

function drawEmoji(emoji: string, scale: number, cssFilter?: string): void {
  if (!ctx) return

  const fontSize = 24 * scale
  ctx.font = `${fontSize}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Apply glow effect
  if (cssFilter && cssFilter.includes('drop-shadow')) {
    // Parse shadow color from filter
    const match = cssFilter.match(/rgba?\([^)]+\)/)
    if (match) {
      ctx.shadowColor = match[0]
      ctx.shadowBlur = 8
    }
  }

  ctx.fillText(emoji, 0, 0)
}

function drawSvg(svgData: string, scale: number): void {
  // For SVG, we'd need to create an image and draw it
  // This is a placeholder for future implementation
  if (!ctx) return

  // Create image from SVG data
  const img = new Image()
  const blob = new Blob([svgData], { type: 'image/svg+xml' })
  img.src = URL.createObjectURL(blob)

  img.onload = () => {
    ctx?.drawImage(img, -img.width * scale / 2, -img.height * scale / 2, img.width * scale, img.height * scale)
    URL.revokeObjectURL(img.src)
  }
}

// ============================================
// CONTROL FUNCTIONS
// ============================================

/**
 * Enable the cursor overlay
 */
export function enableCursorOverlay(): void {
  if (isEnabled) return

  isEnabled = true

  if (!canvas) {
    createCanvas()
  }

  if (canvas) {
    canvas.style.display = 'block'
  }

  startRenderLoop()
  console.log('[CursorOverlay] Enabled')
}

/**
 * Disable the cursor overlay
 */
export function disableCursorOverlay(): void {
  if (!isEnabled) return

  isEnabled = false
  stopRenderLoop()

  if (canvas) {
    canvas.style.display = 'none'
  }

  console.log('[CursorOverlay] Disabled')
}

/**
 * Destroy the cursor overlay completely
 */
export function destroyCursorOverlay(): void {
  disableCursorOverlay()

  if (canvas && canvas.parentNode) {
    canvas.parentNode.removeChild(canvas)
  }

  canvas = null
  ctx = null
  trailHistory = []

  document.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('resize', handleResize)
}

/**
 * Update the active effect
 */
export function setEffect(effect: PretextEffect | null): void {
  activeEffect = effect
  trailHistory = []
}

/**
 * Get current orb position
 */
export function getOrbPosition(): { x: number; y: number } {
  return { x: orbX, y: orbY }
}
