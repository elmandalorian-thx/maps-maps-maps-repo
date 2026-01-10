import { format } from "date-fns"
import { Check, Database, History } from "lucide-react"
import { cn } from "@/lib/utils"
import type { QueryVersion } from "@/types"

interface VersionHistoryProps {
  versions: QueryVersion[]
  selectedVersionId?: string | null
  onSelectVersion: (version: QueryVersion) => void
}

export function VersionHistory({
  versions,
  selectedVersionId,
  onSelectVersion,
}: VersionHistoryProps) {
  if (versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="relative mb-3">
          <div className="w-12 h-12 rounded-xl gradient-primary opacity-20 absolute inset-0 blur-lg"></div>
          <div className="w-12 h-12 rounded-xl glass-strong flex items-center justify-center relative">
            <History className="h-5 w-5 text-primary" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          No versions yet
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Run an extraction to create the first version
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">
        <History className="h-3.5 w-3.5" />
        <span>Version History</span>
      </div>
      <div className="space-y-2">
        {versions.map((version) => (
          <button
            key={version.id}
            className={cn(
              "w-full text-left rounded-xl p-3 transition-all duration-200",
              "border border-transparent hover:border-white/10",
              selectedVersionId === version.id
                ? "bg-primary/10 border-primary/20 glow-primary"
                : "bg-white/[0.02] hover:bg-white/[0.05]"
            )}
            onClick={() => onSelectVersion(version)}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col items-start gap-0.5">
                <span className={cn(
                  "text-sm font-semibold",
                  selectedVersionId === version.id && "text-primary"
                )}>
                  Version {version.versionNumber}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(version.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-md bg-white/5 text-muted-foreground">
                  {version.businessCount} results
                </span>
                {version.savedToFirebase && (
                  <div className="p-1 rounded-md bg-success/10" title="Saved to Firebase">
                    <Database className="h-3.5 w-3.5 text-success" />
                  </div>
                )}
                {selectedVersionId === version.id && (
                  <div className="p-1 rounded-md bg-primary/20">
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
