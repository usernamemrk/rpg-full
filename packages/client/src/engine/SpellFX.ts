// Phaser is lazy-loaded — do NOT import at module level
type SpellId = 'lightning' | 'explosion' | 'healing'

export class SpellFX {
  private scene: any = null

  async init(containerId: string): Promise<void> {
    const Phaser = await import('phaser')
    // Minimal Phaser scene for spell animations
    const config: any = {
      type: Phaser.AUTO,
      parent: containerId,
      width: 800,
      height: 600,
      transparent: true,
      scene: {
        create: () => { this.scene = this },
      },
    }
    new Phaser.Game(config)
  }

  play(spellId: SpellId, x: number, y: number): void {
    if (!this.scene) return
    switch (spellId) {
      case 'lightning':
        this.playLightning(x, y)
        break
      case 'explosion':
        this.playExplosion(x, y)
        break
      case 'healing':
        this.playHealing(x, y)
        break
    }
  }

  private playLightning(x: number, y: number): void {
    if (!this.scene) return
    // Flash white circle
    const g = this.scene.add.graphics()
    g.fillStyle(0xffffff, 1)
    g.fillCircle(x, y, 20)
    this.scene.tweens.add({ targets: g, alpha: 0, duration: 300, onComplete: () => g.destroy() })
  }

  private playExplosion(x: number, y: number): void {
    if (!this.scene) return
    const g = this.scene.add.graphics()
    g.fillStyle(0xff4400, 1)
    g.fillCircle(x, y, 30)
    this.scene.tweens.add({ targets: g, scaleX: 2, scaleY: 2, alpha: 0, duration: 400, onComplete: () => g.destroy() })
  }

  private playHealing(x: number, y: number): void {
    if (!this.scene) return
    const g = this.scene.add.graphics()
    g.fillStyle(0x00ff88, 1)
    g.fillCircle(x, y, 15)
    this.scene.tweens.add({ targets: g, y: y - 40, alpha: 0, duration: 500, onComplete: () => g.destroy() })
  }
}
