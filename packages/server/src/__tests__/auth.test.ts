import request from 'supertest'
import { createApp } from '../app'

// Note: at Task 3, createApp() returns a plain Express app.
// Task 4 Step 6 will change this to `const { app } = createApp()` when the return type becomes { app, httpServer, io }.
const app = createApp()

describe('POST /api/auth/register', () => {
  it('creates a user and returns 201', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: `test-${Date.now()}@test.com`, password: 'password123', name: 'Tester' })
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('accessToken')
  })

  it('returns 400 for duplicate email', async () => {
    const email = `dup-${Date.now()}@test.com`
    await request(app).post('/api/auth/register').send({ email, password: 'pass', name: 'A' })
    const res = await request(app).post('/api/auth/register').send({ email, password: 'pass', name: 'B' })
    expect(res.status).toBe(400)
  })
})

describe('POST /api/auth/login', () => {
  it('returns accessToken for valid credentials', async () => {
    const email = `login-${Date.now()}@test.com`
    await request(app).post('/api/auth/register').send({ email, password: 'secret', name: 'User' })
    const res = await request(app).post('/api/auth/login').send({ email, password: 'secret' })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('accessToken')
  })

  it('returns 401 for wrong password', async () => {
    const email = `wrong-${Date.now()}@test.com`
    await request(app).post('/api/auth/register').send({ email, password: 'correct', name: 'U' })
    const res = await request(app).post('/api/auth/login').send({ email, password: 'wrong' })
    expect(res.status).toBe(401)
  })
})
