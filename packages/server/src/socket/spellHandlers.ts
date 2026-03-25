import { Server, Socket } from 'socket.io'
import { sessionStates } from './sessionHandlers'
import { processSpell } from '../game/SpellService'

type SpellId = 'lightning' | 'explosion' | 'healing'
const VALID_SPELLS: SpellId[] = ['lightning', 'explosion', 'healing']

export function registerSpellHandlers(io: Server, socket: Socket): void {
  socket.on('spell:cast', ({ spellId, targetX, targetY }: { spellId: string; targetX: number; targetY: number }) => {
    const { sessionId, characterId } = socket.data
    if (!sessionId) return
    if (!VALID_SPELLS.includes(spellId as SpellId)) return
    if (!Number.isFinite(targetX) || !Number.isFinite(targetY)) return

    const state = sessionStates.get(sessionId)
    if (!state) return

    const result = processSpell(spellId, targetX, targetY, state.players.map((p: any) => ({
      id: p.characterId,
      x: p.x,
      y: p.y,
    })))

    io.to(`session:${sessionId}`).emit('spell:effect', {
      spellId,
      casterId: characterId,
      originX: state.players.find((p: any) => p.characterId === characterId)?.x ?? 0,
      originY: state.players.find((p: any) => p.characterId === characterId)?.y ?? 0,
      targetX, targetY,
    })
  })
}
