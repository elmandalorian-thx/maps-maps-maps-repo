import { Link, NavLink } from "react-router-dom"
import { Map, Search, Pickaxe } from "lucide-react"
import { UserMenu } from "@/components/auth/UserMenu"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-white/5">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2 rounded-xl gradient-primary glow-primary">
              <Map className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight gradient-text">
              Maps Query Dashboard
            </span>
          </Link>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`
              }
            >
              <Search className="h-4 w-4" />
              Queries
            </NavLink>
            <NavLink
              to="/quarry"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`
              }
            >
              <Pickaxe className="h-4 w-4" />
              Quarry
            </NavLink>
          </nav>
        </div>
        <UserMenu />
      </div>
    </header>
  )
}
