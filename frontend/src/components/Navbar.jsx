import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import useAuth from '../hooks/useAuth'

export default function Navbar({ dark, setDark }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { session } = useAuth()
  const isAuthed = !!session
  const { pathname } = useLocation()

  useEffect(() => { setOpen(false) }, [pathname])

  const logout = async () => {
    await supabase.auth.signOut()
  localStorage.removeItem('user')
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-white/70 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-800">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <Link to={isAuthed? '/dashboard':'/'} className="text-lg font-bold tracking-tight">SKILL-<span className="text-primary">SYNC</span></Link>
        <button className="sm:hidden" onClick={() => setOpen(!open)}>
          <span className="i">☰</span>
        </button>
        <ul className={(open? '':'hidden ') + 'sm:flex gap-4 items-center font-medium'}>
          <li>
            <NavLink to={isAuthed? '/dashboard':'/'} className={({isActive}) => (isActive? 'text-primary':'hover:text-primary')}>Home</NavLink>
          </li>
          {[
            ['/features','Features'],
            ['/syllabus','Syllabus'],
            ['/recommendations','Recommendations'],
            ['/analytics','Analytics'],
            ['/contact','Contact']
          ].map(([to,label]) => (
            <li key={to}>
              <NavLink to={to} className={({isActive}) => (isActive? 'text-primary':'hover:text-primary')}>{label}</NavLink>
            </li>
          ))}
          <li>
            <button onClick={() => setDark(!dark)} className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">
              {dark? 'Light' : 'Dark'}
            </button>
          </li>
          {isAuthed ? (
            <>
              <li><NavLink to="/dashboard" className={({isActive}) => isActive? 'text-primary':''}>Dashboard</NavLink></li>
              <li><button onClick={logout} className="text-red-500">Logout</button></li>
            </>
          ) : (
            <li><Link to="/login" className="px-3 py-1 rounded bg-primary text-white hover:bg-primary-dark">Login</Link></li>
          )}
        </ul>
      </nav>
    </header>
  )
}
