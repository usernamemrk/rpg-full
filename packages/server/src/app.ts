import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { Server } from 'socket.io'
import { createServer } from 'http'
import authRouter from './api/auth'
import { createMapsRouter } from './api/maps'
import itemsRouter from './api/items'
import spellsRouter from './api/spells'

const REQUIRED_ENV = ['JWT_SECRET', 'JWT_REFRESH_SECRET'] as const

export function validateEnv() {
  for (const key of REQUIRED_ENV) {
    if (!process.env[key]) throw new Error(`Missing required env var: ${key}`)
  }
}

export function createApp() {
  validateEnv()
  const app = express()
  const httpServer = createServer(app)
  const io = new Server(httpServer, { cors: { origin: 'http://localhost:5173', credentials: true } })

  app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
  app.use(express.json())
  app.use(cookieParser())
  app.use('/api/auth', authRouter)
  app.use('/api/maps', createMapsRouter(io))
  app.use('/api/items', itemsRouter)
  app.use('/api/spells', spellsRouter)

  return { app, httpServer, io }
}
