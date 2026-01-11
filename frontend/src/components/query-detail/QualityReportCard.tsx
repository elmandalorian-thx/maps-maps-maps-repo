import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ChevronDown,
  ChevronUp,
  Copy,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { getQualityReport } from "@/services/api"
import type { DuplicateRecord, FieldQuality } from "@/types"

interface QualityReportCardProps {
  queryId: string
  versionId: string | null
}

function ScoreGauge({ score }: { score: number }) {
  const getScoreConfig = (score: number) => {
    if (score >= 80) return {
      color: "text-emerald-400",
      bgColor: "bg-emerald-500",
      glowColor: "shadow-emerald-500/30",
      icon: ShieldCheck,
      label: "Excellent",
    }
    if (score >= 50) return {
      color: "text-amber-400",
      bgColor: "bg-amber-500",
      glowColor: "shadow-amber-500/30",
      icon: ShieldAlert,
      label: "Fair",
    }
    return {
      color: "text-red-400",
      bgColor: "bg-red-500",
      glowColor: "shadow-red-500/30",
      icon: ShieldX,
      label: "Poor",
    }
  }

  const config = getScoreConfig(score)
  const Icon = config.icon

  return (
    <div className="flex items-center gap-4">
      <div className={`relative p-3 rounded-xl bg-white/5 shadow-lg ${config.glowColor}`}>
        <Icon className={`h-8 w-8 ${config.color}`} />
      </div>
      <div>
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold ${config.color}`}>
            {Math.round(score)}%
          </span>
          <span className="text-sm text-muted-foreground">
            {config.label}
          </span>
        </div>
        <div className="mt-1 h-2 w-32 rounded-full bg-white/5 overflow-hidden">
          <div
            className={`h-full ${config.bgColor} transition-all duration-500`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function StatItem({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number
  icon: React.ElementType
  color: string
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
      <div className={`p-2 rounded-lg bg-white/5 ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-lg font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

function FieldCompletionBar({ field }: { field: FieldQuality }) {
  const formatFieldName = (name: string) => {
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
  }

  const getBarColor = (rate: number) => {
    if (rate >= 80) return "bg-emerald-500"
    if (rate >= 50) return "bg-amber-500"
    return "bg-red-500"
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-300">{formatFieldName(field.field)}</span>
        <span className="text-muted-foreground">
          {Math.round(field.completionRate)}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full ${getBarColor(field.completionRate)} transition-all duration-300`}
          style={{ width: `${field.completionRate}%` }}
        />
      </div>
    </div>
  )
}

function DuplicatesList({ duplicates }: { duplicates: DuplicateRecord[] }) {
  const [expanded, setExpanded] = useState(false)

  if (duplicates.length === 0) return null

  return (
    <div className="mt-4 pt-4 border-t border-white/5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left group"
      >
        <div className="flex items-center gap-2">
          <Copy className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-medium">
            Duplicates Found ({duplicates.length})
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-white transition-colors" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-white transition-colors" />
        )}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
          {duplicates.map((dup) => (
            <div
              key={dup.placeId}
              className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/5"
            >
              <span className="text-xs text-slate-300 truncate max-w-[180px]">
                {dup.businessName}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                x{dup.count}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function QualityReportCard({ queryId, versionId }: QualityReportCardProps) {
  const { data: report, isLoading, error } = useQuery({
    queryKey: ["qualityReport", queryId, versionId],
    queryFn: () => getQualityReport(queryId, versionId!),
    enabled: !!versionId,
    staleTime: 30000, // Cache for 30 seconds
  })

  if (!versionId) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-white/5">
            <ShieldCheck className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-semibold">Data Quality</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <ShieldAlert className="h-8 w-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            Select a version to view quality report
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-white/5">
            <ShieldCheck className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-semibold">Data Quality</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-white/5" />
            <div className="w-24 h-4 rounded bg-white/5" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-white/5">
            <ShieldCheck className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-semibold">Data Quality</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="h-8 w-8 text-red-400/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            Failed to load quality report
          </p>
        </div>
      </div>
    )
  }

  // Get the top 5 fields with lowest completion rates
  const problematicFields = [...report.fieldStats]
    .filter((f) => f.completionRate < 100)
    .sort((a, b) => a.completionRate - b.completionRate)
    .slice(0, 5)

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-white/5">
          <ShieldCheck className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-semibold">Data Quality</h3>
      </div>

      {/* Score Gauge */}
      <ScoreGauge score={report.overallScore} />

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mt-6">
        <StatItem
          label="Total"
          value={report.totalRecords}
          icon={AlertCircle}
          color="text-slate-400"
        />
        <StatItem
          label="Complete"
          value={report.completeRecords}
          icon={CheckCircle2}
          color="text-emerald-400"
        />
        <StatItem
          label="Incomplete"
          value={report.incompleteRecords}
          icon={XCircle}
          color="text-red-400"
        />
      </div>

      {/* Field Completion */}
      {problematicFields.length > 0 && (
        <div className="mt-6">
          <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
            Fields Needing Attention
          </h4>
          <div className="space-y-3">
            {problematicFields.map((field) => (
              <FieldCompletionBar key={field.field} field={field} />
            ))}
          </div>
        </div>
      )}

      {/* Duplicates */}
      <DuplicatesList duplicates={report.duplicates} />
    </div>
  )
}
