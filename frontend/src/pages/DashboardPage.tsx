import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { QueryList } from "@/components/dashboard/QueryList"
import { QueryFilters } from "@/components/dashboard/QueryFilters"
import { AddQueryDialog } from "@/components/dashboard/AddQueryDialog"
import { QueueStatusBar } from "@/components/quarry/QueueStatusBar"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { Button } from "@/components/ui/button"
import { useQueryStore } from "@/stores/queryStore"
import { ListChecks } from "lucide-react"
import {
  fetchQueries,
  createQuery,
  deleteQuery,
  runExtraction,
  fetchBusinessTypes,
  fetchCities,
  fetchQueueStatus,
  addToQueue,
} from "@/services/api"
import type { Query } from "@/types"

export function DashboardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const { filters, setFilters } = useQueryStore()
  const [runningQueryId, setRunningQueryId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)

  // Check for baseTermId in URL params and set filter
  const baseTermIdParam = searchParams.get("baseTermId")
  if (baseTermIdParam && filters.baseTermId !== baseTermIdParam) {
    setFilters({ baseTermId: baseTermIdParam })
  }

  // Fetch queries
  const {
    data: queries = [],
    isLoading: isLoadingQueries,
    error: queriesError,
  } = useQuery({
    queryKey: ["queries", filters],
    queryFn: () => fetchQueries(filters),
  })

  // Fetch metadata for filters
  const { data: businessTypes = [] } = useQuery({
    queryKey: ["businessTypes"],
    queryFn: fetchBusinessTypes,
  })

  const { data: cities = [] } = useQuery({
    queryKey: ["cities"],
    queryFn: fetchCities,
  })

  // Fetch queue status - only poll when there's active work
  const { data: queueStatus } = useQuery({
    queryKey: ["queueStatus"],
    queryFn: fetchQueueStatus,
    refetchInterval: 5000, // Refresh every 5 seconds
  })

  // Check if queue has active work to show status bar
  const hasQueueActivity = queueStatus && (
    queueStatus.pending > 0 ||
    queueStatus.queued > 0 ||
    queueStatus.running > 0 ||
    queueStatus.error > 0
  )

  // Apply client-side search filter
  const filteredQueries = useMemo(() => {
    if (!filters.search) return queries
    const searchLower = filters.search.toLowerCase()
    return queries.filter(q =>
      q.fullQuery.toLowerCase().includes(searchLower) ||
      q.businessType.toLowerCase().includes(searchLower) ||
      q.city.toLowerCase().includes(searchLower) ||
      (q.province && q.province.toLowerCase().includes(searchLower))
    )
  }, [queries, filters.search])

  // Create query mutation
  const createMutation = useMutation({
    mutationFn: ({ businessType, city }: { businessType: string; city: string }) =>
      createQuery({ businessType, city }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queries"] })
      queryClient.invalidateQueries({ queryKey: ["businessTypes"] })
      queryClient.invalidateQueries({ queryKey: ["cities"] })
      toast.success("Query created successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create query")
    },
  })

  // Delete query mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteQuery(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queries"] })
      toast.success("Query deleted successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete query")
    },
  })

  // Run extraction mutation
  const extractMutation = useMutation({
    mutationFn: (queryId: string) => runExtraction(queryId),
    onSuccess: (_, queryId) => {
      queryClient.invalidateQueries({ queryKey: ["queries"] })
      navigate(`/query/${queryId}`)
    },
    onSettled: () => {
      setRunningQueryId(null)
    },
  })

  // Add to queue mutation for bulk run
  const addToQueueMutation = useMutation({
    mutationFn: (queryIds: string[]) => addToQueue(queryIds),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["queueStatus"] })
      queryClient.invalidateQueries({ queryKey: ["queries"] })
      toast.success(data.message)
      setSelectedIds(new Set())
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add queries to queue")
    },
  })

  const handleAddQuery = async (businessType: string, city: string) => {
    await createMutation.mutateAsync({ businessType, city })
  }

  const handleRunQuery = (query: Query) => {
    setRunningQueryId(query.id)
    extractMutation.mutate(query.id)
  }

  const handleDeleteQuery = (query: Query) => {
    if (confirm(`Delete "${query.fullQuery}"? This cannot be undone.`)) {
      deleteMutation.mutate(query.id)
    }
  }

  // Bulk selection handlers
  const handleSelectQuery = (query: Query, selected: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (selected) {
        next.add(query.id)
      } else {
        next.delete(query.id)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    setSelectedIds(new Set(filteredQueries.map(q => q.id)))
  }

  const handleClearSelection = () => {
    setSelectedIds(new Set())
  }

  const handleBulkRun = () => {
    const queryIds = Array.from(selectedIds)
    if (queryIds.length === 0) {
      toast.error("No queries selected")
      return
    }
    addToQueueMutation.mutate(queryIds)
  }

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedIds.size} selected queries? This cannot be undone.`)) {
      selectedIds.forEach(id => {
        deleteMutation.mutate(id)
      })
      setSelectedIds(new Set())
    }
  }

  if (isLoadingQueries) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading queries...</p>
        </div>
      </div>
    )
  }

  if (queriesError) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="glass-card rounded-2xl p-8 text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">!</span>
          </div>
          <h3 className="font-semibold mb-2">Failed to load queries</h3>
          <p className="text-sm text-muted-foreground">Please check your connection and try again.</p>
        </div>
      </div>
    )
  }

  const existingQueryStrings = queries.map((q) => q.fullQuery)

  return (
    <div className="space-y-6">
      {/* Queue Status Bar - shown when there's activity */}
      {hasQueueActivity && queueStatus && (
        <QueueStatusBar status={queueStatus} />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Local Queries</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {filteredQueries.length.toLocaleString()} queries
            {baseTermIdParam && " for this base term"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showBulkActions ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setShowBulkActions(!showBulkActions)}
            className="gap-1.5"
          >
            <ListChecks className="h-4 w-4" />
            {showBulkActions ? "Exit Selection" : "Bulk Select"}
          </Button>
          <AddQueryDialog onAdd={handleAddQuery} existingQueries={existingQueryStrings} />
        </div>
      </div>

      <div className="glass-card rounded-xl p-4">
        <QueryFilters businessTypes={businessTypes} cities={cities} />
      </div>

      <QueryList
        queries={filteredQueries}
        onRun={handleRunQuery}
        onDelete={handleDeleteQuery}
        runningQueryId={runningQueryId}
        selectedIds={selectedIds}
        onSelectQuery={handleSelectQuery}
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
        onBulkRun={handleBulkRun}
        onBulkDelete={handleBulkDelete}
        showBulkActions={showBulkActions}
        isBulkRunning={addToQueueMutation.isPending}
      />
    </div>
  )
}
