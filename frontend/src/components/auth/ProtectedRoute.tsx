import { Navigate, useLocation } from "react-router-dom"
import { useAuthStore } from "@/stores/authStore"
import { LoadingPage } from "@/components/common/LoadingSpinner"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, initialized } = useAuthStore()
  const location = useLocation()

  if (!initialized || loading) {
    return <LoadingPage />
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
