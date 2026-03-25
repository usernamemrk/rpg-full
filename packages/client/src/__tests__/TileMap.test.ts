import { TileMap } from '../engine/TileMap'
import { Camera } from '../engine/Camera'

const TILE = 32
const layers = {
  ground: [[1, 2], [3, 4]],
  objects: [[0, 0], [0, 0]],
  overlay: [[0, 0], [0, 0]],
}

describe('TileMap', () => {
  it('returns correct tile index at world position', () => {
    const map = new TileMap(layers, TILE)
    expect(map.getTileAt('ground', 0, 0)).toBe(1)
    expect(map.getTileAt('ground', 1, 0)).toBe(2)
    expect(map.getTileAt('ground', 0, 1)).toBe(3)
  })

  it('sets tile at position', () => {
    const map = new TileMap(layers, TILE)
    map.setTileAt('ground', 1, 1, 99)
    expect(map.getTileAt('ground', 1, 1)).toBe(99)
  })

  it('returns -1 for out-of-bounds', () => {
    const map = new TileMap(layers, TILE)
    expect(map.getTileAt('ground', 10, 10)).toBe(-1)
  })
})
