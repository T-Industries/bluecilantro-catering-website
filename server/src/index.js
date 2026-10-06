// Long-running server for local development or a traditional host (Render, Railway, a VM).
// On Vercel this file is not used — see api/index.js.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import app from './app.js'

// When the React app has been built (npm run build), serve it from the same server.
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist')
if (fs.existsSync(dist)) {
  const site = express()
  site.use(app)
  site.use(express.static(dist))
  site.get('/{*splat}', (_req, res) => res.sendFile(path.join(dist, 'index.html')))
  start(site)
} else {
  start(app)
}

function start(handler) {
  const port = Number(process.env.PORT) || 4000
  handler.listen(port, () => console.log(`BlueCilantro Catering API running on http://localhost:${port}`))
}
