import { Minimap } from '../engine/Minimap'

describe('Minimap', () => {
  it('minimapToWorld converts correctly', () => {
    const mm = new Minimap(150, 150)
    mm.setMapSize(800, 600)
    const w = mm.minimapToWorld(75, 75)
    expect(w.x).toBeCloseTo(400)
    expect(w.y).toBeCloseTo(300)
  })
})
