import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface DataQualityBadgeProps {
  score: number
  missingFields?: string[]
  compact?: boolean
}

export function DataQualityBadge({ score, missingFields = [], compact = false }: DataQualityBadgeProps) {
  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      text: "text-emerald-400",
      glow: "shadow-emerald-500/20",
      icon: CheckCircle2,
    }
    if (score >= 50) return {
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      text: "text-amber-400",
      glow: "shadow-amber-500/20",
      icon: AlertTriangle,
    }
    return {
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      text: "text-red-400",
      glow: "shadow-red-500/20",
      icon: XCircle,
    }
  }

  const colors = getScoreColor(score)
  const Icon = colors.icon

  const formatFieldName = (field: string) => {
    return field
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
  }

  const badge = (
    <div
      className={`inline-flex items-center gap-1 ${compact ? 'px-1.5 py-0.5' : 'px-2 py-1'} rounded-md border ${colors.bg} ${colors.border} ${colors.text} transition-all hover:shadow-lg ${colors.glow}`}
    >
      <Icon className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
      <span className={`font-medium ${compact ? 'text-[10px]' : 'text-xs'}`}>
        {Math.round(score)}%
      </span>
    </div>
  )

  if (missingFields.length === 0) {
    return badge
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${colors.text}`} />
              <span className="font-medium">
                Data Quality: {Math.round(score)}%
              </span>
            </div>
            {missingFields.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">
                  Missing Fields ({missingFields.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {missingFields.slice(0, 5).map((field) => (
                    <span
                      key={field}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-300"
                    >
                      {formatFieldName(field)}
                    </span>
                  ))}
                  {missingFields.length > 5 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                      +{missingFields.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
