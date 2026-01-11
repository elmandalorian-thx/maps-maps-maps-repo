import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { BaseTerm } from "@/types"

interface BaseTermsListProps {
  terms: BaseTerm[]
  onGenerate: (term: BaseTerm) => void
  onViewQueries: (term: BaseTerm) => void
  onDelete: (term: BaseTerm) => void
}

export function BaseTermsList({
  terms,
  onGenerate,
  onViewQueries,
  onDelete,
}: BaseTermsListProps) {
  if (terms.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center mx-auto mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-indigo-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <h3 className="font-semibold text-lg mb-2">No Base Terms Yet</h3>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          Create your first base term to start generating thousands of location-specific queries.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {terms.map((term) => (
        <BaseTermCard
          key={term.id}
          term={term}
          onGenerate={() => onGenerate(term)}
          onViewQueries={() => onViewQueries(term)}
          onDelete={() => onDelete(term)}
        />
      ))}
    </div>
  )
}

interface BaseTermCardProps {
  term: BaseTerm
  onGenerate: () => void
  onViewQueries: () => void
  onDelete: () => void
}

function BaseTermCard({ term, onGenerate, onViewQueries, onDelete }: BaseTermCardProps) {
  const { stats } = term
  const hasQueries = stats.totalQueries > 0

  return (
    <div className="glass-card rounded-xl p-5 hover:bg-white/[0.08] transition-all duration-200 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate" title={term.term}>
            {term.term}
          </h3>
          {term.category && (
            <Badge variant="secondary" className="mt-1 text-xs">
              {term.category}
            </Badge>
          )}
        </div>
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
          title="Delete base term"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatBox
          label="Total"
          value={stats.totalQueries}
          color="text-slate-300"
        />
        <StatBox
          label="Pending"
          value={stats.pendingQueries}
          color="text-amber-400"
        />
        <StatBox
          label="Complete"
          value={stats.completeQueries}
          color="text-emerald-400"
        />
        <StatBox
          label="Error"
          value={stats.errorQueries}
          color="text-red-400"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={onGenerate}
          className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500"
          size="sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          Generate
        </Button>
        {hasQueries && (
          <Button
            onClick={onViewQueries}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            View Queries
          </Button>
        )}
      </div>
    </div>
  )
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div className="bg-white/5 rounded-lg p-2 text-center">
      <div className={`text-lg font-bold ${color}`}>{value.toLocaleString()}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
