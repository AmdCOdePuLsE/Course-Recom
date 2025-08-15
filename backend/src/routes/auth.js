import { Router } from 'express'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { CONFIG } from '../config.js'
import { v4 as uuidv4 } from 'uuid'

const USERS_PATH = join(process.cwd(), 'data', 'users.json')
if (!existsSync(USERS_PATH)) writeFileSync(USERS_PATH, '[]')

const router = Router()

function setToken(res, payload){
  const token = jwt.sign(payload, CONFIG.JWT_SECRET, { expiresIn: '7d' })
  res.cookie('token', token, { httpOnly: true, sameSite: 'lax' })
  return token
}

router.post('/signup', (req, res) => {
  const { name, email, password, role } = req.body
  if(!email || !password) return res.status(400).json({ message: 'Missing fields' })
  const users = JSON.parse(readFileSync(USERS_PATH))
  if (users.find(u=>u.email===email)) return res.status(400).json({ message: 'Email already used' })
  const hash = bcrypt.hashSync(password, 10)
  const user = { id: uuidv4(), name, email, password: hash, role: role || 'student' }
  users.push(user)
  writeFileSync(USERS_PATH, JSON.stringify(users, null, 2))
  setToken(res, { id: user.id, role: user.role })
  res.json({ user: { id:user.id, name:user.name, email:user.email, role:user.role } })
})

router.post('/login', (req, res) => {
  const { email, password } = req.body
  const users = JSON.parse(readFileSync(USERS_PATH))
  const user = users.find(u=>u.email===email)
  if (!user) return res.status(400).json({ message: 'Invalid credentials' })
  const ok = bcrypt.compareSync(password, user.password)
  if (!ok) return res.status(400).json({ message: 'Invalid credentials' })
  setToken(res, { id: user.id, role: user.role })
  res.json({ user: { id:user.id, name:user.name, email:user.email, role:user.role } })
})

router.post('/logout', (req,res)=>{
  res.clearCookie('token');
  res.json({ ok:true })
})

export default router
