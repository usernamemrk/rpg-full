import { Router, IRouter, Request } from 'express'
import { z } from 'zod'
import { requireAuth, requireRole } from '../middleware/auth'
import { Server } from 'socket.io'
import { prisma } from '../lib/prisma'

const LayersSchema = z.object({
  ground: z.array(z.array(z.number())),
  objects: z.array(z.array(z.number())),
  overlay: z.array(z.array(z.number())),
})

const SaveMapSchema = z.object({ layers: LayersSchema, sessionId: z.string() })

export function createMapsRouter(io: Server): IRouter {
  const router: IRouter = Router()

  router.get('/:id', requireAuth, async (req, res) => {
    const map = await prisma.map.findUnique({ where: { id: req.params.id } })
    if (!map) return res.status(404).json({ error: 'Map not found' })
    res.json(map)
  })

  router.post('/:id', requireAuth, requireRole('gm'), async (req: Request, res) => {
    const parsed = SaveMapSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
    const { layers, sessionId } = parsed.data
    try {
      const map = await prisma.map.update({ where: { id: req.params.id }, data: { layers } })
      io.to(`session:${sessionId}`).emit('map:updated', { mapId: map.id })
      res.json(map)
    } catch {
      res.status(404).json({ error: 'Map not found' })
    }
  })

  return router
}
