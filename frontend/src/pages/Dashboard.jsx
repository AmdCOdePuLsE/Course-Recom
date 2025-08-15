import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import useAuth from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

const menu = [
  { key:'overview', label:'Overview' },
  { key:'profile', label:'Profile' },
  { key:'history', label:'History' },
  { key:'faculty', label:'Faculty' },
]

export default function Dashboard(){
  const { session } = useAuth()
  const userId = session?.user?.id
  const email = session?.user?.email
  const [collapsed, setCollapsed] = useState(false)
  const [active, setActive] = useState('overview')
  const [profile, setProfile] = useState({ id:'', email:'', name:'', avatar_url:'', role:'student', current_year:1, gpas:[], gpa:'', career_goal:'', learning_style:'Visual', interests:[] })
  const [saving, setSaving] = useState(false)
  const [students, setStudents] = useState([])
  const [history, setHistory] = useState([])

  const localRole = useMemo(() => {
    const u = localStorage.getItem('user')
    return u ? JSON.parse(u).role : 'student'
  }, [])

  useEffect(() => {
    // Collapse sidebar by default on small screens for better mobile experience
    try { if (typeof window !== 'undefined' && window.innerWidth < 768) setCollapsed(true) } catch {}
    if (!userId) return
    ;(async () => {
      try {
        // Load profile from Supabase, create if missing
        const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
        if (error) console.warn('Profile fetch error:', error)
        
        const overridesKey = `profile_overrides_${userId}`
        const overrides = JSON.parse(localStorage.getItem(overridesKey) || 'null') || {}
        
        if (!data) {
          // Try to create profile, but don't fail if RLS prevents it
          try {
            await supabase.from('profiles').insert({ id: userId, email, role: localRole })
          } catch (insertError) {
            console.warn('Profile creation failed (using local storage):', insertError.message)
          }
          
          setProfile({ 
            id: userId, 
            email, 
            name: overrides.name || '', 
            avatar_url: overrides.avatar_url || '', 
            role: localRole, 
            current_year: overrides.current_year || 1, 
            gpas: overrides.gpas || [], 
            gpa: overrides.gpa || '',
            career_goal: overrides.career_goal || '', 
            learning_style: overrides.learning_style || 'Visual', 
            interests: overrides.interests || [] 
          })
        } else {
          setProfile({ 
            id: data.id, 
            email: data.email || email, 
            name: overrides.name || data.name || '', 
            avatar_url: overrides.avatar_url || data.avatar_url || '', 
            role: data.role || localRole, 
            current_year: overrides.current_year || data.current_year || 1, 
            gpas: overrides.gpas || data.gpas || [], 
            gpa: overrides.gpa || data.gpa || '',
            career_goal: overrides.career_goal || data.career_goal || '', 
            learning_style: overrides.learning_style || data.learning_style || 'Visual', 
            interests: overrides.interests || data.interests || [] 
          })
        }
      } catch (err) {
        console.error('Profile loading error:', err)
        // Fallback to local profile with user ID
        const overridesKey = `profile_overrides_${userId}`
        const overrides = JSON.parse(localStorage.getItem(overridesKey) || 'null') || {}
        setProfile({ 
          id: userId, 
          email, 
          name: overrides.name || '', 
          avatar_url: overrides.avatar_url || '', 
          role: localRole, 
          current_year: overrides.current_year || 1, 
          gpas: overrides.gpas || [], 
          gpa: overrides.gpa || '',
          career_goal: overrides.career_goal || '', 
          learning_style: overrides.learning_style || 'Visual', 
          interests: overrides.interests || [] 
        })
      }
      // Load history count & last item
      try {
        const token = session.access_token
        const { data: h } = await axios.get(`${API}/api/history`, { headers: { Authorization: `Bearer ${token}` } })
        setHistory(h.history || [])
      } catch {}
      // Faculty: load at-risk
      if (localRole === 'faculty') {
        try {
          const token = session.access_token
          const { data: a } = await axios.get(`${API}/api/at-risk`, { headers: { Authorization: `Bearer ${token}` } })
          setStudents(a.students||[])
        } catch {}
      }
    })()
  }, [userId])

  const saveProfile = async (e) => {
    e?.preventDefault()
    setSaving(true)
    try {
      // Always save to localStorage first (works regardless of DB setup)
      const overridesKey = `profile_overrides_${profile.id}`
      localStorage.setItem(overridesKey, JSON.stringify({ 
        name: profile.name, 
        avatar_url: profile.avatar_url, 
        current_year: profile.current_year, 
        gpas: profile.gpas, 
        gpa: profile.gpa,
        career_goal: profile.career_goal, 
        learning_style: profile.learning_style, 
        interests: profile.interests 
      }))

      // Try to update Supabase (if accessible and RLS allows)
      try {
        const profileData = { 
          id: profile.id, 
          email: profile.email, 
          name: profile.name, 
          avatar_url: profile.avatar_url, 
          role: profile.role, 
          current_year: profile.current_year, 
          gpas: profile.gpas, 
          gpa: profile.gpa,
          career_goal: profile.career_goal, 
          learning_style: profile.learning_style, 
          interests: profile.interests 
        }
        
        // First try to update existing record
        const updateResp = await supabase.from('profiles').update(profileData).eq('id', profile.id)
        
        if (updateResp.error) {
          // If update fails, try upsert (insert or update)
          const upsertResp = await supabase.from('profiles').upsert(profileData)
          if (upsertResp.error) {
            console.warn('Supabase update failed, using local storage only:', upsertResp.error.message)
          }
        }
      } catch (supabaseError) {
        console.warn('Supabase operation failed, using local storage only:', supabaseError.message)
      }
      
      alert('Profile saved successfully!')
    } catch (err) {
      console.error('Profile save error:', err)
      alert('Error saving profile: ' + (err.message || 'Unknown error'))
    } finally { setSaving(false) }
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Sidebar */}
        <aside className={(collapsed? 'md:w-16':'md:w-64')+" w-full transition-all duration-200 border rounded-lg md:h-[75vh] h-auto md:sticky top-24 bg-white/70 dark:bg-gray-900/70 border-gray-200 dark:border-gray-800"}>
          <div className="p-4 flex items-center gap-3 border-b dark:border-gray-800">
            <img src={profile.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(email||'U')}`} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
            {!collapsed && (
              <div>
                <div className="font-semibold truncate max-w-[10rem]">{profile.name || email || 'User'}</div>
                <div className="text-xs text-gray-500">{profile.role}</div>
              </div>
            )}
            <button onClick={()=>setCollapsed(v=>!v)} className="ml-auto text-sm px-2 py-1 border rounded">{collapsed? '›' : '‹'}</button>
          </div>
          <nav className="p-2 space-y-1">
            {menu.map(m => (
              <button key={m.key} onClick={()=>setActive(m.key)} className={(active===m.key?'bg-primary text-white ':'hover:bg-gray-100 dark:hover:bg-gray-800 ') + 'w-full text-left px-3 py-2 rounded text-sm'}>
                {m.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1">
          {active==='overview' && (
            <section className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Welcome back, {profile.name || email?.split('@')[0] || 'User'}! 👋
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">Here's your academic overview and progress</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Current Semester</div>
                  <div className="text-2xl font-bold text-blue-600">{profile.current_year}</div>
                </div>
              </div>

              {/* Quick Stats Cards */}
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Recommendations</div>
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{history.length}</div>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <span className="text-xl">📚</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-6 rounded-xl border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-green-600 dark:text-green-400">Current GPA</div>
                      <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {profile.gpas?.length > 0 ? profile.gpas[profile.gpas.length - 1] : '—'}
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <span className="text-xl">📈</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-purple-600 dark:text-purple-400">Avg GPA</div>
                      <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        {profile.gpas?.length > 0 ? (profile.gpas.reduce((a,b) => Number(a) + Number(b), 0) / profile.gpas.length).toFixed(1) : '—'}
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                      <span className="text-xl">⭐</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 p-6 rounded-xl border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-orange-600 dark:text-orange-400">Interests</div>
                      <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{(profile.interests||[]).length}</div>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                      <span className="text-xl">🎯</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* GPA Trend Chart */}
                <div className="lg:col-span-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <span className="text-2xl">📊</span>
                      GPA Performance Trend
                    </h2>
                    <div className="flex items-center gap-2">
                      {profile.gpas?.length >= 2 && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          Number(profile.gpas[profile.gpas.length - 1]) > Number(profile.gpas[profile.gpas.length - 2])
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                            : Number(profile.gpas[profile.gpas.length - 1]) < Number(profile.gpas[profile.gpas.length - 2])
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                        }`}>
                          {Number(profile.gpas[profile.gpas.length - 1]) > Number(profile.gpas[profile.gpas.length - 2]) 
                            ? '↗ Improving' 
                            : Number(profile.gpas[profile.gpas.length - 1]) < Number(profile.gpas[profile.gpas.length - 2])
                            ? '↘ Declining' 
                            : '→ Stable'
                          }
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {profile.gpas?.length > 0 ? (
                    <div className="h-56 md:h-64 lg:h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={(profile.gpas||[]).map((g,i)=>({ 
                          sem: `Semester ${i+1}`, 
                          gpa: Number(g),
                          target: 8.0 // Target line
                        }))}>
                          <XAxis 
                            dataKey="sem" 
                            tick={{ fontSize: 12 }}
                            stroke="#6B7280"
                          />
                          <YAxis 
                            domain={[0, 10]} 
                            tick={{ fontSize: 12 }}
                            stroke="#6B7280"
                            tickFormatter={(value) => `${value}`}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid #E5E7EB',
                              borderRadius: '8px',
                              fontSize: '14px'
                            }}
                            formatter={(value) => [`${value}/10`, 'GPA']}
                          />
                          {/* Target line */}
                          <Line 
                            type="monotone" 
                            dataKey="target" 
                            stroke="#F59E0B" 
                            strokeDasharray="5 5"
                            strokeWidth={1}
                            dot={false}
                            connectNulls={false}
                          />
                          {/* Actual GPA line */}
                          <Line 
                            type="monotone" 
                            dataKey="gpa" 
                            stroke="url(#gpaGradient)"
                            strokeWidth={3}
                            dot={{ fill: '#6366F1', strokeWidth: 2, r: 6 }}
                            activeDot={{ r: 8, stroke: '#6366F1', strokeWidth: 2, fill: '#fff' }}
                          />
                          <defs>
                            <linearGradient id="gpaGradient" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#6366F1" />
                              <stop offset="100%" stopColor="#8B5CF6" />
                            </linearGradient>
                          </defs>
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <span className="text-4xl mb-2 block">📈</span>
                        <div className="text-lg font-medium">No GPA data yet</div>
                        <div className="text-sm">Add your semester GPAs in the Profile section</div>
                      </div>
                    </div>
                  )}
                  {/* Interests Cloud */}
                  <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                      <span className="text-xl">💡</span>
                      Interests
                    </h3>
                    {(profile.interests||[]).length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {(profile.interests||[]).map((interest, index) => (
                          <span 
                            key={interest}
                            className={`px-3 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 ${
                              ['bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
                               'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
                               'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
                               'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200',
                               'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200',
                               'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200'][index % 6]
                            }`}
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-4">
                        <span className="text-2xl mb-2 block">🌟</span>
                        <div className="text-sm">No interests selected yet</div>
                        <div className="text-xs">Add them in your Profile</div>
                      </div>
                    )}
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                      <span className="text-xl">📋</span>
                      Recent Activity
                    </h3>
                    {history.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <div>
                            <div className="text-sm font-medium">Last Recommendation</div>
                            <div className="text-gray-600 dark:text-gray-400 text-sm">{history[0]?.results?.recommendations?.[0]?.name || 'No recommendations yet'}</div>
                          </div>
                          <span className="text-lg">🎓</span>
                        </div>
                        {history.length > 1 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{history.length - 1} more recommendations in History
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-4">
                        <span className="text-2xl mb-2 block">📝</span>
                        <div className="text-sm">No activity yet</div>
                        <div className="text-xs">Get your first recommendation!</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Faculty Section */}
              {localRole==='faculty' && (
                <div className="mt-4">
                  <h2 className="font-semibold mb-2">At-Risk (sample)</h2>
                  <div className="overflow-auto border rounded">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-3 py-2 text-left">Student</th>
                          <th className="px-3 py-2 text-left">Course</th>
                          <th className="px-3 py-2">Difficulty</th>
                          <th className="px-3 py-2">Dropout Risk</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((s,i) => (
                          <tr key={i} className="border-t">
                            <td className="px-3 py-2">{s.name}</td>
                            <td className="px-3 py-2">{s.course}</td>
                            <td className="px-3 py-2 text-center">{s.difficulty}</td>
                            <td className={"px-3 py-2 text-center "+(s.dropout>0.5?'text-red-600':'text-yellow-600')}>{Math.round(s.dropout*100)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          )}

          {active==='profile' && (
            <section>
              <h1 className="text-2xl font-bold mb-4">Profile</h1>
              <form onSubmit={saveProfile} className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3 p-4 border rounded bg-white/70 dark:bg-gray-900/70">
                  <label className="block text-sm font-medium">Name</label>
                  <input value={profile.name} onChange={e=>setProfile(p=>({...p, name:e.target.value}))} className="w-full px-3 py-2 rounded border bg-white dark:bg-gray-900" />
                  <label className="block text-sm font-medium">Avatar URL</label>
                  <input value={profile.avatar_url} onChange={e=>setProfile(p=>({...p, avatar_url:e.target.value}))} className="w-full px-3 py-2 rounded border bg-white dark:bg-gray-900" />
                  <label className="block text-sm font-medium">Role</label>
                  <select value={profile.role} onChange={e=>setProfile(p=>({...p, role:e.target.value}))} className="w-full px-3 py-2 rounded border bg-white dark:bg-gray-900">
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                  </select>
                  <div className="grid sm:grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-sm font-medium">Current Semester</label>
                      <select value={profile.current_year} onChange={e=>{
                        const sem = Number(e.target.value)
                        setProfile(p=>{
                          const expected = Math.max(0, sem-1)
                          const gpas = (p.gpas||[]).slice(0, expected)
                          while (gpas.length < expected) gpas.push('')
                          return { ...p, current_year: sem, gpas }
                        })
                      }} className="w-full px-3 py-2 rounded border bg-white dark:bg-gray-900">
                        {[1,2,3,4,5,6,7,8].map(s=> <option key={s} value={s}>Semester {s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Learning Style</label>
                      <select value={profile.learning_style} onChange={e=>setProfile(p=>({...p, learning_style:e.target.value}))} className="w-full px-3 py-2 rounded border bg-white dark:bg-gray-900">
                        {['Visual','Auditory','Kinesthetic','Read/Write'].map(ls=> <option key={ls}>{ls}</option>)}
                      </select>
                    </div>
                  </div>
                  <label className="block text-sm font-medium mt-3">Career Goal</label>
                  <input value={profile.career_goal} onChange={e=>setProfile(p=>({...p, career_goal:e.target.value}))} className="w-full px-3 py-2 rounded border bg-white dark:bg-gray-900" />
                  <label className="block text-sm font-medium mt-3">GPA</label>
                  <input type="number" min="0" max="10" step="0.01" value={profile.gpa} onChange={e=>setProfile(p=>({...p, gpa:e.target.value}))} className="w-full px-3 py-2 rounded border bg-white dark:bg-gray-900" />
                  <label className="block text-sm font-medium mt-3">Interests</label>
                  <div className="flex flex-wrap gap-2">
                    {['Data','ML','AI','Web','Cloud','Security','Networks','Databases','Algorithms','CV','NLP'].map(t => (
                      <button key={t} type="button" onClick={()=>setProfile(p=>({ ...p, interests: (p.interests||[]).includes(t)? (p.interests||[]).filter(x=>x!==t):[...(p.interests||[]), t] }))} className={((profile.interests||[]).includes(t)?'bg-primary text-white':'bg-gray-100 dark:bg-gray-800')+" px-3 py-1 rounded text-sm"}>{t}</button>
                    ))}
                  </div>
                  <button disabled={saving} className="mt-2 px-4 py-2 rounded bg-primary text-white">{saving? 'Saving...' : 'Save Profile'}</button>
                </div>
                <div className="p-4 border rounded bg-white/70 dark:bg-gray-900/70 flex flex-col gap-4">
                  <img src={profile.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(email||'U')}`} alt="avatar" className="w-40 h-40 rounded-full object-cover border self-center" />
                  <div className="mt-1 font-semibold text-center">{profile.name || email || 'User'}</div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Previous Semester GPAs</label>
                    <div className="space-y-2 max-h-56 overflow-auto pr-2">
                      {(profile.gpas||[]).map((g,i)=> (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs w-10 text-gray-500">S{i+1}</span>
                          <input type="number" min="0" max="10" step="0.01" value={g} onChange={e=>setProfile(p=>{ const gpas=[...(p.gpas||[])]; gpas[i]=e.target.value; return { ...p, gpas }})} className="w-28 px-2 py-1 border rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </form>
            </section>
          )}

          {active==='history' && (
            <section>
              <h1 className="text-2xl font-bold mb-4">History</h1>
              <ul className="space-y-2 max-h-[60vh] overflow-auto">
                {history.map((h,i)=> (
                  <li key={i} className="p-3 rounded border bg-white/70 dark:bg-gray-900/70">
                    <div className="text-xs text-gray-500">{new Date(h.ts || h.created_at || Date.now()).toLocaleString()}</div>
                    <div className="text-sm">{h.results?.recommendations?.[0]?.name || '—'}</div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {active==='faculty' && localRole==='faculty' && (
            <section>
              <h1 className="text-2xl font-bold mb-4">Faculty</h1>
              <p className="text-sm text-gray-500 mb-2">Quick access to at-risk students (demo data).</p>
              <div className="overflow-auto border rounded">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-3 py-2 text-left">Student</th>
                      <th className="px-3 py-2 text-left">Course</th>
                      <th className="px-3 py-2">Difficulty</th>
                      <th className="px-3 py-2">Dropout Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s,i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2">{s.name}</td>
                        <td className="px-3 py-2">{s.course}</td>
                        <td className="px-3 py-2 text-center">{s.difficulty}</td>
                        <td className={"px-3 py-2 text-center "+(s.dropout>0.5?'text-red-600':'text-yellow-600')}>{Math.round(s.dropout*100)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}
