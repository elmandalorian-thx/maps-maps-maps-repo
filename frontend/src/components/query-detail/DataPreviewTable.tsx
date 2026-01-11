import { useState, useCallback, useMemo } from "react"
import { ArrowUpDown, ExternalLink, Search, GripVertical, Hash, Sparkles, AlertTriangle } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DataQualityBadge } from "./DataQualityBadge"
import { updateBusinessPositions } from "@/services/api"
import { toast } from "sonner"
import type { Business, BusinessQuality } from "@/types"

interface DataPreviewTableProps {
  businesses: Business[]
  onPositionsUpdated?: (businesses: Business[]) => void
  qualityData?: BusinessQuality[]
  showQuality?: boolean
}

type SortField = "business_name" | "city" | "rating" | "user_rating_count"
type SortDirection = "asc" | "desc"
type SortMode = "google" | "custom" | "field"

// Important fields that we check for data quality
const QUALITY_FIELDS = [
  "business_name",
  "full_address",
  "phone",
  "website",
  "rating",
  "hours",
] as const

// Calculate quality score for a single business
function calculateBusinessQuality(business: Business): { score: number; missingFields: string[] } {
  const missingFields: string[] = []

  QUALITY_FIELDS.forEach((field) => {
    const value = business[field as keyof Business]
    if (value === null || value === undefined || value === "" || value === "N/A") {
      missingFields.push(field)
    }
  })

  const presentCount = QUALITY_FIELDS.length - missingFields.length
  const score = (presentCount / QUALITY_FIELDS.length) * 100

  return { score, missingFields }
}

