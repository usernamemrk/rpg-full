import express, { Express } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { Server } from 'socket.io'
import { createServer, Server as HttpServer } from 'http'
import authRouter from './api/auth'
import { createMapsRouter } from './api/maps'
import itemsRouter from './api/items'
import spellsRouter from './api/spells'
import chestsRouter from './api/chests'
import { createSessionsRouter } from './api/sessions'
import inventoryRouter from './api/inventory'
import { registerSocketHandlers } from './socket/index'

const REQUIRED_ENV = ['JWT_SECRET', 'JWT_REFRESH_SECRET'] as const

export function validateEnv() {
  for (const key of REQUIRED_ENV) {
    if (!process.env[key]) throw new Error(`Missing required env var: ${key}`)
  }
}

export function createApp(): { app: Express; httpServer: HttpServer; io: Server } {
  validateEnv()
  const app = express()
  const httpServer = createServer(app)
  const localOrigin = /^http:\/\/localhost:\d+$/
  const io = new Server(httpServer, { cors: { origin: localOrigin, credentials: true } })
  registerSocketHandlers(io)

  app.use(cors({ origin: localOrigin, credentials: true }))
  app.use(express.json())
  app.use(cookieParser())
  app.use('/api/auth', authRouter)
  app.use('/api/maps', createMapsRouter(io))
  app.use('/api/items', itemsRouter)
  app.use('/api/spells', spellsRouter)
  app.use('/api/chests', chestsRouter)
  app.use('/api/sessions', createSessionsRouter(io))
  app.use('/api/inventory', inventoryRouter)

  return { app, httpServer, io }
}
