// The Express app (API only). Started by src/index.js locally, and exported as a
// serverless function by api/index.js on Vercel.
import cookieParser from 'cookie-parser'
import express from 'express'
import { adminRouter } from './routes/admin.js'
import { publicRouter } from './routes/public.js'

const app = express()
app.set('trust proxy', 1)
app.use(express.json({ limit: '200kb' }))
app.use(cookieParser())

app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.use('/api', publicRouter)
app.use('/api/admin', adminRouter)
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }))

export function errorHandler(err, _req, res, _next) {
  if (err.code === 'P2002') return res.status(409).json({ error: 'That value is already in use' })
  if (err.code === 'P2025') return res.status(404).json({ error: 'Not found' })
  if (err.status) return res.status(err.status).json({ error: err.message })
  console.error(err)
  res.status(500).json({ error: 'Something went wrong. Please try again.' })
}

app.use(errorHandler)

export default app
