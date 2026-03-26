import request from 'supertest'
import { createApp } from '../app'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'

process.env.JWT_SECRET = 'test-secret'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret'

const { app } = createApp()

function gmToken(userId = 'user1', charId = 'char1') {
  return jwt.sign({ sub: userId, role: 'gm', characterId: charId }, process.env.JWT_SECRET ?? 'test', { expiresIn: '1h' })
}

describe('GET /api/maps/:id', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/maps/nonexistent')
    expect(res.status).toBe(401)
  })
})

describe('GET /api/spells', () => {
  it('returns array of spells', async () => {
    const res = await request(app).get('/api/spells').set('Authorization', `Bearer ${gmToken()}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body[0]).toHaveProperty('id')
  })
})

afterAll(async () => {
  await prisma.$disconnect()
})
