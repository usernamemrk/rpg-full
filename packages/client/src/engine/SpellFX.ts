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

    const ref: { game: any } = { game: null }
    return new Promise(resolve => {
      ref.game = new Phaser.Game({
        type: Phaser.CANVAS,
        canvas,
        width, height,
        transparent: true,
        scene: {
          create(this: any) { resolve({ game: ref.game, scene: this, canvas }) }
        }
      })
    })
  }

  private cleanup(game: any, canvas: HTMLCanvasElement, delayMs: number) {
    setTimeout(() => {
      if (game) game.destroy(true)
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
    const gfx = scene.add.graphics()
    const FRAMES = 45
    let frame = 0

    scene.time.addEvent({
      delay: 16,
      repeat: FRAMES - 1,
      callback: () => {
        gfx.clear()
        const progress = frame / FRAMES
        const alpha = 1 - progress

        gfx.lineStyle(3, 0xff6600, alpha)
        gfx.strokeCircle(x, y, radius * progress)

        if (progress < 0.6) {
          const innerProgress = progress / 0.6
          gfx.lineStyle(2, 0xffdd00, (1 - innerProgress) * 0.8)
          gfx.strokeCircle(x, y, radius * 0.5 * innerProgress)
        }

        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2
          const len = radius * 0.7 * progress
          gfx.lineStyle(1, 0xff9900, alpha * 0.7)
          gfx.beginPath()
          gfx.moveTo(x, y)
          gfx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len)
          gfx.strokePath()
        }

        frame++
      },
    })

    this.cleanup(game, canvas, FRAMES * 16 + 100)
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
