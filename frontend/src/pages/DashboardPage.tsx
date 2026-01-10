import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { QueryList } from "@/components/dashboard/QueryList"
import { QueryFilters } from "@/components/dashboard/QueryFilters"
import { AddQueryDialog } from "@/components/dashboard/AddQueryDialog"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { useQueryStore } from "@/stores/queryStore"
import {
  fetchQueries,
  createQuery,
  deleteQuery,
  runExtraction,
  fetchBusinessTypes,
  fetchCities,
} from "@/services/api"
import type { Query } from "@/types"

export function DashboardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { filters } = useQueryStore()
  const [runningQueryId, setRunningQueryId] = useState<string | null>(null)

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

  // Create query mutation
  const createMutation = useMutation({
    mutationFn: ({ businessType, city }: { businessType: string; city: string }) =>
      createQuery({ businessType, city }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queries"] })
      queryClient.invalidateQueries({ queryKey: ["businessTypes"] })
      queryClient.invalidateQueries({ queryKey: ["cities"] })
    },
  })

  // Delete query mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteQuery(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queries"] })
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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Queries</h1>
          <p className="text-muted-foreground mt-1">
            Manage your Google Maps search queries
          </p>
        </div>
        <AddQueryDialog onAdd={handleAddQuery} existingQueries={existingQueryStrings} />
      </div>

      <div className="glass-card rounded-2xl p-4">
        <QueryFilters businessTypes={businessTypes} cities={cities} />
      </div>

      <QueryList
        queries={queries}
        onRun={handleRunQuery}
        onDelete={handleDeleteQuery}
        runningQueryId={runningQueryId}
      />
    </div>
  )
}
