import { Server, Socket } from 'socket.io'
import { sessionStates } from './sessionHandlers'
import { processSpell } from '../game/SpellService'

type SpellId = 'lightning' | 'explosion' | 'healing'
const VALID_SPELLS: SpellId[] = ['lightning', 'explosion', 'healing']
const TILE_SIZE = 32

export function registerSpellHandlers(io: Server, socket: Socket): void {
  socket.on('spell:cast', ({ spellId, targetX, targetY }: { spellId: string; targetX: number; targetY: number }) => {
    const { sessionId, characterId } = socket.data
    if (!sessionId) return
    if (!VALID_SPELLS.includes(spellId as SpellId)) return
    if (!Number.isFinite(targetX) || !Number.isFinite(targetY)) return

    const state = sessionStates.get(sessionId)
    if (!state) return

    // Convert pixel coords from client to tile coords before processing
    const tileX = Math.floor(targetX / TILE_SIZE)
    const tileY = Math.floor(targetY / TILE_SIZE)

    const result = processSpell(spellId, tileX, tileY, state.players.map((p: any) => ({
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

    if (result.targetId !== null) {
      const targetPlayer = state.players.find((p: any) => p.characterId === result.targetId)
      let newHp: number | undefined
      if (targetPlayer && 'hp' in targetPlayer) {
        const delta = result.damage > 0 ? -result.damage : result.healing
        targetPlayer.hp = Math.min(100, Math.max(0, targetPlayer.hp + delta))
        newHp = targetPlayer.hp
      }
      const amount = result.damage > 0 ? -result.damage : result.healing
      io.to(`session:${sessionId}`).emit('entity:damage', {
        entityId: result.targetId,
        amount,
        ...(newHp !== undefined ? { newHp } : {}),
      })
    }
  })
}
