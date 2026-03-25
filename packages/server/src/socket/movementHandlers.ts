import { Server, Socket } from 'socket.io'
import { sessionStates } from './sessionHandlers'

export function registerMovementHandlers(io: Server, socket: Socket) {
  socket.on('player:move', ({ x, y, direction }: { x: number; y: number; direction: string }) => {
    const { sessionId, characterId } = socket.data
    if (!sessionId) return
    const state = sessionStates.get(sessionId)
    if (!state) return
    const player = state.players.find((p: any) => p.characterId === characterId)
    if (player) { player.x = x; player.y = y; player.direction = direction }
    io.to(`session:${sessionId}`).emit('player:state', { players: state.players })
  })
}
