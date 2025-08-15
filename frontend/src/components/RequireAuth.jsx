import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

export default function RequireAuth({ children }){
  const { session, loading } = useAuth()
  if (loading) return <div className="p-6 text-center text-sm text-gray-500">Checking session…</div>
  if (!session) return <Navigate to="/login" replace />
  return children
}
