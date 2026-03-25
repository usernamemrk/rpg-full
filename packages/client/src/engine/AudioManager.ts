export type AmbientName = 'floresta' | 'caverna' | 'cidade' | 'dungeon' | 'batalha' | 'chuva'

export class AudioManager {
  private _context: AudioContext | null = null
  private buffers = new Map<string, AudioBuffer>()
  private currentSource: AudioBufferSourceNode | null = null
  private currentGain: GainNode | null = null
  currentAmbient: AmbientName | null = null
  private masterVolume = 1

  private get context(): AudioContext {
    if (!this._context) this._context = new AudioContext()
    return this._context
  }

  async loadAmbient(name: AmbientName) {
    if (this.buffers.has(name)) return
    const formats = ['ogg', 'mp3']
    for (const fmt of formats) {
      try {
        const res = await fetch(`/assets/audio/${name}.${fmt}`)
        if (!res.ok) continue
        const buf = await this.context.decodeAudioData(await res.arrayBuffer())
        this.buffers.set(name, buf)
        return
      } catch { /* try next format */ }
    }
    console.warn(`AudioManager: could not load ${name}`)
  }

  async crossfadeTo(name: AmbientName, durationMs = 1500) {
    await this.loadAmbient(name)
    const buf = this.buffers.get(name)
    if (!buf) return

    const ctx = this.context
    const duration = durationMs / 1000

    // fade out current
    if (this.currentGain) {
      const g = this.currentGain
      g.gain.setValueAtTime(g.gain.value, ctx.currentTime)
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + duration)
      setTimeout(() => { try { this.currentSource?.stop() } catch {} }, durationMs)
    }

    // fade in new
    const source = ctx.createBufferSource()
    source.buffer = buf
    source.loop = true

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(this.masterVolume, ctx.currentTime + duration)

    source.connect(gain)
    gain.connect(ctx.destination)
    source.start()

    this.currentSource = source
    this.currentGain = gain
    this.currentAmbient = name
  }

  setVolume(v: number) {
    this.masterVolume = Math.max(0, Math.min(1, v))
    if (this.currentGain) this.currentGain.gain.setValueAtTime(this.masterVolume, this.context.currentTime)
  }

  resume() {
    if (this.context.state === 'suspended') this.context.resume()
  }
}
