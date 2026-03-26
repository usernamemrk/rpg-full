import { SPELLS } from '../config/spells'

interface Player {
  id: string
  x: number
  y: number
}

export interface SpellResult {
  targetId: string | null
  damage: number
  healing: number
}

function chebyshev(ax: number, ay: number, bx: number, by: number): number {
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by))
}

export function processSpell(
  spellId: string,
  targetX: number,
  targetY: number,
  players: Player[],
): SpellResult {
  const spell = SPELLS.find(s => s.id === spellId)
  if (!spell) return { targetId: null, damage: 0, healing: 0 }

  const nearest = players
    .map(p => ({ p, dist: chebyshev(targetX, targetY, p.x, p.y) }))
    .filter(({ dist }) => dist <= spell.range)
    .sort((a, b) => a.dist - b.dist)[0]

  if (!nearest) return { targetId: null, damage: 0, healing: 0 }

  return { targetId: nearest.p.id, damage: spell.damage ?? 0, healing: spell.healing ?? 0 }
}
