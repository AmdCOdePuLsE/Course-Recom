import { Router } from 'express'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import jwt from 'jsonwebtoken'
import fetch from 'node-fetch'
import { CONFIG } from '../config.js'
import { getSupabase } from '../supabase.js'

const router = Router()

function auth(req, res, next){
  let token = req.cookies.token
  const authHeader = req.headers.authorization || ''
  if (!token && authHeader.startsWith('Bearer ')) token = authHeader.slice(7)
  // If no token, treat as external minimal user (still allow access)
  if (!token) {
    req.user = { id: 'ext', role: 'student', ext: true }
    return next()
  }
  try {
    // Try verify with our JWT first; if it fails, accept opaque token and pass minimal user
    try {
      req.user = jwt.verify(token, CONFIG.JWT_SECRET)
    } catch {
      // Treat as external token (e.g., Supabase). Minimal user with default role 'student'
      req.user = { id: 'ext', role: 'student', ext: true }
    }
    next()
  } catch(e){ return res.status(401).json({ message: 'Unauthorized' }) }
}

// simple cached electives loader for fallback
let CACHED_ELECTIVES = null
function loadElectives(){
  if (CACHED_ELECTIVES) return CACHED_ELECTIVES
  try {
    const path = join(process.cwd(), '..', 'frontend', 'src', 'data', 'syllabus.json')
    if (existsSync(path)){
      const syllabus = JSON.parse(readFileSync(path, 'utf-8'))
      const electives = []
      for (const sem of Object.values(syllabus?.semesters || {})){
        electives.push(...(sem?.['Electives'] || []))
      }
      CACHED_ELECTIVES = electives
      return electives
    }
  } catch {}
  CACHED_ELECTIVES = []
  return CACHED_ELECTIVES
}

router.post('/recommend', auth, async (req, res) => {
  const body = req.body || {}
  try {
    const r = await fetch(`${CONFIG.ML_URL}/recommend`, {
      method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(body)
    })
    if (!r.ok) throw new Error(`ML bad status ${r.status}`)
    const data = await r.json()
    return res.json(data)
  } catch (e){
    console.warn('ML service unavailable, using fallback. Reason:', e?.message || e)
    // Fallback: heuristic based on interests and simple randomness
    const electives = loadElectives()
    const interests = new Set(body.interests || [])
    const prevGpas = Array.isArray(body.previousGpas) ? body.previousGpas : (Array.isArray(body.gpas)? body.gpas : [])
    const currentSemester = body.currentSemester || body.currentYear || 1
    const results = electives.map(e => {
      const name = (e.name || '').toLowerCase()
      const topics = (e.topics || []).slice()
      if (name.includes('data')) topics.push('Data')
      if (name.includes('machine') || name.includes('learning')) topics.push('ML')
      if (name.includes('ai') || name.includes('intelligence')) topics.push('AI')
      if (name.includes('web')) topics.push('Web')
      if (name.includes('cloud')) topics.push('Cloud')
      if (name.includes('security')) topics.push('Security')
      if (name.includes('network')) topics.push('Networks')
      if (name.includes('image') || name.includes('vision')) topics.push('CV')
      if (name.includes('natural language') || name.includes('nlp')) topics.push('NLP')
      if (name.includes('database')) topics.push('Databases')
      if (name.includes('algorithm')) topics.push('Algorithms')
      const overlap = topics.filter(t => interests.has(t)).length
      let base = 0.4 + 0.1 * overlap
      if (prevGpas?.length){
        const latest = prevGpas[prevGpas.length-1] / 10
        base = 0.6*base + 0.4*latest
      }
      const success_prob = Math.max(0.1, Math.min(0.95, base + (Math.random()*0.1 - 0.05)))
      const risk = success_prob < 0.5 ? 'High' : (success_prob < 0.75 ? 'Medium' : null)
      const reason = overlap>0 ? `Matches your interests (${topics.filter(t=>interests.has(t)).slice(0,3).join(', ')})` : 'General fit based on profile'
      const detailed_reason = overlap>0 ? 
        `This course strongly aligns with your interests in ${topics.filter(t=>interests.has(t)).slice(0,3).join(', ')}. ${prevGpas?.length ? `Your academic performance (avg ${(prevGpas.reduce((a,b)=>a+b,0)/prevGpas.length).toFixed(1)}/10 GPA) indicates good preparation for this course.` : ''} Taking this course in semester ${currentSemester} will build valuable skills for your career path.` :
        'This course provides a solid foundation and fits well with your current academic progression.'
      return { 
        code: e.code, 
        name: e.name, 
        success_prob, 
        risk, 
        reason, 
        detailed_reason,
        explain: { 
          overlap, 
          current_semester: currentSemester,
          matching_topics: topics.filter(t=>interests.has(t)),
          avg_gpa: prevGpas?.length ? Math.round((prevGpas.reduce((a,b)=>a+b,0)/prevGpas.length)*100)/100 : 0,
          academic_level: currentSemester <= 2 ? 'beginner' : (currentSemester <= 5 ? 'intermediate' : 'advanced')
        } 
      }
    })
    results.sort((a,b)=> b.success_prob - a.success_prob)
    return res.json({ recommendations: results.slice(0, 8) })
  }
})

router.get('/analytics', auth, (req, res) => {
  // Demo analytics data
  res.json({
    popularity: [ { code:'CSE590', count: 120 }, { code:'CSE591', count: 95 }, { code:'CSE690', count: 60 } ],
    passFail: [ { code:'CSE590', pass: 90, fail: 10 }, { code:'CSE591', pass: 85, fail: 15 } ],
    dropout: [ { code:'CSE590', dropout: 0.12 }, { code:'CSE591', dropout: 0.09 }, { code:'CSE690', dropout: 0.15 } ]
  })
})

router.get('/at-risk', auth, (req, res) => {
  // Faculty-only: a simple check
  if (req.user.role !== 'faculty') return res.status(403).json({ message: 'Forbidden' })
  res.json({ students: [
    { name:'Alice', course:'CSE590', difficulty: 'High', dropout: 0.62 },
    { name:'Bob', course:'CSE690', difficulty: 'Medium', dropout: 0.51 },
    { name:'Cara', course:'CSE591', difficulty: 'High', dropout: 0.43 }
  ]})
})

router.post('/contact', async (req, res) => {
  const { name, email, message } = req.body || {}
  const sb = getSupabase()
  if (sb && message) {
    try {
      const userId = req.user?.id && req.user.id !== 'ext' ? req.user.id : null
      const { error } = await sb.from('contact_messages').insert({ user_id: userId, name, email, message })
      if (error) throw error
    } catch (e) {
      console.error(e)
      return res.status(500).json({ ok:false })
    }
  }
  res.json({ ok:true })
})

router.post('/predict', auth, async (req, res) => {
  try {
    const r = await fetch(`${CONFIG.ML_URL}/predict`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(req.body) })
    res.json(await r.json())
  } catch { res.status(500).json({ message:'ML service unavailable' }) }
})

router.post('/risk', auth, async (req, res) => {
  try {
    const r = await fetch(`${CONFIG.ML_URL}/risk`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(req.body) })
    res.json(await r.json())
  } catch { res.status(500).json({ message:'ML service unavailable' }) }
})

export default router
