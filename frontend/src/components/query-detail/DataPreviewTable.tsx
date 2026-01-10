import { useState } from "react"
import { ArrowUpDown, ExternalLink, Search } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import type { Business } from "@/types"

interface DataPreviewTableProps {
  businesses: Business[]
}

type SortField = "business_name" | "city" | "rating" | "user_rating_count"
type SortDirection = "asc" | "desc"

export function DataPreviewTable({ businesses }: DataPreviewTableProps) {
  const [sortField, setSortField] = useState<SortField>("business_name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedBusinesses = [...businesses].sort((a, b) => {
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

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 font-medium hover:bg-transparent hover:text-primary transition-colors"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className={`ml-1 h-3 w-3 ${sortField === field ? 'text-primary' : 'text-muted-foreground'}`} />
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
    <div className="rounded-xl overflow-hidden border border-white/5">
      <Table className="data-table">
        <TableHeader>
          <TableRow className="border-white/5 hover:bg-transparent">
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedBusinesses.map((business, index) => (
            <TableRow
              key={business.place_id}
              className={`border-white/5 transition-colors hover:bg-white/[0.03] ${index % 2 === 0 ? 'bg-white/[0.01]' : ''}`}
            >
              <TableCell className="font-medium text-xs">
                {business.business_name}
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
