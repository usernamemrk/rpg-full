import { Router, IRouter } from 'express'
import { z } from 'zod'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { Server } from 'socket.io'
import { prisma } from '../lib/prisma'

const AmbientSchema = z.object({
  ambient: z.enum(['floresta', 'caverna', 'cidade', 'dungeon', 'batalha', 'chuva'])
})

const CreateSessionSchema = z.object({ mapId: z.string() })

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export function createSessionsRouter(io: Server): IRouter {
  const router: IRouter = Router()

  router.post('/', requireAuth, async (req: AuthRequest, res) => {
    const parsed = CreateSessionSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
    const { mapId } = parsed.data
    const map = await prisma.map.findUnique({ where: { id: mapId } })
    if (!map) return res.status(404).json({ error: 'Map not found' })
    let code: string
    let attempts = 0
    do {
      code = generateCode()
      attempts++
      if (attempts > 20) return res.status(500).json({ error: 'Could not generate unique code' })
    } while (await prisma.session.findUnique({ where: { code } }))
    const session = await prisma.session.create({
      data: { code, gmId: req.user!.sub, mapId, state: {} },
    })
    res.status(201).json({ id: session.id, code: session.code })
  })

  router.get('/code/:code', requireAuth, async (req, res) => {
    const session = await prisma.session.findUnique({
      where: { code: req.params.code.toUpperCase() },
      include: { map: true },
    })
    if (!session) return res.status(404).json({ error: 'Session not found' })
    if (session.status === 'ended') return res.status(410).json({ error: 'Session has ended' })
    res.json({ id: session.id, code: session.code, mapId: session.mapId })
  })

  router.get('/:id', requireAuth, async (req, res) => {
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: { map: true },
    })
    if (!session) return res.status(404).json({ error: 'Session not found' })
    res.json({ id: session.id, code: session.code, map: session.map, status: session.status })
  })

  router.post('/:id/ambient', requireAuth, async (req: AuthRequest, res) => {
    try {
      const parsed = AmbientSchema.safeParse(req.body)
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
      io.to(`session:${req.params.id}`).emit('ambient:change', { ambient: parsed.data.ambient })
      res.json({ ok: true })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  return router
}
