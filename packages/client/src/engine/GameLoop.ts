export class GameLoop {
  private raf = 0
  private last = 0
  private running = false

  start(tick: (dt: number) => void) {
    this.running = true
    const loop = (now: number) => {
      if (!this.running) return
      const dt = Math.min((now - this.last) / 1000, 0.1)
      this.last = now
      tick(dt)
      this.raf = requestAnimationFrame(loop)
    }
    this.last = performance.now()
    this.raf = requestAnimationFrame(loop)
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this.raf)
  }
}
