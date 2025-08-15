import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import useAuth from '../hooks/useAuth'

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

export default function Login(){
  const [isSignup, setIsSignup] = useState(false)
  const [role, setRole] = useState('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { user } = useAuth()
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
      // store simple user info with role locally (demo roles)
      const session = (await supabase.auth.getSession()).data.session
      const profile = { id: session?.user?.id, email, role }
      localStorage.setItem('user', JSON.stringify(profile))
      navigate('/dashboard')
    } catch (err) {
      alert(err.message || 'Authentication failed')
    }
  }

  return (
    <div className="min-h-[70vh] grid place-items-center px-4">
      <form onSubmit={submit} className="relative z-10 w-full max-w-md p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70">
        <h1 className="text-2xl font-bold mb-4">{isSignup? 'Create Account' : 'Login'}</h1>
        {isSignup && (
          <>
            <label className="block text-sm font-medium">Role</label>
            <select value={role} onChange={e=>setRole(e.target.value)} className="w-full px-3 py-2 rounded border mb-3">
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
            </select>
          </>
        )}
        <label className="block text-sm font-medium">Email</label>
  <input autoFocus value={email} onChange={e=>setEmail(e.target.value)} type="email" required className="w-full px-3 py-2 rounded border mb-3" />
        <label className="block text-sm font-medium">Password</label>
        <input value={password} onChange={e=>setPassword(e.target.value)} type="password" required className="w-full px-3 py-2 rounded border mb-4" />
        <button className="w-full px-5 py-3 rounded bg-primary text-white mb-3">{isSignup? 'Sign Up' : 'Login'}</button>
        <button type="button" onClick={()=>setIsSignup(!isSignup)} className="text-sm text-primary hover:underline">
          {isSignup? 'Already have an account? Login' : "Don't have an account? Sign up"}
        </button>
      </form>
    </div>
  )
}
