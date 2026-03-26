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
