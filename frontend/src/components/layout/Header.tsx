import { Link } from "react-router-dom"
import { Map } from "lucide-react"
import { UserMenu } from "@/components/auth/UserMenu"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-white/5">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="p-2 rounded-xl gradient-primary glow-primary">
            <Map className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight gradient-text">
            Maps Query Dashboard
          </span>
        </Link>
        <UserMenu />
      </div>
    </header>
  )
}
