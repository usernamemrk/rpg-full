type SpellId = 'lightning' | 'explosion' | 'healing'

interface Player {
  id: string
  x: number
  y: number
}

interface SpellResult {
  targetId: string | null
  damage: number
  healing: number
}

const SPELL_RANGE = 1 // Chebyshev distance in tiles

const SPELL_STATS: Record<SpellId, { damage: number; healing: number }> = {
  lightning: { damage: 25, healing: 0 },
  explosion: { damage: 40, healing: 0 },
  healing:   { damage: 0,  healing: 30 },
}

function chebyshev(ax: number, ay: number, bx: number, by: number): number {
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by))
}

export function processSpell(
  spellId: SpellId,
  targetX: number,
  targetY: number,
  players: Player[],
): SpellResult {
  const stats = SPELL_STATS[spellId]
  if (!stats) return { targetId: null, damage: 0, healing: 0 }

  const nearest = players
    .map(p => ({ p, dist: chebyshev(targetX, targetY, p.x, p.y) }))
    .filter(({ dist }) => dist <= SPELL_RANGE)
    .sort((a, b) => a.dist - b.dist)[0]

  if (!nearest) return { targetId: null, damage: 0, healing: 0 }

  return { targetId: nearest.p.id, damage: stats.damage, healing: stats.healing }
}
