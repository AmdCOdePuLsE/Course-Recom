import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

export default function ProtectedRoute({ children, role }){
  const { session, loading } = useAuth()
  if (loading) return null
  if (!session) return <Navigate to="/login" replace />
  if (role) {
    const local = JSON.parse(localStorage.getItem('user') || 'null')
    if (!local || local.role !== role) return <Navigate to="/" replace />
  }
  return children
}
