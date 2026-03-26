import { Router, IRouter } from 'express'
import { SPELLS } from '../config/spells'
import { requireAuth } from '../middleware/auth'

const router: IRouter = Router()
router.get('/', requireAuth, (_req, res) => res.json(SPELLS))
export default router
