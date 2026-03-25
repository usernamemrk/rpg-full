import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, requireRole } from '../middleware/auth'
import { LootTableSchema } from '../game/LootService'
import { prisma } from '../lib/prisma'

const router = Router()

const ChestUpdateSchema = z.object({ lootTable: LootTableSchema, name: z.string().optional() })

router.put('/:id', requireAuth, requireRole('gm'), async (req, res) => {
  const parsed = ChestUpdateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const chest = await prisma.chest.update({
    where: { id: req.params.id },
    data: { lootTable: parsed.data.lootTable, ...(parsed.data.name ? { name: parsed.data.name } : {}) },
  })
  res.json(chest)
})

export default router
