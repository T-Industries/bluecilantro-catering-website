// Vercel serverless function: every /api/* request is routed here (see vercel.json).
// The same Express app runs locally via server/src/index.js.
import app from '../server/src/app.js'

export default app
