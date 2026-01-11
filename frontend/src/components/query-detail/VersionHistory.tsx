import { useState } from "react"
import { format } from "date-fns"
import { Check, Database, History, Star, Upload, MoreHorizontal, Loader2 } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { setVersionAsLatest, publishToDirectory } from "@/services/api"
import type { QueryVersion } from "@/types"

interface VersionHistoryProps {
  queryId: string
  versions: QueryVersion[]
  selectedVersionId?: string | null
  onSelectVersion: (version: QueryVersion) => void
}

type ConfirmAction = "setLatest" | "publish" | null

export function VersionHistory({
  queryId,
  versions,
  selectedVersionId,
  onSelectVersion,
}: VersionHistoryProps) {
  const queryClient = useQueryClient()
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [targetVersion, setTargetVersion] = useState<QueryVersion | null>(null)
  const [showActionsFor, setShowActionsFor] = useState<string | null>(null)

  // Mutation for setting version as latest
  const setLatestMutation = useMutation({
    mutationFn: (versionId: string) => setVersionAsLatest(queryId, versionId),
    onSuccess: () => {
      toast.success("Version set as latest")
      queryClient.invalidateQueries({ queryKey: ["versions", queryId] })
      queryClient.invalidateQueries({ queryKey: ["query", queryId] })
      setConfirmAction(null)
      setTargetVersion(null)
    },
    onError: (error: Error) => {
      toast.error(`Failed to set as latest: ${error.message}`)
    },
  })

  // Mutation for publishing to directory
  const publishMutation = useMutation({
    mutationFn: (versionId: string) => publishToDirectory(queryId, versionId),
    onSuccess: (data) => {
      const message = data.updated > 0
        ? `Published ${data.published} new, updated ${data.updated} existing`
        : `Published ${data.published} businesses to directory`
      toast.success(message)
      queryClient.invalidateQueries({ queryKey: ["versions", queryId] })
      setConfirmAction(null)
      setTargetVersion(null)
    },
    onError: (error: Error) => {
      toast.error(`Failed to publish: ${error.message}`)
    },
  })

  const handleSetLatest = (version: QueryVersion, e: React.MouseEvent) => {
    e.stopPropagation()
    setTargetVersion(version)
    setConfirmAction("setLatest")
    setShowActionsFor(null)
  }

  const handlePublish = (version: QueryVersion, e: React.MouseEvent) => {
    e.stopPropagation()
    setTargetVersion(version)
    setConfirmAction("publish")
    setShowActionsFor(null)
  }

  const confirmSetLatest = () => {
    if (targetVersion) {
      setLatestMutation.mutate(targetVersion.id)
    }
  }

  const confirmPublish = () => {
    if (targetVersion) {
      publishMutation.mutate(targetVersion.id)
    }
  }

  const toggleActions = (versionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setShowActionsFor(showActionsFor === versionId ? null : versionId)
  }

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
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">
          <History className="h-3.5 w-3.5" />
          <span>Version History</span>
        </div>
        <div className="space-y-2">
          {versions.map((version) => (
            <div
              key={version.id}
              className={cn(
                "w-full text-left rounded-xl p-3 transition-all duration-200 cursor-pointer",
                "border border-transparent hover:border-white/10",
                selectedVersionId === version.id
                  ? "bg-primary/10 border-primary/20 glow-primary"
                  : "bg-white/[0.02] hover:bg-white/[0.05]"
              )}
              onClick={() => onSelectVersion(version)}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col items-start gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-sm font-semibold",
                      selectedVersionId === version.id && "text-primary"
                    )}>
                      Version {version.versionNumber}
                    </span>
                    {version.isLatest && (
                      <div
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20"
                        title="Latest version"
                      >
                        <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                        <span className="text-[10px] font-medium text-amber-400 uppercase">Latest</span>
                      </div>
                    )}
                  </div>
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
                  {/* Actions menu button */}
                  <div className="relative">
                    <button
                      onClick={(e) => toggleActions(version.id, e)}
                      className={cn(
                        "p-1 rounded-md transition-colors",
                        showActionsFor === version.id
                          ? "bg-white/10 text-white"
                          : "text-muted-foreground hover:text-white hover:bg-white/5"
                      )}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>

                    {/* Dropdown menu */}
                    {showActionsFor === version.id && (
                      <div
                        className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-lg border border-white/10 bg-[#1a1a2e] shadow-xl backdrop-blur-xl"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-1">
                          {!version.isLatest && (
                            <button
                              onClick={(e) => handleSetLatest(version, e)}
                              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-200 hover:bg-white/5 transition-colors"
                            >
                              <Star className="h-4 w-4 text-amber-400" />
                              Set as Latest
                            </button>
                          )}
                          <button
                            onClick={(e) => handlePublish(version, e)}
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-200 hover:bg-white/5 transition-colors"
                          >
                            <Upload className="h-4 w-4 text-violet-400" />
                            Publish to Directory
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Dialog for Set as Latest */}
      <Dialog open={confirmAction === "setLatest"} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent className="bg-[#1a1a2e] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Set as Latest Version</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to set Version {targetVersion?.versionNumber} as the latest version?
              This will be used as the default version for this query.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setConfirmAction(null)}
              className="text-slate-300 hover:text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmSetLatest}
              disabled={setLatestMutation.isPending}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
            >
              {setLatestMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting...
                </>
              ) : (
                <>
                  <Star className="mr-2 h-4 w-4" />
                  Set as Latest
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Publish to Directory */}
      <Dialog open={confirmAction === "publish"} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent className="bg-[#1a1a2e] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Publish to Directory</DialogTitle>
            <DialogDescription className="text-slate-400">
              This will copy all {targetVersion?.businessCount} businesses from Version {targetVersion?.versionNumber} to the main business directory.
              Existing businesses will be updated with the latest data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setConfirmAction(null)}
              className="text-slate-300 hover:text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmPublish}
              disabled={publishMutation.isPending}
              className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white border-0"
            >
              {publishMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Publish
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
