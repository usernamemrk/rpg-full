import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, requireRole } from '../middleware/auth'
import { Server } from 'socket.io'

const AmbientSchema = z.object({
  ambient: z.enum(['floresta', 'caverna', 'cidade', 'dungeon', 'batalha', 'chuva'])
})

export function createSessionsRouter(io: Server) {
  const router = Router()

  router.post('/:id/ambient', requireAuth, requireRole('gm'), async (req, res) => {
    const parsed = AmbientSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
    io.to(`session:${req.params.id}`).emit('ambient:change', { ambient: parsed.data.ambient })
    res.json({ ok: true })
  })

  return router
}
