import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { BaseTermsList } from "@/components/quarry/BaseTermsList"
import { CreateBaseTermDialog } from "@/components/quarry/CreateBaseTermDialog"
import { BulkGenerateDialog } from "@/components/quarry/BulkGenerateDialog"
import { QueueStatusBar } from "@/components/quarry/QueueStatusBar"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import {
  fetchBaseTerms,
  createBaseTerm,
  deleteBaseTerm,
  generateQueries,
  fetchQueueStatus,
} from "@/services/api"
import type { BaseTerm, NewBaseTerm, BulkGenerateRequest } from "@/types"

export function QuarryPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedTerm, setSelectedTerm] = useState<BaseTerm | null>(null)
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)

  // Fetch base terms
  const {
    data: baseTerms = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["baseTerms"],
    queryFn: fetchBaseTerms,
  })

  // Fetch queue status
  const { data: queueStatus } = useQuery({
    queryKey: ["queueStatus"],
    queryFn: fetchQueueStatus,
    refetchInterval: 5000, // Refresh every 5 seconds
  })

  // Create base term mutation
  const createMutation = useMutation({
    mutationFn: (term: NewBaseTerm) => createBaseTerm(term),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["baseTerms"] })
      toast.success("Base term created successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create base term")
    },
  })

  // Delete base term mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBaseTerm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["baseTerms"] })
      toast.success("Base term deleted successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete base term")
    },
  })

  // Generate queries mutation
  const generateMutation = useMutation({
    mutationFn: ({ termId, request }: { termId: string; request: BulkGenerateRequest }) =>
      generateQueries(termId, request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["baseTerms"] })
      queryClient.invalidateQueries({ queryKey: ["queries"] })
      queryClient.invalidateQueries({ queryKey: ["queueStatus"] })
      toast.success(data.message)
      setIsGenerateDialogOpen(false)
      setSelectedTerm(null)
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to generate queries")
    },
  })

  const handleCreateTerm = async (term: string, category?: string) => {
    await createMutation.mutateAsync({ term, category })
  }

  const handleDeleteTerm = (term: BaseTerm) => {
    if (confirm(`Delete "${term.term}" and all ${term.stats.totalQueries} associated queries? This cannot be undone.`)) {
      deleteMutation.mutate(term.id)
    }
  }

  const handleOpenGenerate = (term: BaseTerm) => {
    setSelectedTerm(term)
    setIsGenerateDialogOpen(true)
  }

  const handleGenerate = async (request: BulkGenerateRequest) => {
    if (!selectedTerm) return
    await generateMutation.mutateAsync({ termId: selectedTerm.id, request })
  }

  const handleViewQueries = (term: BaseTerm) => {
    navigate(`/?baseTermId=${term.id}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading base terms...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="glass-card rounded-2xl p-8 text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">!</span>
          </div>
          <h3 className="font-semibold mb-2">Failed to load base terms</h3>
          <p className="text-sm text-muted-foreground">Please check your connection and try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quarry</h1>
          <p className="text-muted-foreground mt-1">
            Manage base search terms and generate thousands of queries
          </p>
        </div>
        <CreateBaseTermDialog onAdd={handleCreateTerm} isLoading={createMutation.isPending} />
      </div>

      {/* Queue Status */}
      {queueStatus && <QueueStatusBar status={queueStatus} />}

      {/* Base Terms List */}
      <BaseTermsList
        terms={baseTerms}
        onGenerate={handleOpenGenerate}
        onViewQueries={handleViewQueries}
        onDelete={handleDeleteTerm}
      />

      {/* Bulk Generate Dialog */}
      <BulkGenerateDialog
        isOpen={isGenerateDialogOpen}
        onClose={() => {
          setIsGenerateDialogOpen(false)
          setSelectedTerm(null)
        }}
        onGenerate={handleGenerate}
        term={selectedTerm}
        isLoading={generateMutation.isPending}
      />
    </div>
  )
}
