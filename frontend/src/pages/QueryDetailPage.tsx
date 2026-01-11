import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ArrowLeft, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { DataPreviewTable } from "@/components/query-detail/DataPreviewTable"
import { VersionHistory } from "@/components/query-detail/VersionHistory"
import { ActionBar } from "@/components/query-detail/ActionBar"
import { LoadingSpinner, LoadingPage } from "@/components/common/LoadingSpinner"
import {
  fetchQuery,
  fetchVersions,
  runExtraction,
  createVersion,
  fetchVersionBusinesses,
  saveVersionToFirebase,
  downloadCSV,
} from "@/services/api"
import type { Business, QueryVersion } from "@/types"

export function QueryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [previewData, setPreviewData] = useState<Business[]>([])
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
  const [hasUnsavedData, setHasUnsavedData] = useState(false)

  // Fetch query details
  const {
    data: query,
    isLoading: isLoadingQuery,
    error: queryError,
  } = useQuery({
    queryKey: ["query", id],
    queryFn: () => fetchQuery(id!),
    enabled: !!id,
  })

  // Fetch versions
  const { data: versions = [] } = useQuery({
    queryKey: ["versions", id],
    queryFn: () => fetchVersions(id!),
    enabled: !!id,
  })

  // Run extraction mutation
  const extractMutation = useMutation({
    mutationFn: () => runExtraction(id!),
    onSuccess: (data) => {
      setPreviewData(data.businesses)
      setHasUnsavedData(true)
      setSelectedVersionId(null)
      queryClient.invalidateQueries({ queryKey: ["query", id] })
      toast.success(`Extracted ${data.businesses.length} businesses`)
    },
    onError: (error) => {
      toast.error(`Extraction failed: ${error.message}`)
    },
  })

  // Save version mutation
  const saveVersionMutation = useMutation({
    mutationFn: () => createVersion(id!, previewData),
    onSuccess: (newVersion) => {
      setHasUnsavedData(false)
      setSelectedVersionId(newVersion.id)
      queryClient.invalidateQueries({ queryKey: ["versions", id] })
      queryClient.invalidateQueries({ queryKey: ["query", id] })
      toast.success(`Saved as Version ${newVersion.versionNumber}`)
    },
    onError: (error) => {
      toast.error(`Failed to save version: ${error.message}`)
    },
  })

  // Save to Firebase mutation
  const saveToFirebaseMutation = useMutation({
    mutationFn: () => {
      if (!selectedVersionId) {
        throw new Error("Please save as version first, then select it")
      }
      return saveVersionToFirebase(id!, selectedVersionId)
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["versions", id] })
      toast.success(`Saved ${result.saved} businesses to Firebase`)
    },
    onError: (error) => {
      toast.error(`Failed to save to Firebase: ${error.message}`)
    },
  })

  const handleSelectVersion = async (version: QueryVersion) => {
    setSelectedVersionId(version.id)
    setHasUnsavedData(false)
    try {
      const businesses = await fetchVersionBusinesses(id!, version.id)
      setPreviewData(businesses)
    } catch (error) {
      console.error("Failed to load version data:", error)
    }
  }

  const handleExportCSV = async () => {
    if (previewData.length === 0) return

    try {
      const blob = await downloadCSV(previewData)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${query?.fullQuery.replace(/\s+/g, "_")}_export.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success(`Exported ${previewData.length} businesses to CSV`)
    } catch (error) {
      console.error("Failed to export CSV:", error)
      toast.error("Failed to export CSV")
    }
  }

  if (isLoadingQuery) {
    return <LoadingPage />
  }

  if (queryError || !query) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="glass-card rounded-2xl p-8 text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">!</span>
          </div>
          <h3 className="font-semibold mb-2">Failed to load query details</h3>
          <p className="text-sm text-muted-foreground mb-4">The query may have been deleted or doesn't exist.</p>
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="rounded-xl"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-3"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold tracking-tight">{query.fullQuery}</h1>
            <StatusBadge status={query.status} />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm px-2.5 py-1 rounded-lg bg-white/5 text-muted-foreground">
              {query.businessType}
            </span>
            <span className="text-sm px-2.5 py-1 rounded-lg bg-white/5 text-muted-foreground">
              {query.city}
            </span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="glass-card rounded-2xl p-4">
        <ActionBar
          onRunExtraction={() => extractMutation.mutate()}
          onSaveVersion={() => saveVersionMutation.mutate()}
          onExportCSV={handleExportCSV}
          onSaveToFirebase={() => saveToFirebaseMutation.mutate()}
          isExtracting={extractMutation.isPending}
          isSaving={saveVersionMutation.isPending || saveToFirebaseMutation.isPending}
          hasData={previewData.length > 0}
          hasUnsavedData={hasUnsavedData}
          hasSelectedVersion={!!selectedVersionId}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Data Preview */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/5">
                <Database className="h-4 w-4 text-primary" />
              </div>
              <h2 className="font-semibold">Data Preview</h2>
            </div>
            {previewData.length > 0 && (
              <span className="text-sm text-muted-foreground px-3 py-1 rounded-lg bg-white/5">
                {previewData.length} businesses
              </span>
            )}
          </div>
          <div className="p-6">
            {extractMutation.isPending ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 rounded-2xl gradient-primary opacity-20 absolute inset-0 blur-xl animate-pulse"></div>
                    <div className="w-16 h-16 rounded-2xl glass-strong flex items-center justify-center relative">
                      <LoadingSpinner size="lg" />
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    Extracting data from Google Maps...
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    This may take a moment
                  </p>
                </div>
              </div>
            ) : (
              <DataPreviewTable businesses={previewData} />
            )}
          </div>
        </div>

        {/* Version History Sidebar */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="font-semibold">Versions</h2>
          </div>
          <div className="p-4">
            <VersionHistory
              versions={versions}
              selectedVersionId={selectedVersionId}
              onSelectVersion={handleSelectVersion}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
