import { useEffect, useState } from 'react'
import axios from 'axios'
import syllabus from '../data/syllabus.json'
import RequireAuth from '../components/RequireAuth'
import useAuth from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'
const ML  = import.meta.env.VITE_ML_URL || 'http://127.0.0.1:8000'

export default function Recommendations(){
  const { session } = useAuth()
  const [form, setForm] = useState({
    interests: [],
    careerGoal: '',
    learningStyle: 'Visual',
    currentSemester: 1,
    previousGpas: []
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])

  useEffect(()=>{
    if (!session) return
    const token = session.access_token
    axios.get(`${API}/api/history`, { headers: { Authorization: `Bearer ${token}` } }).then(({data})=>setHistory(data.history||[])).catch(()=>{})
  },[session])

  const electives = Object.values(syllabus.semesters || {}).flatMap(g => g['Electives'] || [])
  const derivedTopics = electives.flatMap(e => (e.topics || [])).concat(
    electives.flatMap(e => {
      const name = (e.name || '').toLowerCase()
      const mapped = []
      if (name.includes('data')) mapped.push('Data')
      if (name.includes('machine') || name.includes('learning')) mapped.push('ML')
      if (name.includes('ai') || name.includes('intelligence')) mapped.push('AI')
      if (name.includes('web')) mapped.push('Web')
      if (name.includes('cloud')) mapped.push('Cloud')
      if (name.includes('security')) mapped.push('Security')
      if (name.includes('network')) mapped.push('Networks')
      if (name.includes('image') || name.includes('vision')) mapped.push('CV')
      if (name.includes('natural language') || name.includes('nlp')) mapped.push('NLP')
      if (name.includes('database')) mapped.push('Databases')
      if (name.includes('algorithm')) mapped.push('Algorithms')
      return mapped
    })
  )
  const topics = Array.from(new Set(derivedTopics)).filter(Boolean)

  const computeLocalFallback = (body) => {
    const electives = Object.values(syllabus.semesters || {}).flatMap(g => g['Electives'] || [])
    const interests = new Set(body.interests || [])
    const prevGpas = Array.isArray(body.previousGpas) ? body.previousGpas : []
    const currentSemester = body.currentSemester || 1
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
    return { recommendations: results.slice(0, 8) }
  }

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const token = session?.access_token
    try {
      // 1) Try backend
      const { data } = await axios.post(`${API}/api/recommend`, form, token ? { headers: { Authorization: `Bearer ${token}` } } : {})
      setResult(data)
      // save & refresh history (best-effort)
      try { await axios.post(`${API}/api/history`, { input: form, results: data }, token ? { headers: { Authorization: `Bearer ${token}` } } : {}) } catch {}
      try { const { data: h } = await axios.get(`${API}/api/history`, token ? { headers: { Authorization: `Bearer ${token}` } } : {}); setHistory(h.history||[]) } catch {}
    } catch (err1) {
      console.warn('Backend recommend failed, trying ML direct:', err1?.message || err1)
      try {
        // 2) Try ML direct
        const { data: ml } = await axios.post(`${ML}/recommend`, form)
        setResult(ml)
        // best-effort history store if backend reachable
        try { await axios.post(`${API}/api/history`, { input: form, results: ml }, token ? { headers: { Authorization: `Bearer ${token}` } } : {}) } catch {}
      } catch (err2) {
        console.warn('ML direct failed, using local heuristic:', err2?.message || err2)
        // 3) Local heuristic fallback
        const fb = computeLocalFallback(form)
        setResult(fb)
        // best-effort history store
        try { await axios.post(`${API}/api/history`, { input: form, results: fb }, token ? { headers: { Authorization: `Bearer ${token}` } } : {}) } catch {}
      }
    } finally { setLoading(false) }
  }

  // Prefill profile academic/preferences if available
  useEffect(() => {
    (async () => {
      if (!session?.user?.id) return
      const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
      if (error) return
      setForm(f => ({
        ...f,
        currentSemester: data?.current_year || f.currentSemester,
        previousGpas: data?.gpas || f.previousGpas,
        careerGoal: data?.career_goal || f.careerGoal,
        learningStyle: data?.learning_style || f.learningStyle,
        interests: (data?.interests && data.interests.length? data.interests : f.interests)
      }))
    })()
  }, [session])

  const toggleInterest = (t) => {
    setForm(f => ({ ...f, interests: f.interests.includes(t) ? f.interests.filter(x=>x!==t) : [...f.interests, t] }))
  }

  return (
    <RequireAuth>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-4">Recommendation System</h1>
      <form onSubmit={submit} className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded border border-gray-200 dark:border-gray-800 p-4">
            <h2 className="font-semibold mb-2">Academic Information</h2>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Current Semester of Study</label>
                <select value={form.currentSemester} onChange={e=>setForm(f=>({...f, currentSemester:Number(e.target.value)}))} className="w-full px-3 py-2 rounded border bg-white dark:bg-gray-900">
                  {[1,2,3,4,5,6,7,8].map(sem => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Previous Semester GPAs</label>
              <div className="grid sm:grid-cols-2 gap-3">
                {Array.from({length: form.currentSemester - 1}, (_, i) => (
                  <div key={i}>
                    <label className="block text-xs text-gray-600 mb-1">Semester {i + 1} GPA</label>
                    <input 
                      type="number" 
                      min="0" 
                      max="10" 
                      step="0.01" 
                      value={form.previousGpas[i] || ''} 
                      onChange={e => {
                        const newGpas = [...form.previousGpas]
                        newGpas[i] = Number(e.target.value)
                        setForm(f => ({...f, previousGpas: newGpas}))
                      }}
                      className="w-full px-3 py-2 rounded border"
                      placeholder="0.00"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded border border-gray-200 dark:border-gray-800 p-4">
            <h2 className="font-semibold mb-2">Interests</h2>
            <div className="flex flex-wrap gap-2">
              {topics.map(t => (
                <button key={t} type="button" onClick={()=>toggleInterest(t)} className={(form.interests.includes(t)?'bg-primary text-white':'bg-gray-100 dark:bg-gray-800')+" px-3 py-1 rounded text-sm"}>{t}</button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded border border-gray-200 dark:border-gray-800 p-4">
              <label className="block text-sm font-medium mb-1">Career Goal</label>
              <select value={form.careerGoal} onChange={e=>setForm(f=>({...f, careerGoal:e.target.value}))} className="w-full px-3 py-2 rounded border bg-white dark:bg-gray-900">
                <option value="">Select...</option>
                <option>Software Engineer</option>
                <option>Data Scientist</option>
                <option>ML Engineer</option>
                <option>Researcher</option>
                <option>Product/PM</option>
              </select>
            </div>
            <div className="rounded border border-gray-200 dark:border-gray-800 p-4">
              <label className="block text-sm font-medium mb-1">Preferred Learning Style</label>
              <select value={form.learningStyle} onChange={e=>setForm(f=>({...f, learningStyle:e.target.value}))} className="w-full px-3 py-2 rounded border bg-white dark:bg-gray-900">
                <option>Visual</option>
                <option>Auditory</option>
                <option>Kinesthetic</option>
                <option>Read/Write</option>
              </select>
            </div>
          </div>

          <button disabled={loading} className="px-5 py-3 rounded bg-primary text-white hover:bg-primary-dark">{loading? 'Processing...' : 'Get Recommendations'}</button>
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold">Results</h2>
          {!result && <p className="text-sm text-gray-500">Submit the form to see recommendations.</p>}
          {result && (
            <div className="space-y-6">
              {/* Top Recommendation Highlight */}
              {result.recommendations && result.recommendations.length > 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">🎯</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">Recommended for You</h3>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                            {Math.round(result.recommendations[0].success_prob * 100)}% Match
                          </span>
                        </div>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {result.recommendations[0].name} ({result.recommendations[0].code})
                      </h4>
                      
                      <div className="space-y-3">
                        <div>
                          <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-1">Why This Course?</h5>
                          <p className="text-gray-700 dark:text-gray-300">
                            {result.recommendations[0].detailed_reason || result.recommendations[0].reason}
                          </p>
                        </div>

                        {result.recommendations[0].explain && (
                          <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4">
                            <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Detailed Analysis</h5>
                            <div className="grid sm:grid-cols-2 gap-4 text-sm">
                              {result.recommendations[0].explain.interest_overlap > 0 && (
                                <div>
                                  <span className="font-medium text-blue-600 dark:text-blue-400">Interest Match:</span>
                                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                                    {result.recommendations[0].explain.matching_topics ? 
                                      result.recommendations[0].explain.matching_topics.slice(0,3).join(', ') :
                                      `${result.recommendations[0].explain.interest_overlap} matching topic${result.recommendations[0].explain.interest_overlap !== 1 ? 's' : ''}`
                                    }
                                  </span>
                                </div>
                              )}
                              {result.recommendations[0].explain.career_alignment && (
                                <div>
                                  <span className="font-medium text-green-600 dark:text-green-400">Career Fit:</span>
                                  <span className="ml-2 text-gray-700 dark:text-gray-300">Aligns with your goal</span>
                                </div>
                              )}
                              {result.recommendations[0].explain.avg_gpa > 0 && (
                                <div>
                                  <span className="font-medium text-purple-600 dark:text-purple-400">Academic Fit:</span>
                                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                                    {result.recommendations[0].explain.avg_gpa}/10 avg GPA
                                    {result.recommendations[0].explain.gpa_trend !== 'stable' && (
                                      <span className={`ml-1 ${result.recommendations[0].explain.gpa_trend === 'improving' ? 'text-green-600' : 'text-red-600'}`}>
                                        ({result.recommendations[0].explain.gpa_trend})
                                      </span>
                                    )}
                                  </span>
                                </div>
                              )}
                              <div>
                                <span className="font-medium text-orange-600 dark:text-orange-400">Learning Style:</span>
                                <span className="ml-2 text-gray-700 dark:text-gray-300">
                                  {result.recommendations[0].explain.learning_style_match} learner
                                </span>
                              </div>
                              {result.recommendations[0].explain.academic_level && (
                                <div>
                                  <span className="font-medium text-teal-600 dark:text-teal-400">Level:</span>
                                  <span className="ml-2 text-gray-700 dark:text-gray-300 capitalize">
                                    {result.recommendations[0].explain.academic_level} course
                                  </span>
                                </div>
                              )}
                              <div>
                                <span className="font-medium text-indigo-600 dark:text-indigo-400">Timing:</span>
                                <span className="ml-2 text-gray-700 dark:text-gray-300">
                                  Semester {result.recommendations[0].explain.current_semester}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {result.recommendations[0].risk && (
                          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <span className="text-amber-600 dark:text-amber-400">⚠️</span>
                              <span className="font-medium text-amber-800 dark:text-amber-200">Attention Required:</span>
                              <span className="text-amber-700 dark:text-amber-300">{result.recommendations[0].risk} risk level</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* All Recommendations List */}
              <div>
                <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">All Recommendations</h3>
                <div className="space-y-3">
                  {(result.recommendations||[]).map((r, index) => (
                    <div key={r.code} className={`p-3 border rounded-lg ${index === 0 ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {index === 0 && <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">TOP PICK</span>}
                            <span className="font-semibold">{r.name}</span>
                            <span className="text-gray-500 text-sm">({r.code})</span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{r.reason}</p>
                          {r.risk && <p className="text-sm text-red-500 mt-1">⚠️ {r.risk} risk</p>}
                        </div>
                        <div className="flex-shrink-0 ml-4">
                          <span className={`px-2 py-1 rounded text-sm font-medium ${r.success_prob<0.5?'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200':r.success_prob<0.75?'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200':'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'}`}>
                            {Math.round(r.success_prob*100)}%
                          </span>
                        </div>
                      </div>
                      {r.explain && (
                        <details className="mt-2">
                          <summary className="text-sm cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">View detailed analysis</summary>
                          <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                            <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{JSON.stringify(r.explain, null, 2)}</pre>
                          </div>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="mt-6">
            <h3 className="font-semibold mb-2">History</h3>
            <ul className="space-y-2 max-h-64 overflow-auto">
              {history.map((h,i)=>
                <li key={i} className="p-2 rounded border">
                  <div className="text-xs text-gray-500">{new Date(h.ts).toLocaleString()}</div>
                  <div className="text-sm">{(h.results?.recommendations?.[0]?.name) || '—'}</div>
                </li>
              )}
            </ul>
          </div>
        </div>
      </form>
    </div>
    </RequireAuth>
  )
}
