import { Navigate, useLocation } from 'react-router-dom'
import { getToken } from '../utils/auth'

export default function RequireAuth({ children }: { children: JSX.Element }) {
  const location = useLocation()
  const token = getToken()

  if (!token) {
    const current = location.pathname + location.search
    return <Navigate to={`/login?redirect=${encodeURIComponent(current)}`} replace />
  }

  return children
}
