import { Router } from 'express'
import { SPELLS } from '../config/spells'
import { requireAuth } from '../middleware/auth'

const router = Router()
router.get('/', requireAuth, (_req, res) => res.json(SPELLS))
export default router
