import { Router, IRouter, Request } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import { AuthRequest } from '../middleware/auth'
import { Server } from 'socket.io'
import { prisma } from '../lib/prisma'

const LayersSchema = z.object({
  ground: z.array(z.array(z.number())),
  objects: z.array(z.array(z.number())),
  overlay: z.array(z.array(z.number())),
})

const SaveMapSchema = z.object({ layers: LayersSchema, sessionId: z.string() })

const CreateMapSchema = z.object({
  name: z.string().min(1),
  width: z.number().int().min(5).max(100).default(20),
  height: z.number().int().min(5).max(100).default(20),
  tilesetId: z.string().default('world'),
})

function emptyLayers(w: number, h: number) {
  const empty = () => Array.from({ length: h }, () => Array(w).fill(0))
  return { ground: empty(), objects: empty(), overlay: empty() }
}

export function createMapsRouter(io: Server): IRouter {
  const router: IRouter = Router()

  router.get('/', requireAuth, async (req: AuthRequest, res) => {
    const maps = await prisma.map.findMany({
      where: { createdById: req.user!.sub },
      select: { id: true, name: true, width: true, height: true, tilesetId: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json(maps)
  })

  router.post('/', requireAuth, async (req: AuthRequest, res) => {
    const parsed = CreateMapSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
    const { name, width, height, tilesetId } = parsed.data
    const map = await prisma.map.create({
      data: {
        name,
        width,
        height,
        tilesetId,
        layers: emptyLayers(width, height),
        createdById: req.user!.sub,
      },
    })
    res.status(201).json(map)
  })

  router.get('/:id', requireAuth, async (req, res) => {
    const map = await prisma.map.findUnique({ where: { id: req.params.id } })
    if (!map) return res.status(404).json({ error: 'Map not found' })
    res.json(map)
  })

  router.post('/:id', requireAuth, async (req: Request, res) => {
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
