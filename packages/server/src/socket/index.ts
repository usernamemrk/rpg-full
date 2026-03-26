import { Server, Socket } from 'socket.io'
import { registerSessionHandlers } from './sessionHandlers'
import { registerMovementHandlers } from './movementHandlers'
import { registerSpellHandlers } from './spellHandlers'
import { registerChestHandlers } from './chestHandlers'

export function registerSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    registerSessionHandlers(io, socket)
    registerMovementHandlers(io, socket)
    registerSpellHandlers(io, socket)
    registerChestHandlers(io, socket)
  })
}
