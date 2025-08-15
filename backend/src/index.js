import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { CONFIG } from './config.js'
import authRouter from './routes/auth.js'
import apiRouter from './routes/api.js'
import historyRouter from './routes/history.js'

const app = express()
app.use(cors({ origin: CONFIG.CORS_ORIGIN, credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.get('/', (req, res) => res.json({ ok: true, service: 'skill-sync-backend' }))
app.use('/auth', authRouter)
app.use('/api', apiRouter)
app.use('/api/history', historyRouter)

app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({ message: err.message || 'Server error' })
})

app.listen(CONFIG.PORT, () => console.log(`Backend running on http://localhost:${CONFIG.PORT}`))
