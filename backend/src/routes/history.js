import { Router } from 'express'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import jwt from 'jsonwebtoken'
import { CONFIG } from '../config.js'
import { getSupabase } from '../supabase.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const HISTORY_PATH = join(__dirname, '..', '..', 'data', 'history.json')
const DATA_DIR = join(__dirname, '..', '..', 'data')

// Ensure data directory exists
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
if (!existsSync(HISTORY_PATH)) writeFileSync(HISTORY_PATH, '{}')

const router = Router()

function auth(req, res, next){
  let token = req.cookies.token
  const authHeader = req.headers.authorization || ''
  if (!token && authHeader.startsWith('Bearer ')) token = authHeader.slice(7)
  if (!token) { req.user = { id: 'ext', role: 'student', ext: true }; return next() }
  try {
    try {
      req.user = jwt.verify(token, CONFIG.JWT_SECRET)
    } catch {
      req.user = { id: 'ext', role: 'student', ext: true }
    }
    next()
  } catch(e){ return res.status(401).json({ message: 'Unauthorized' }) }
}

router.get('/', auth, (req, res) => {
  const sb = getSupabase()
  if (sb && req.user && req.user.id && req.user.id !== 'ext') {
    sb.from('rec_history')
      .select('*')
      .eq('user_id', req.user.id)
      .order('ts', { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (error) { console.error(error); return res.status(500).json({ history: [] }) }
        res.json({ history: data || [] })
      })
    return
  }
  const all = JSON.parse(readFileSync(HISTORY_PATH))
  const list = all[req.user.id] || []
  res.json({ history: list })
})

router.post('/', auth, (req, res) => {
  const sb = getSupabase()
  if (sb && req.user && req.user.id && req.user.id !== 'ext') {
    sb.from('rec_history')
      .insert({ user_id: req.user.id, input: req.body.input, results: req.body.results })
      .then(({ error }) => {
        if (error) { console.error(error); return res.status(500).json({ ok:false }) }
        res.json({ ok:true })
      })
    return
  }
  const all = JSON.parse(readFileSync(HISTORY_PATH))
  const list = all[req.user.id] || []
  const entry = { ts: Date.now(), input: req.body.input, results: req.body.results }
  list.unshift(entry)
  all[req.user.id] = list.slice(0, 20)
  writeFileSync(HISTORY_PATH, JSON.stringify(all, null, 2))
  res.json({ ok:true })
})

export default router
