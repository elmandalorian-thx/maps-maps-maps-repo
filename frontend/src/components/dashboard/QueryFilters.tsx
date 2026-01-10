import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X, Filter } from "lucide-react"
import { useQueryStore } from "@/stores/queryStore"
import type { QueryStatus } from "@/types"

interface QueryFiltersProps {
  businessTypes: string[]
  cities: string[]
}

export function QueryFilters({ businessTypes, cities }: QueryFiltersProps) {
  const { filters, setFilters, resetFilters } = useQueryStore()

  const hasFilters = filters.businessType || filters.city || filters.status

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-muted-foreground mr-2">
        <Filter className="h-4 w-4" />
        <span className="text-sm font-medium">Filters</span>
      </div>

      <Select
        value={filters.businessType || "all"}
        onValueChange={(value) =>
          setFilters({ businessType: value === "all" ? null : value })
        }
      >
        <SelectTrigger className="w-[180px] h-10 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
          <SelectValue placeholder="Business Type" />
        </SelectTrigger>
        <SelectContent className="glass-strong border-white/10 rounded-xl">
          <SelectItem value="all" className="rounded-lg">All Business Types</SelectItem>
          {businessTypes.map((type) => (
            <SelectItem key={type} value={type} className="rounded-lg">
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.city || "all"}
        onValueChange={(value) =>
          setFilters({ city: value === "all" ? null : value })
        }
      >
        <SelectTrigger className="w-[150px] h-10 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
          <SelectValue placeholder="City" />
        </SelectTrigger>
        <SelectContent className="glass-strong border-white/10 rounded-xl">
          <SelectItem value="all" className="rounded-lg">All Cities</SelectItem>
          {cities.map((city) => (
            <SelectItem key={city} value={city} className="rounded-lg">
              {city}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.status || "all"}
        onValueChange={(value) =>
          setFilters({ status: value === "all" ? null : (value as QueryStatus) })
        }
      >
        <SelectTrigger className="w-[140px] h-10 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="glass-strong border-white/10 rounded-xl">
          <SelectItem value="all" className="rounded-lg">All Status</SelectItem>
          <SelectItem value="pending" className="rounded-lg">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-warning"></span>
              Pending
            </span>
          </SelectItem>
          <SelectItem value="completed" className="rounded-lg">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success"></span>
              Completed
            </span>
          </SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          className="gap-1.5 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
          Clear filters
        </Button>
      )}
    </div>
  )
}