export function DataPreviewTable({ businesses, onPositionsUpdated, qualityData, showQuality = true }: DataPreviewTableProps) {
  const [sortField, setSortField] = useState<SortField>("business_name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [sortMode, setSortMode] = useState<SortMode>("google")
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [localBusinesses, setLocalBusinesses] = useState<Business[]>(businesses)

  // Sync local state with props when businesses change
  if (businesses !== localBusinesses && !isUpdating) {
    setLocalBusinesses(businesses)
  }

  const handleSort = (field: SortField) => {
    setSortMode("field")
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const toggleSortMode = () => {
    if (sortMode === "google") {
      setSortMode("custom")
    } else if (sortMode === "custom") {
      setSortMode("google")
    } else {
      setSortMode("google")
    }
  }

  const sortedBusinesses = [...localBusinesses].sort((a, b) => {
    if (sortMode === "google") {
      const aPos = a.google_position ?? 9999
      const bPos = b.google_position ?? 9999
      return aPos - bPos
    }

    if (sortMode === "custom") {
      const aPos = a.custom_position ?? a.google_position ?? 9999
      const bPos = b.custom_position ?? b.google_position ?? 9999
      return aPos - bPos
    }

    // Field sorting
    let aVal = a[sortField]
    let bVal = b[sortField]

    // Handle numeric fields
    if (sortField === "rating" || sortField === "user_rating_count") {
      aVal = Number(aVal) || 0
      bVal = Number(bVal) || 0
    }

    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1
    return 0
  })

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", index.toString())

    // Create a custom drag image
    const dragEl = e.currentTarget as HTMLElement
    const rect = dragEl.getBoundingClientRect()
    e.dataTransfer.setDragImage(dragEl, rect.width / 2, rect.height / 2)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverIndex(index)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    // Reorder the businesses
    const newBusinesses = [...sortedBusinesses]
    const [draggedItem] = newBusinesses.splice(draggedIndex, 1)
    newBusinesses.splice(dropIndex, 0, draggedItem)

    // Update custom positions
    const updates = newBusinesses.map((business, index) => ({
      business_id: business.place_id,
      custom_position: index + 1,
    }))

    // Optimistically update local state
    const updatedBusinesses = newBusinesses.map((business, index) => ({
      ...business,
      custom_position: index + 1,
    }))

    setLocalBusinesses(updatedBusinesses)
    setSortMode("custom")
    setDraggedIndex(null)
    setDragOverIndex(null)

    // Send update to backend
    setIsUpdating(true)
    try {
      await updateBusinessPositions(updates)
      toast.success("Positions updated")
      onPositionsUpdated?.(updatedBusinesses)
    } catch (error) {
      toast.error("Failed to update positions")
      // Revert on error
      setLocalBusinesses(businesses)
    } finally {
      setIsUpdating(false)
    }
  }, [draggedIndex, sortedBusinesses, businesses, onPositionsUpdated])

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }, [])

  const getPositionDisplay = (business: Business, index: number) => {
    if (sortMode === "custom") {
      return business.custom_position ?? index + 1
    }
    return business.google_position ?? index + 1
  }

  // Build quality map for fast lookups
  const qualityMap = useMemo(() => {
    const map = new Map<string, { score: number; missingFields: string[] }>()

    // If we have quality data from API, use it
    if (qualityData && qualityData.length > 0) {
      qualityData.forEach((q) => {
        map.set(q.placeId, { score: q.score, missingFields: q.missingFields })
      })
    } else {
      // Calculate locally for preview
      businesses.forEach((business) => {
        const quality = calculateBusinessQuality(business)
        map.set(business.place_id, quality)
      })
    }

    return map
  }, [businesses, qualityData])

  // Get quality info for a business
  const getQuality = (placeId: string) => {
    return qualityMap.get(placeId) ?? { score: 100, missingFields: [] }
  }

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 font-medium hover:bg-transparent hover:text-primary transition-colors"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className={`ml-1 h-3 w-3 ${sortField === field && sortMode === "field" ? 'text-primary' : 'text-muted-foreground'}`} />
    </Button>
  )

  if (businesses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="relative mb-4">
          <div className="w-14 h-14 rounded-2xl gradient-primary opacity-20 absolute inset-0 blur-xl"></div>
          <div className="w-14 h-14 rounded-2xl glass-strong flex items-center justify-center relative">
            <Search className="h-6 w-6 text-primary" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          No data to display. Run an extraction to see results.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Sort Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Sort by:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSortMode}
            className={`h-7 text-xs gap-1.5 transition-all ${
              sortMode === "google"
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                : sortMode === "custom"
                ? "border-violet-500/50 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20"
                : "border-white/10 bg-white/5"
            }`}
          >
            {sortMode === "google" ? (
              <>
                <Hash className="h-3 w-3" />
                Google Order
              </>
            ) : sortMode === "custom" ? (
              <>
                <Sparkles className="h-3 w-3" />
                Custom Order
              </>
            ) : (
              <>
                <ArrowUpDown className="h-3 w-3" />
                Field Sort
              </>
            )}
          </Button>
        </div>
        {sortMode === "custom" && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <GripVertical className="h-3 w-3" />
            Drag rows to reorder
          </span>
        )}
      </div>

      <div className="rounded-xl overflow-hidden border border-white/5">
        <Table className="data-table">
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              {/* Position Column */}
              <TableHead className="w-[60px] bg-white/[0.02] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  Pos
                </span>
              </TableHead>
              {/* Drag Handle Column - only visible in custom mode */}
              {sortMode === "custom" && (
                <TableHead className="w-[40px] bg-white/[0.02]"></TableHead>
              )}
              <TableHead className="w-[200px] bg-white/[0.02] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <SortButton field="business_name">Name</SortButton>
              </TableHead>
              <TableHead className="w-[250px] bg-white/[0.02] text-xs font-semibold uppercase tracking-wide text-muted-foreground">Address</TableHead>
              <TableHead className="w-[120px] bg-white/[0.02] text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone</TableHead>
              <TableHead className="w-[80px] bg-white/[0.02] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <SortButton field="rating">Rating</SortButton>
              </TableHead>
              <TableHead className="w-[80px] bg-white/[0.02] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <SortButton field="user_rating_count">Reviews</SortButton>
              </TableHead>
              <TableHead className="w-[100px] bg-white/[0.02] text-xs font-semibold uppercase tracking-wide text-muted-foreground">Website</TableHead>
              {showQuality && (
                <TableHead className="w-[80px] bg-white/[0.02] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Quality
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedBusinesses.map((business, index) => {
              const quality = getQuality(business.place_id)
              const isLowQuality = quality.score < 50
              const isIncomplete = quality.missingFields.length > 0

              return (
              <TableRow
                key={business.place_id}
                draggable={sortMode === "custom"}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`
                  border-white/5 transition-all
                  ${index % 2 === 0 ? 'bg-white/[0.01]' : ''}
                  ${sortMode === "custom" ? 'cursor-grab active:cursor-grabbing' : 'hover:bg-white/[0.03]'}
                  ${draggedIndex === index ? 'opacity-50 bg-primary/10' : ''}
                  ${dragOverIndex === index && draggedIndex !== index ? 'bg-primary/20 border-t-2 border-t-primary' : ''}
                  ${showQuality && isLowQuality ? 'bg-red-500/[0.03] hover:bg-red-500/[0.06]' : ''}
                `}
              >
                {/* Position Cell */}
                <TableCell className="text-xs font-mono">
                  <span className={`
                    inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-medium
                    ${sortMode === "google"
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                    }
                  `}>
                    {getPositionDisplay(business, index)}
                  </span>
                </TableCell>
                {/* Drag Handle Cell */}
                {sortMode === "custom" && (
                  <TableCell className="text-xs">
                    <div className="flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                      <GripVertical className="h-4 w-4" />
                    </div>
                  </TableCell>
                )}
                <TableCell className="font-medium text-xs">
                  <div className="flex items-center gap-1.5">
                    {showQuality && isIncomplete && (
                      <AlertTriangle className="h-3 w-3 text-amber-400 flex-shrink-0" />
                    )}
                    <span className={isIncomplete && showQuality ? 'text-amber-100' : ''}>
                      {business.business_name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {business.full_address}
                </TableCell>
                <TableCell className="text-xs">
                  {business.phone || <span className="text-muted-foreground/50">-</span>}
                </TableCell>
                <TableCell className="text-xs">
                  {business.rating ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10">
                      <span className="text-amber-400">★</span>
                      <span className="text-amber-200">{Number(business.rating).toFixed(1)}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground/50">-</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {business.user_rating_count || <span className="text-muted-foreground/50">-</span>}
                </TableCell>
                <TableCell className="text-xs">
                  {business.website ? (
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      Visit
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground/50">-</span>
                  )}
                </TableCell>
                {showQuality && (
                  <TableCell className="text-xs">
                    <DataQualityBadge
                      score={quality.score}
                      missingFields={quality.missingFields}
                      compact
                    />
                  </TableCell>
                )}
              </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
