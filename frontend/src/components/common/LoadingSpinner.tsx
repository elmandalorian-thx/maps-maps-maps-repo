import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }

  return (
    <Loader2 className={cn("animate-spin text-primary", sizeClasses[size], className)} />
  )
}

export function LoadingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl gradient-primary opacity-20 absolute inset-0 blur-xl animate-pulse"></div>
        <div className="w-16 h-16 rounded-2xl glass-strong flex items-center justify-center relative">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    </div>
  )
}
