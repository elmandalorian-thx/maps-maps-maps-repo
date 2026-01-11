import { QueryCard } from "./QueryCard"
import { Button } from "@/components/ui/button"
import { Search, Sparkles, Play, Trash2, CheckSquare, Square, Loader2 } from "lucide-react"
import type { Query } from "@/types"

interface QueryListProps {
  queries: Query[]
  onRun: (query: Query) => void
  onDelete: (query: Query) => void
  runningQueryId?: string | null
  selectedIds?: Set<string>
  onSelectQuery?: (query: Query, selected: boolean) => void
  onSelectAll?: () => void
  onClearSelection?: () => void
  onBulkRun?: () => void
  onBulkDelete?: () => void
  showBulkActions?: boolean
  isBulkRunning?: boolean
}

export function QueryList({
  queries,
  onRun,
  onDelete,
  runningQueryId,
  selectedIds = new Set(),
  onSelectQuery,
  onSelectAll,
  onClearSelection,
  onBulkRun,
  onBulkDelete,
  showBulkActions = false,
  isBulkRunning = false,
}: QueryListProps) {
  const hasSelection = selectedIds.size > 0
  const allSelected = queries.length > 0 && selectedIds.size === queries.length

  if (queries.length === 0) {
    return (
      <div className="glass-card rounded-2xl py-12 px-8">
        <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <div className="relative mb-5">
            <div className="w-16 h-16 rounded-2xl gradient-primary opacity-20 absolute inset-0 blur-xl"></div>
            <div className="w-16 h-16 rounded-2xl glass-strong flex items-center justify-center relative">
              <Search className="h-7 w-7 text-primary" />
            </div>
          </div>

          <h3 className="text-lg font-semibold mb-2">No queries yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Create your first search query to start extracting business data from Google Maps.
          </p>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Click "Add Query" to get started</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="glass-card rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={allSelected ? onClearSelection : onSelectAll}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
            >
              {allSelected ? (
                <CheckSquare className="h-4 w-4 text-indigo-400" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              <span>{allSelected ? "Deselect All" : "Select All"}</span>
            </button>
            {hasSelection && (
              <span className="text-sm text-indigo-400">
                {selectedIds.size} selected
              </span>
            )}
          </div>

          {hasSelection && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={onBulkRun}
                disabled={isBulkRunning}
                className="gap-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
              >
                {isBulkRunning ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Adding to Queue...
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" />
                    Run Selected
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onBulkDelete}
                disabled={isBulkRunning}
                className="gap-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Selected
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Query Grid - Now with 4 columns for compact cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {queries.map((query) => (
          <QueryCard
            key={query.id}
            query={query}
            onRun={onRun}
            onDelete={onDelete}
            isRunning={runningQueryId === query.id}
            isSelected={selectedIds.has(query.id)}
            onSelect={showBulkActions ? onSelectQuery : undefined}
          />
        ))}
      </div>

      {/* Query count */}
      <div className="text-center text-xs text-muted-foreground">
        Showing {queries.length.toLocaleString()} {queries.length === 1 ? "query" : "queries"}
      </div>
    </div>
  )
}
