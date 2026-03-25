import { Server, Socket } from 'socket.io'
import { sessionStates } from './sessionHandlers'
import { processSpell } from '../game/SpellService'

type SpellId = 'lightning' | 'explosion' | 'healing'
const VALID_SPELLS: SpellId[] = ['lightning', 'explosion', 'healing']

export function registerSpellHandlers(io: Server, socket: Socket): void {
  socket.on('spell:cast', (data: { sessionId: string; spellId: string; targetX: number; targetY: number }) => {
    const { sessionId, spellId, targetX, targetY } = data ?? {}

    if (!sessionId || !VALID_SPELLS.includes(spellId as SpellId)) return
    if (!Number.isFinite(targetX) || !Number.isFinite(targetY)) return

    const session = sessionStates.get(sessionId)
    if (!session) return

    const players = (session.players as any[]).map((p: any) => ({
      id: p.characterId,
      x: p.x,
      y: p.y,
    }))

    const result = processSpell(spellId as SpellId, targetX, targetY, players)

    io.to(sessionId).emit('spell:effect', { spellId, targetX, targetY, ...result })

    if (result.targetId) {
      io.to(sessionId).emit('entity:damage', {
        targetId: result.targetId,
        damage: result.damage,
        healing: result.healing,
      })
    }
  })
}
