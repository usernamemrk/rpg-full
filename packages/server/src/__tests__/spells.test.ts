import { processSpell } from '../game/SpellService'

describe('processSpell', () => {
  const players = [
    { id: 'p1', x: 1, y: 1 },
    { id: 'p2', x: 10, y: 10 },
  ]

  it('returns damage for lightning hitting nearby player', () => {
    const result = processSpell('lightning', 1, 1, players)
    expect(result.targetId).toBe('p1')
    expect(result.damage).toBeGreaterThan(0)
    expect(result.healing).toBe(0)
  })

  it('returns healing for healing spell hitting nearby player', () => {
    const result = processSpell('healing', 1, 1, players)
    expect(result.targetId).toBe('p1')
    expect(result.healing).toBeGreaterThan(0)
    expect(result.damage).toBe(0)
  })

  it('returns no target when no player in range', () => {
    const result = processSpell('explosion', 50, 50, players)
    expect(result.targetId).toBeNull()
  })
})
