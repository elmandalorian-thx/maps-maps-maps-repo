import { Play, Download, Database, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"

interface ActionBarProps {
  onRunExtraction: () => void
  onSaveVersion: () => void
  onExportCSV: () => void
  onSaveToFirebase: () => void
  isExtracting: boolean
  isSaving: boolean
  hasData: boolean
  hasUnsavedData: boolean
}

export function ActionBar({
  onRunExtraction,
  onSaveVersion,
  onExportCSV,
  onSaveToFirebase,
  isExtracting,
  isSaving,
  hasData,
  hasUnsavedData,
}: ActionBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        onClick={onRunExtraction}
        disabled={isExtracting}
        className="gap-2 gradient-primary glow-primary hover:scale-105 transition-transform rounded-xl px-5"
      >
        {isExtracting ? (
          <LoadingSpinner size="sm" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        {isExtracting ? "Extracting..." : "Run Extraction"}
      </Button>

      {hasUnsavedData && (
        <Button
          variant="outline"
          onClick={onSaveVersion}
          disabled={isSaving || !hasData}
          className="gap-2 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
        >
          {isSaving ? (
            <LoadingSpinner size="sm" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Save as Version
        </Button>
      )}

      <Button
        variant="outline"
        onClick={onExportCSV}
        disabled={!hasData}
        className="gap-2 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
      >
        <Download className="h-4 w-4" />
        Export CSV
      </Button>

      <Button
        variant="outline"
        onClick={onSaveToFirebase}
        disabled={!hasData || isSaving}
        className="gap-2 rounded-xl gradient-success glow-success hover:scale-105 transition-transform text-white border-0"
      >
        {isSaving ? (
          <LoadingSpinner size="sm" />
        ) : (
          <Database className="h-4 w-4" />
        )}
        Save to Firebase
      </Button>
    </div>
  )
}
