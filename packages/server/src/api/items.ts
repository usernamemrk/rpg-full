import { Router, IRouter } from 'express'
import { z } from 'zod'
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'

const router: IRouter = Router()

const ItemSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['weapon', 'armor', 'potion', 'gold', 'misc']),
  rarity: z.enum(['common', 'uncommon', 'rare', 'legendary']),
  stats: z.record(z.number()),
})

router.get('/', requireAuth, async (_req, res) => {
  const items = await prisma.item.findMany()
  res.json(items)
})

router.post('/', requireAuth, requireRole('gm'), async (req: AuthRequest, res) => {
  const parsed = ItemSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  try {
    const item = await prisma.item.create({ data: { ...parsed.data, stats: parsed.data.stats } })
    res.status(201).json(item)
  } catch {
    res.status(409).json({ error: 'Item with this name already exists' })
  }
})

export default router
