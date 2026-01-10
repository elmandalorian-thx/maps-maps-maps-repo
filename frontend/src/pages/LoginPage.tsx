import { Navigate, useLocation } from "react-router-dom"
import { Map, Sparkles } from "lucide-react"
import { LoginButton } from "@/components/auth/LoginButton"
import { useAuthStore } from "@/stores/authStore"

export function LoginPage() {
  const { user } = useAuthStore()
  const location = useLocation()

  // Redirect if already logged in
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/"
  if (user) {
    return <Navigate to={from} replace />
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 rounded-full gradient-primary opacity-10 blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 rounded-full gradient-accent opacity-10 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/5 blur-3xl"></div>
      </div>

      {/* Login card */}
      <div className="glass-card rounded-3xl p-8 sm:p-10 max-w-md w-full mx-4 relative">
        <div className="flex flex-col items-center space-y-6">
          {/* Logo */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl gradient-primary opacity-30 absolute inset-0 blur-xl animate-pulse"></div>
            <div className="w-20 h-20 rounded-2xl gradient-primary glow-primary flex items-center justify-center relative">
              <Map className="h-10 w-10 text-white" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight gradient-text">
              Maps Query Dashboard
            </h1>
            <p className="text-muted-foreground">
              Extract and manage business data from Google Maps
            </p>
          </div>

          {/* Divider */}
          <div className="w-full flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            <Sparkles className="h-4 w-4 text-primary/50" />
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          </div>

          {/* Login button */}
          <div className="w-full">
            <LoginButton />
          </div>

          {/* Footer text */}
          <p className="text-center text-xs text-muted-foreground/60">
            Sign in with your Google account to get started
          </p>
        </div>
      </div>

      {/* Version badge */}
      <div className="absolute bottom-4 text-xs text-muted-foreground/40">
        v1.0.0
      </div>
    </div>
  )
}
