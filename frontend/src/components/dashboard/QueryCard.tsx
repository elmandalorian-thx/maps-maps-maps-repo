import { useNavigate } from "react-router-dom"
import { Play, Trash2, Clock, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "./StatusBadge"
import type { Query } from "@/types"
import { format } from "date-fns"

interface QueryCardProps {
  query: Query
  onRun: (query: Query) => void
  onDelete: (query: Query) => void
  isRunning?: boolean
}

export function QueryCard({ query, onRun, onDelete, isRunning }: QueryCardProps) {
  const navigate = useNavigate()

  const handleCardClick = () => {
    navigate(`/query/${query.id}`)
  }

  const handleRunClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRun(query)
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(query)
  }

  return (
    <div
      className="glass-card rounded-2xl p-5 cursor-pointer hover-lift hover-glow group"
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <StatusBadge status={query.status} />
            {query.versionsCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Layers className="h-3.5 w-3.5" />
                <span>{query.versionsCount} version{query.versionsCount !== 1 ? "s" : ""}</span>
              </div>
            )}
          </div>

          <h3 className="font-semibold text-base mb-2 group-hover:text-primary transition-colors">
            {query.fullQuery}
          </h3>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-lg bg-white/5 text-muted-foreground">
              {query.businessType}
            </span>
            <span className="text-xs px-2 py-1 rounded-lg bg-white/5 text-muted-foreground">
              {query.city}
            </span>
          </div>

          {query.lastRunDate && (
            <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Last run: {format(new Date(query.lastRunDate), "MMM d, yyyy 'at' h:mm a")}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button
            size="icon"
            className="h-10 w-10 rounded-xl gradient-primary glow-primary hover:scale-105 transition-transform"
            onClick={handleRunClick}
            disabled={isRunning}
            title="Run extraction"
          >
            <Play className={`h-4 w-4 text-white ${isRunning ? "animate-pulse" : ""}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
            onClick={handleDeleteClick}
            title="Delete query"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
