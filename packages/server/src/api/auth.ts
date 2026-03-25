import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

const router = Router()

const RegisterSchema = z.object({ email: z.string().email(), password: z.string().min(6), name: z.string().min(1) })
const LoginSchema = z.object({ email: z.string().email(), password: z.string() })

function signAccess(payload: object) {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '15m' })
}
function signRefresh(payload: object) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' })
}

router.post('/register', async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const { email, password, name } = parsed.data
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return res.status(400).json({ error: 'Email already in use' })
  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({ data: { email, passwordHash } })
  const char = await prisma.character.create({
    data: { name, class: 'warrior', hp: 100, maxHp: 100, userId: user.id }
  })
  const payload = { sub: user.id, role: 'player' as const, characterId: char.id }
  const accessToken = signAccess(payload)
  const refreshToken = signRefresh({ sub: user.id })
  res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 3600 * 1000 })
  res.status(201).json({ accessToken })
})

router.post('/login', async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const { email, password } = parsed.data
  const user = await prisma.user.findUnique({ where: { email }, include: { characters: { take: 1 } } })
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    return res.status(401).json({ error: 'Invalid credentials' })
  const char = user.characters[0]
  if (!char) return res.status(409).json({ error: 'No character found for user' })
  const payload = { sub: user.id, role: 'player' as const, characterId: char.id }
  const accessToken = signAccess(payload)
  const refreshToken = signRefresh({ sub: user.id })
  res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 3600 * 1000 })
  res.json({ accessToken })
})

router.post('/refresh', async (req, res) => {
  const token = req.cookies?.refreshToken
  if (!token) return res.status(401).json({ error: 'No refresh token' })
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { sub: string }
    const user = await prisma.user.findUnique({ where: { id: decoded.sub }, include: { characters: { take: 1 } } })
    if (!user) return res.status(401).json({ error: 'User not found' })
    const char = user.characters[0]
    if (!char) return res.status(409).json({ error: 'No character found for user' })
    const accessToken = signAccess({ sub: user.id, role: 'player', characterId: char.id })
    res.json({ accessToken })
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' })
  }
})

router.post('/logout', (_req, res) => {
  res.clearCookie('refreshToken')
  res.json({ ok: true })
})

export default router
