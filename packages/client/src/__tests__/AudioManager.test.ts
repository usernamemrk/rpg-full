import { vi } from 'vitest'
import { AudioManager } from '../engine/AudioManager'

describe('AudioManager', () => {
  it('starts with no active ambient', () => {
    const am = new AudioManager()
    expect(am.currentAmbient).toBeNull()
  })

  it('tracks current ambient name after crossfade call (mocked)', async () => {
    const am = new AudioManager()
    am['buffers'].set('floresta', {} as AudioBuffer)
    am['_context'] = { createBufferSource: () => ({ buffer: null, loop: false, connect: () => {}, start: () => {} }),
                       createGain: () => ({ gain: { setValueAtTime: () => {}, linearRampToValueAtTime: () => {} }, connect: () => {} }),
                       currentTime: 0, destination: {} } as any
    await am.crossfadeTo('floresta', 0)
    expect(am.currentAmbient).toBe('floresta')
  })
})

describe('AudioManager procedural fallback', () => {
  beforeEach(() => {
    const mockBuffer = { duration: 4 } as AudioBuffer
    const mockOfflineCtx = {
      createOscillator: () => ({ frequency: { value: 0 }, type: 'sine', connect: vi.fn(), start: vi.fn() }),
      createGain: () => ({ gain: { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() }, connect: vi.fn() }),
      createBiquadFilter: () => ({ type: '', frequency: { value: 0 }, Q: { value: 0 }, connect: vi.fn() }),
      createBuffer: (ch: number, len: number) => ({ getChannelData: () => new Float32Array(len) }),
      createBufferSource: () => ({ buffer: null, loop: false, connect: vi.fn(), start: vi.fn() }),
      destination: {},
      sampleRate: 44100,
      length: 44100 * 4,
      startRendering: vi.fn().mockResolvedValue(mockBuffer),
    }
    ;(globalThis as any).OfflineAudioContext = vi.fn(() => mockOfflineCtx)
  })

  it('sets currentAmbient after crossfadeTo even with no audio files', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false }) as any
    const am = new AudioManager()
    am['_context'] = {
      createBufferSource: () => ({ buffer: null, loop: false, connect: vi.fn(), start: vi.fn() }),
      createGain: () => ({ gain: { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() }, connect: vi.fn() }),
      currentTime: 0, destination: {}, state: 'running',
      resume: vi.fn().mockResolvedValue(undefined),
    } as any
    await am.crossfadeTo('floresta', 0)
    expect(am.currentAmbient).toBe('floresta')
  })

  it('caches procedural buffer so OfflineAudioContext runs only once per ambient', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false }) as any
    const am = new AudioManager()
    am['_context'] = {
      createBufferSource: () => ({ buffer: null, loop: false, connect: vi.fn(), start: vi.fn() }),
      createGain: () => ({ gain: { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() }, connect: vi.fn() }),
      currentTime: 0, destination: {}, state: 'running',
      resume: vi.fn().mockResolvedValue(undefined),
    } as any
    await am.crossfadeTo('caverna', 0)
    await am.crossfadeTo('caverna', 0)
    expect((globalThis as any).OfflineAudioContext).toHaveBeenCalledTimes(1)
  })
})
