import { useEffect, useState } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Landing from './pages/Landing'
import Syllabus from './pages/Syllabus'
import Recommendations from './pages/Recommendations'
import Features from './pages/Features'
import Analytics from './pages/Analytics'
import Contact from './pages/Contact'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import ProtectedRoute from './components/ProtectedRoute'
import useAuth from './hooks/useAuth'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  useEffect(() => {
    const root = document.documentElement
    if (dark) { root.classList.add('dark'); localStorage.setItem('theme','dark') }
    else { root.classList.remove('dark'); localStorage.setItem('theme','light') }
  }, [dark])

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="min-h-screen flex flex-col">
        <Navbar dark={dark} setDark={setDark} />
        <ScrollToTop />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<HomeGate />} />
            <Route path="/features" element={<Features />} />
            <Route path="/syllabus" element={<Syllabus />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </div>
  )
}

function HomeGate(){
  const { session, loading } = useAuth()
  if (loading) return null
  return session ? <Navigate to="/dashboard" replace /> : <Landing />
}
