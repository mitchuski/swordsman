/**
 * Spring Physics - Swordsman orb cursor-tether physics
 *
 * The Swordsman orb follows the cursor with spring dynamics,
 * creating a natural, bouncy tether effect.
 */

export interface SpringConfig {
  stiffness: number
  damping: number
}

export class SpringTether {
  x: number
  y: number
  vx: number = 0
  vy: number = 0

  private stiffness: number
  private damping: number

  constructor(
    initialX: number = 0,
    initialY: number = 0,
    config: SpringConfig = { stiffness: 0.06, damping: 0.75 }
  ) {
    this.x = initialX
    this.y = initialY
    this.stiffness = config.stiffness
    this.damping = config.damping
  }

  update(targetX: number, targetY: number): { x: number; y: number } {
    // Spring force toward target
    const ax = (targetX - this.x) * this.stiffness
    const ay = (targetY - this.y) * this.stiffness

    // Apply acceleration with damping
    this.vx = (this.vx + ax) * this.damping
    this.vy = (this.vy + ay) * this.damping

    // Update position
    this.x += this.vx
    this.y += this.vy

    return { x: this.x, y: this.y }
  }

  setPosition(x: number, y: number): void {
    this.x = x
    this.y = y
    this.vx = 0
    this.vy = 0
  }

  getVelocity(): { vx: number; vy: number } {
    return { vx: this.vx, vy: this.vy }
  }

  getSpeed(): number {
    return Math.sqrt(this.vx * this.vx + this.vy * this.vy)
  }
}

/**
 * Mouse tracker - tracks cursor position with passive listener
 */
export class MouseTracker {
  x: number
  y: number

  constructor() {
    this.x = window.innerWidth / 2
    this.y = window.innerHeight / 2

    document.addEventListener('mousemove', (e) => {
      this.x = e.clientX
      this.y = e.clientY
    }, { passive: true })
  }

  getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y }
  }
}
