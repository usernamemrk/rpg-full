import request from 'supertest'
import { createApp } from '../app'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'

process.env.JWT_SECRET = 'test-secret'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret'

const { app } = createApp()

function playerToken(userId = 'user1', charId = 'char1') {
  return jwt.sign({ sub: userId, role: 'player', characterId: charId }, 'test-secret', { expiresIn: '1h' })
}

describe('GET /api/inventory/:characterId', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/inventory/char1')
    expect(res.status).toBe(401)
  })

  it('returns empty array when character has no items', async () => {
    jest.spyOn(prisma.inventoryItem, 'findMany').mockResolvedValueOnce([])
    const res = await request(app)
      .get('/api/inventory/char1')
      .set('Authorization', `Bearer ${playerToken()}`)
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('returns items with nested item data', async () => {
    const mockItems = [{
      id: 'inv1', quantity: 2,
      item: { id: 'item1', name: 'Espada', type: 'weapon', rarity: 'rare', stats: {} },
    }]
    jest.spyOn(prisma.inventoryItem, 'findMany').mockResolvedValueOnce(mockItems as any)
    const res = await request(app)
      .get('/api/inventory/char1')
      .set('Authorization', `Bearer ${playerToken()}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].item.name).toBe('Espada')
    expect(res.body[0].quantity).toBe(2)
  })
})

afterAll(async () => {
  await prisma.$disconnect()
})
