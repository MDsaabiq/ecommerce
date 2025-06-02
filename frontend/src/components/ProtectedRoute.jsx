import { Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, token } = useSelector((state) => state.auth)
  
  // If no token, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />
  }

  // If admin route but user is not admin, redirect to home
  if (allowedRoles?.includes('admin') && !user?.isAdmin) {
    return <Navigate to="/" replace />
  }

  // If authenticated and authorized, render the child routes
  return <Outlet />
}

export default ProtectedRoute 