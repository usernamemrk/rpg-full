import { rollLoot, LootTableSchema } from '../game/LootService'

const entries = [
  { itemId: 'item1', quantity: { min: 1, max: 1 }, weight: 1 },
  { itemId: 'item2', quantity: { min: 2, max: 5 }, weight: 2 },
  { itemId: 'item3', quantity: { min: 1, max: 1 }, weight: 0 },
]

describe('rollLoot', () => {
  it('returns guaranteed_min items', () => {
    const result = rollLoot({ mode: 'single_use', guaranteed_min: 2, entries }, [
      { id: 'item1', name: 'Sword', type: 'weapon', rarity: 'common', stats: {} },
      { id: 'item2', name: 'Gold', type: 'gold', rarity: 'common', stats: {} },
    ])
    expect(result.length).toBe(2)
  })

  it('never returns items with weight 0', () => {
    for (let i = 0; i < 20; i++) {
      const result = rollLoot({ mode: 'infinite', guaranteed_min: 1, entries }, [
        { id: 'item1', name: 'S', type: 'weapon', rarity: 'common', stats: {} },
        { id: 'item2', name: 'G', type: 'gold', rarity: 'common', stats: {} },
        { id: 'item3', name: 'X', type: 'misc', rarity: 'common', stats: {} },
      ])
      expect(result.every(r => r.itemId !== 'item3')).toBe(true)
    }
  })

  it('handles guaranteed_min > entries length', () => {
    const result = rollLoot({ mode: 'single_use', guaranteed_min: 10, entries: [entries[0]] }, [
      { id: 'item1', name: 'S', type: 'weapon', rarity: 'common', stats: {} },
    ])
    expect(result.length).toBe(1)
  })

  it('quantity is within min-max range', () => {
    const result = rollLoot({ mode: 'infinite', guaranteed_min: 1, entries: [entries[1]] }, [
      { id: 'item2', name: 'G', type: 'gold', rarity: 'common', stats: {} },
    ])
    expect(result[0].quantity).toBeGreaterThanOrEqual(2)
    expect(result[0].quantity).toBeLessThanOrEqual(5)
  })
})

describe('LootTableSchema', () => {
  it('rejects missing mode', () => {
    const result = LootTableSchema.safeParse({ guaranteed_min: 1, entries: [] })
    expect(result.success).toBe(false)
  })
})
