import { QueryCard } from "./QueryCard"
import { Search, Sparkles } from "lucide-react"
import type { Query } from "@/types"

interface QueryListProps {
  queries: Query[]
  onRun: (query: Query) => void
  onDelete: (query: Query) => void
  runningQueryId?: string | null
}

export function QueryList({ queries, onRun, onDelete, runningQueryId }: QueryListProps) {
  if (queries.length === 0) {
    return (
      <div className="glass-card rounded-2xl py-16 px-8">
        <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-2xl gradient-primary opacity-20 absolute inset-0 blur-xl"></div>
            <div className="w-20 h-20 rounded-2xl glass-strong flex items-center justify-center relative">
              <Search className="h-8 w-8 text-primary" />
            </div>
          </div>

          <h3 className="text-xl font-semibold mb-2">No queries yet</h3>
          <p className="text-muted-foreground mb-6">
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {queries.map((query) => (
        <QueryCard
          key={query.id}
          query={query}
          onRun={onRun}
          onDelete={onDelete}
          isRunning={runningQueryId === query.id}
        />
      ))}
    </div>
  )
}
