import { Router, IRouter } from 'express'
import { requireAuth } from '../middleware/auth'
import { prisma } from '../lib/prisma'

const router: IRouter = Router()

router.get('/:characterId', requireAuth, async (req, res) => {
  try {
    const items = await prisma.inventoryItem.findMany({
      where: { characterId: req.params.characterId },
      include: { item: true },
      orderBy: { item: { name: 'asc' } },
    })
    res.json(items)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
