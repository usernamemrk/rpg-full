import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'

// In-memory session states: sessionId → SessionState
export const sessionStates = new Map<string, { players: any[] }>()

// Persist state to DB every 30s
const persistInterval = setInterval(async () => {
  for (const [sessionId, state] of sessionStates) {
    await prisma.session.update({ where: { id: sessionId }, data: { state } }).catch(() => {})
  }
}, 30_000)

// Allow cleanup in tests
export function stopPersistInterval() { clearInterval(persistInterval) }

export function registerSessionHandlers(io: Server, socket: Socket) {
  socket.on('session:join', async ({ sessionCode, characterId }: { sessionCode: string; characterId: string }) => {
    const session = await prisma.session.findUnique({ where: { code: sessionCode } }).catch(() => null)
    if (!session) return socket.emit('session:error', { code: 'SESSION_NOT_FOUND', message: 'Session not found' })
    if (session.status === 'ended') return socket.emit('session:error', { code: 'SESSION_ENDED', message: 'Session ended' })

    const room = `session:${session.id}`
    const roomSockets = await io.in(room).fetchSockets()
    if (roomSockets.length >= 7) return socket.emit('session:error', { code: 'SESSION_FULL', message: 'Session full' })

    await socket.join(room)
    socket.data.sessionId = session.id
    socket.data.characterId = characterId

    const tokenPayload = socket.handshake.auth?.token
      ? (() => { try { return jwt.verify(socket.handshake.auth.token, process.env.JWT_SECRET!) as any } catch { return null } })()
      : null
    socket.data.userId = tokenPayload?.sub ?? ''

    if (!sessionStates.has(session.id)) {
      const saved = session.state as any
      sessionStates.set(session.id, saved?.players ? saved : { players: [] })
    }

    const state = sessionStates.get(session.id)!
    if (!state.players.find((p: any) => p.characterId === characterId)) {
      state.players.push({ userId: socket.data.userId, characterId, x: 0, y: 0, hp: 100, direction: 'down' })
    }

    socket.emit('session:joined', { sessionId: session.id, players: state.players })
    io.to(room).emit('session:players', { players: state.players })
  })

  socket.on('session:leave', async () => {
    const { sessionId } = socket.data
    if (!sessionId) return
    const state = sessionStates.get(sessionId)
    if (state) state.players = state.players.filter((p: any) => p.characterId !== socket.data.characterId)
    await socket.leave(`session:${sessionId}`)
    io.to(`session:${sessionId}`).emit('session:players', { players: state?.players ?? [] })
  })

  socket.on('disconnect', async () => {
    const { sessionId } = socket.data
    if (!sessionId) return
    const state = sessionStates.get(sessionId)
    if (state) {
      state.players = state.players.filter((p: any) => p.characterId !== socket.data.characterId)
      if (state.players.length === 0) sessionStates.delete(sessionId)
      else await prisma.session.update({ where: { id: sessionId }, data: { state } }).catch(() => {})
    }
  })
}
