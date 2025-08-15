import { useEffect, useState } from 'react'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import useAuth from '../hooks/useAuth'
import RequireAuth from '../components/RequireAuth'

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

export default function Analytics(){
  const [stats, setStats] = useState({ popularity:[], passFail:[], dropout:[] })
  const { session } = useAuth()

  useEffect(() => {
    const run = async () => {
      if (!session) return
      const token = session.access_token
      axios.get(`${API}/api/analytics`, { headers: { Authorization: `Bearer ${token}` } }).then(({data})=>setStats(data)).catch(console.error)
    }
    run()
  }, [session])

  return (
    <RequireAuth>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-4">Analytics</h1>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Course Popularity</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.popularity}>
                <XAxis dataKey="code" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#6366F1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Pass / Fail Rates</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.passFail}>
                <XAxis dataKey="code" hide />
                <YAxis />
                <Tooltip />
                <Line dataKey="pass" stroke="#22C55E" />
                <Line dataKey="fail" stroke="#EF4444" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Dropout Rates</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.dropout}>
                <XAxis dataKey="code" hide />
                <YAxis />
                <Tooltip />
                <Line dataKey="dropout" stroke="#F59E0B" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
    </RequireAuth>
  )
}
