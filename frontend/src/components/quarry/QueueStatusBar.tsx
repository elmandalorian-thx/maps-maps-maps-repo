import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Pause, Play, RotateCcw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { pauseQueue, resumeQueue, retryFailedQueries } from "@/services/api"
import type { QueueStatus } from "@/types"

interface QueueStatusBarProps {
  status: QueueStatus
}

export function QueueStatusBar({ status }: QueueStatusBarProps) {
  const queryClient = useQueryClient()
  const total = status.pending + status.queued + status.running + status.complete + status.error

  // Pause queue mutation
  const pauseMutation = useMutation({
    mutationFn: pauseQueue,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["queueStatus"] })
      toast.success(data.message)
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to pause queue")
    },
  })

  // Resume queue mutation
  const resumeMutation = useMutation({
    mutationFn: resumeQueue,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["queueStatus"] })
      toast.success(data.message)
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to resume queue")
    },
  })

  // Retry failed mutation
  const retryMutation = useMutation({
    mutationFn: retryFailedQueries,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["queueStatus"] })
      queryClient.invalidateQueries({ queryKey: ["queries"] })
      toast.success(data.message)
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to retry failed queries")
    },
  })

  if (total === 0) return null

  const getPercentage = (value: number) => (total > 0 ? (value / total) * 100 : 0)
  const hasActiveWork = status.running > 0 || status.queued > 0
  const isControlLoading = pauseMutation.isPending || resumeMutation.isPending

  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-sm">Queue Status</h3>
          {status.paused && (
            <span className="px-2 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30">
              Paused
            </span>
          )}
          {hasActiveWork && !status.paused && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Processing
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Pause/Resume Button */}
          {hasActiveWork || status.paused ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => status.paused ? resumeMutation.mutate() : pauseMutation.mutate()}
              disabled={isControlLoading}
              className="h-7 px-2.5 text-xs gap-1.5"
            >
              {isControlLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : status.paused ? (
                <>
                  <Play className="h-3.5 w-3.5" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  Pause
                </>
              )}
            </Button>
          ) : null}

          {/* Retry Failed Button */}
          {status.error > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => retryMutation.mutate()}
              disabled={retryMutation.isPending}
              className="h-7 px-2.5 text-xs gap-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              {retryMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <RotateCcw className="h-3.5 w-3.5" />
                  Retry Failed ({status.error})
                </>
              )}
            </Button>
          )}

          <span className="text-xs text-muted-foreground ml-2">
            {total.toLocaleString()} total queries
          </span>
        </div>
      </div>

      {/* Animated Progress Bar */}
      <div className="h-2 rounded-full bg-white/10 overflow-hidden flex relative">
        {/* Background animation for active processing */}
        {hasActiveWork && !status.paused && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
        )}
        <div
          className="bg-emerald-500 transition-all duration-500 ease-out"
          style={{ width: `${getPercentage(status.complete)}%` }}
          title={`Complete: ${status.complete}`}
        />
        <div
          className={`bg-blue-500 transition-all duration-500 ease-out ${hasActiveWork && !status.paused ? 'animate-pulse' : ''}`}
          style={{ width: `${getPercentage(status.running)}%` }}
          title={`Running: ${status.running}`}
        />
        <div
          className="bg-blue-400/50 transition-all duration-500 ease-out"
          style={{ width: `${getPercentage(status.queued)}%` }}
          title={`Queued: ${status.queued}`}
        />
        <div
          className="bg-amber-500/50 transition-all duration-500 ease-out"
          style={{ width: `${getPercentage(status.pending)}%` }}
          title={`Pending: ${status.pending}`}
        />
        <div
          className="bg-red-500 transition-all duration-500 ease-out"
          style={{ width: `${getPercentage(status.error)}%` }}
          title={`Error: ${status.error}`}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between mt-3 text-xs">
        <div className="flex items-center gap-4">
          <StatusBadge color="bg-emerald-500" label="Complete" value={status.complete} />
          <StatusBadge color="bg-blue-500" label="Running" value={status.running} pulse={status.running > 0 && !status.paused} />
          <StatusBadge color="bg-blue-400/50" label="Queued" value={status.queued} />
          <StatusBadge color="bg-amber-500/50" label="Pending" value={status.pending} />
          <StatusBadge color="bg-red-500" label="Error" value={status.error} />
        </div>
        <div className="flex items-center gap-3">
          {status.currentlyProcessing && !status.paused && (
            <span className="text-muted-foreground truncate max-w-[200px]" title={status.currentlyProcessing}>
              {status.currentlyProcessing}
            </span>
          )}
          {status.estimatedTimeRemaining && !status.paused && (
            <span className="text-muted-foreground">
              ETA: {formatTime(status.estimatedTimeRemaining)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

interface StatusBadgeProps {
  color: string
  label: string
  value: number
  pulse?: boolean
}

function StatusBadge({ color, label, value, pulse }: StatusBadgeProps) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${color} ${pulse ? 'animate-pulse' : ''}`} />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value.toLocaleString()}</span>
    </div>
  )
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}
