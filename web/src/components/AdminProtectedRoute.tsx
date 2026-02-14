import { Navigate } from 'react-router-dom'

interface AdminProtectedRouteProps {
  children: React.ReactNode
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const token = localStorage.getItem('token')
  const isAdmin = localStorage.getItem('isAdmin') === 'true'

  if (!token || !isAdmin) {
    return <Navigate to="/admin/login" replace />
  }

  return <>{children}</>
}
