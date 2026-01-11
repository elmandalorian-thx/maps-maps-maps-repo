import { useNavigate } from "react-router-dom"
import { Play, Trash2, Layers, MapPin, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Query, QueryStatus } from "@/types"

interface QueryCardProps {
  query: Query
  onRun: (query: Query) => void
  onDelete: (query: Query) => void
  isRunning?: boolean
  isSelected?: boolean
  onSelect?: (query: Query, selected: boolean) => void
}

const statusConfig: Record<QueryStatus, { color: string; bgColor: string; label: string; animate?: boolean }> = {
  pending: { color: "bg-amber-500", bgColor: "bg-amber-500/10", label: "Pending" },
  queued: { color: "bg-blue-400", bgColor: "bg-blue-400/10", label: "Queued" },
  running: { color: "bg-blue-500", bgColor: "bg-blue-500/10", label: "Running", animate: true },
  complete: { color: "bg-emerald-500", bgColor: "bg-emerald-500/10", label: "Complete" },
  completed: { color: "bg-emerald-500", bgColor: "bg-emerald-500/10", label: "Completed" },
  error: { color: "bg-red-500", bgColor: "bg-red-500/10", label: "Error" },
  paused: { color: "bg-slate-400", bgColor: "bg-slate-400/10", label: "Paused" },
}

export function QueryCard({ query, onRun, onDelete, isRunning, isSelected, onSelect }: QueryCardProps) {
  const navigate = useNavigate()
  const config = statusConfig[query.status] || statusConfig.pending

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

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect?.(query, !isSelected)
  }

  // Build location string
  const location = [query.city, query.province, query.country].filter(Boolean).join(", ")

  return (
    <div
      className={`glass-card rounded-xl p-3 cursor-pointer transition-all duration-200 group hover:bg-white/[0.08] ${
        isSelected ? "ring-2 ring-indigo-500/50 bg-indigo-500/5" : ""
      }`}
      onClick={handleCardClick}
    >
      {/* Top row: Status dot + Query + Actions */}
      <div className="flex items-center gap-2">
        {/* Selection checkbox (only show if onSelect is provided) */}
        {onSelect && (
          <div
            className="flex-shrink-0"
            onClick={handleCheckboxClick}
          >
            <div
              className={`w-4 h-4 rounded border-2 transition-all flex items-center justify-center ${
                isSelected
                  ? "bg-indigo-600 border-indigo-600"
                  : "border-white/20 hover:border-white/40"
              }`}
            >
              {isSelected && (
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                </svg>
              )}
            </div>
          </div>
        )}

        {/* Status indicator */}
        <div
          className={`w-2 h-2 rounded-full flex-shrink-0 ${config.color} ${config.animate ? "animate-pulse" : ""}`}
          title={config.label}
        />

        {/* Query text */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate group-hover:text-indigo-400 transition-colors" title={query.fullQuery}>
            {query.fullQuery}
          </h3>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 rounded-lg hover:bg-indigo-500/20 text-indigo-400"
            onClick={handleRunClick}
            disabled={isRunning}
            title="Run extraction"
          >
            <Play className={`h-3.5 w-3.5 ${isRunning ? "animate-pulse" : ""}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-400"
            onClick={handleDeleteClick}
            title="Delete query"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Bottom row: Location + Stats */}
      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 truncate">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{location || query.city}</span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {query.versionsCount > 0 && (
            <div className="flex items-center gap-1">
              <Layers className="h-3 w-3" />
              <span>{query.versionsCount}</span>
            </div>
          )}
          {query.resultCount !== undefined && query.resultCount > 0 && (
            <span className="text-emerald-400">{query.resultCount} results</span>
          )}
          {query.error && (
            <div className="flex items-center gap-1 text-red-400" title={query.error}>
              <AlertCircle className="h-3 w-3" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
