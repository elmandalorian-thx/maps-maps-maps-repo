import { LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/authStore"

export function UserMenu() {
  const { user, signOut } = useAuthStore()

  if (!user) return null

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || "User"}
            className="h-8 w-8 rounded-full ring-2 ring-white/20"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 ring-2 ring-white/20">
            <User className="h-4 w-4 text-primary" />
          </div>
        )}
        <span className="text-sm font-medium hidden sm:inline text-foreground/90">
          {user.displayName || user.email}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={signOut}
        title="Sign out"
        className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 hover:bg-destructive/20 hover:border-destructive/30 hover:text-destructive transition-all"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  )
}
