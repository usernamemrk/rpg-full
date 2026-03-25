import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import authRouter from './api/auth'

const REQUIRED_ENV = ['JWT_SECRET', 'JWT_REFRESH_SECRET'] as const

export function validateEnv() {
  for (const key of REQUIRED_ENV) {
    if (!process.env[key]) throw new Error(`Missing required env var: ${key}`)
  }
}

export function createApp() {
  validateEnv()
  const app = express()
  app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
  app.use(express.json())
  app.use(cookieParser())
  app.use('/api/auth', authRouter)
  return app
}
