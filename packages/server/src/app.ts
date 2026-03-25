import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import authRouter from './api/auth'

export function createApp() {
  const app = express()
  app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
  app.use(express.json())
  app.use(cookieParser())
  app.use('/api/auth', authRouter)
  return app
}
