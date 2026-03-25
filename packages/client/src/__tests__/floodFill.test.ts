import { floodFill } from '../components/master/MapEditor'

describe('floodFill', () => {
  it('fills connected region', () => {
    const grid = [[1, 1, 1], [1, 1, 1], [1, 1, 1]]
    const result = floodFill(grid, 1, 1, 1, 5)
    expect(result.every(row => row.every(v => v === 5))).toBe(true)
  })

  it('does not fill different tiles', () => {
    const grid = [[1, 2, 1], [1, 2, 1], [1, 2, 1]]
    const result = floodFill(grid, 0, 0, 1, 9)
    expect(result[0][1]).toBe(2)  // wall not filled
  })
})
