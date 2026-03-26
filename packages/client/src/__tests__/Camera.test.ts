import { Camera } from '../engine/Camera'

describe('Camera', () => {
  it('worldToScreen converts with offset', () => {
    const cam = new Camera(800, 600)
    cam.x = 100; cam.y = 50
    const s = cam.worldToScreen(100, 50)
    expect(s).toEqual({ x: 0, y: 0 })
  })

  it('screenToWorld is inverse of worldToScreen', () => {
    const cam = new Camera(800, 600)
    cam.x = 32; cam.y = 64
    const world = cam.screenToWorld(200, 100)
    const back = cam.worldToScreen(world.x, world.y)
    expect(back.x).toBeCloseTo(200)
    expect(back.y).toBeCloseTo(100)
  })

  it('clamps to map bounds', () => {
    const cam = new Camera(800, 600)
    cam.setMapBounds(10 * 32, 10 * 32)
    cam.moveTo(-100, -100)
    expect(cam.x).toBe(0)
    expect(cam.y).toBe(0)
  })
})
