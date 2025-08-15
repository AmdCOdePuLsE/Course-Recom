import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors({ origin: ['http://localhost:5176', 'http://127.0.0.1:5176'], credentials: true }))
app.use(express.json())

app.get('/', (req, res) => res.json({ ok: true, service: 'skill-sync-backend-minimal' }))

// Simple recommend endpoint for testing
app.post('/api/recommend', (req, res) => {
  console.log('Received recommend request:', req.body)
  res.json({
    recommendations: [
      {
        code: 'CSE590',
        name: 'Advanced Machine Learning',
        success_prob: 0.85,
        reason: 'Matches your interests in AI and Data',
        detailed_reason: 'This course aligns perfectly with your interests in AI and Data Science. Your academic performance indicates you are well-prepared for this challenging course.',
        explain: {
          interest_overlap: 2,
          matching_topics: ['AI', 'Data'],
          current_semester: req.body.currentSemester || 1,
          avg_gpa: req.body.previousGpas?.length ? (req.body.previousGpas.reduce((a,b) => a+b, 0) / req.body.previousGpas.length).toFixed(2) : 0
        }
      }
    ]
  })
})

const PORT = 4000
app.listen(PORT, () => {
  console.log(`Minimal backend running on http://localhost:${PORT}`)
  console.log('Testing with: curl -X POST http://localhost:4000/api/recommend -H "Content-Type: application/json" -d "{}"')
})
