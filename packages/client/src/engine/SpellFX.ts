// Phaser is lazy-loaded — do NOT import at module level
import { Camera } from './Camera'

export class SpellFX {
  private async createPhaserScene(width: number, height: number): Promise<{ game: any; scene: any; canvas: HTMLCanvasElement }> {
    const Phaser = (await import('phaser')).default

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.style.cssText = `position:absolute;top:0;left:0;pointer-events:none;z-index:10`
    document.body.appendChild(canvas)

    return new Promise(resolve => {
      const game = new Phaser.Game({
        type: Phaser.CANVAS,
        canvas,
        width, height,
        transparent: true,
        scene: {
          create(this: any) { resolve({ game, scene: this, canvas }) }
        }
      })
    })
  }

  private cleanup(game: any, canvas: HTMLCanvasElement, delayMs: number) {
    setTimeout(() => {
      game.destroy(true)
      canvas.remove()
    }, delayMs)
  }

  async lightning(worldX: number, worldY: number, worldTargetX: number, worldTargetY: number, camera: Camera): Promise<void> {
    const { x: sx, y: sy } = camera.worldToScreen(worldX, worldY)
    const { x: tx, y: ty } = camera.worldToScreen(worldTargetX, worldTargetY)
    const { game, scene, canvas } = await this.createPhaserScene(camera.viewW, camera.viewH)

    const gfx = scene.add.graphics()
    let alpha = 1
    const steps = 8
    let frame = 0

    scene.time.addEvent({
      delay: 16, repeat: 37, callback: () => {
        gfx.clear()
        alpha = 1 - frame / 37
        gfx.lineStyle(3, 0xaaddff, alpha)
        gfx.beginPath()
        let lx = sx, ly = sy
        for (let i = 0; i < steps; i++) {
          const nx = lx + (tx - sx) / steps + (Math.random() - 0.5) * 20
          const ny = ly + (ty - sy) / steps + (Math.random() - 0.5) * 20
          gfx.lineTo(nx, ny)
          lx = nx; ly = ny
        }
        gfx.strokePath()
        frame++
      }
    })

    this.cleanup(game, canvas, 650)
  }

  async explosion(worldX: number, worldY: number, camera: Camera, radius = 64): Promise<void> {
    const { x, y } = camera.worldToScreen(worldX, worldY)
    const { game, scene, canvas } = await this.createPhaserScene(camera.viewW, camera.viewH)

    const particles = scene.add.particles(x, y, undefined, {
      speed: { min: radius * 0.5, max: radius * 2.5 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      lifespan: 600,
      quantity: 30,
      tint: [0xff4400, 0xff8800, 0xffdd00],
      blendMode: 'ADD',
    })

    setTimeout(() => particles.stop(), 100)
    this.cleanup(game, canvas, 800)
  }

  async healing(worldX: number, worldY: number, camera: Camera): Promise<void> {
    const { x, y } = camera.worldToScreen(worldX, worldY)
    const { game, scene, canvas } = await this.createPhaserScene(camera.viewW, camera.viewH)

    const gfx = scene.add.graphics()
    let frame = 0

    scene.time.addEvent({
      delay: 16, repeat: 50, callback: () => {
        gfx.clear()
        const alpha = 1 - frame / 50
        for (let i = 0; i < 5; i++) {
          const px = x + (Math.random() - 0.5) * 40
          const py = y - frame * 1.5 + Math.random() * 10
          gfx.fillStyle(0x44ff88, alpha)
          gfx.fillCircle(px, py, 4)
        }
        frame++
      }
    })

    this.cleanup(game, canvas, 900)
  }
}
