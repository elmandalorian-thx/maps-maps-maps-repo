import { useState, useCallback, useMemo } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X, Filter, Search } from "lucide-react"
import { useQueryStore } from "@/stores/queryStore"
import { LOCATIONS } from "@/data/locations"
import type { QueryStatus } from "@/types"

interface QueryFiltersProps {
  businessTypes: string[]
  cities: string[]
  provinces?: string[]
  countries?: string[]
}

export function QueryFilters({ businessTypes, cities }: QueryFiltersProps) {
  const { filters, setFilters, resetFilters } = useQueryStore()
  const [searchInput, setSearchInput] = useState(filters.search || "")

  // Get available countries from location data
  const availableCountries = useMemo(() => {
    return LOCATIONS.map(c => ({ code: c.code, name: c.name }))
  }, [])

  // Get available provinces based on selected country
  const availableProvinces = useMemo(() => {
    if (!filters.country) {
      // Return all provinces from all countries
      return LOCATIONS.flatMap(c =>
        c.provinces.map(p => ({ code: p.code, name: p.name, country: c.code }))
      )
    }
    const country = LOCATIONS.find(c => c.code === filters.country)
    return country?.provinces.map(p => ({ code: p.code, name: p.name, country: country.code })) || []
  }, [filters.country])

  // Get available cities based on selected province/country
  const availableCities = useMemo(() => {
    if (filters.province) {
      const country = LOCATIONS.find(c =>
        c.provinces.some(p => p.code === filters.province)
      )
      const province = country?.provinces.find(p => p.code === filters.province)
      return province?.cities.map(c => c.name) || []
    }
    if (filters.country) {
      const country = LOCATIONS.find(c => c.code === filters.country)
      return country?.provinces.flatMap(p => p.cities.map(c => c.name)) || []
    }
    // Return passed cities or all from location data
    return cities.length > 0 ? cities : LOCATIONS.flatMap(c =>
      c.provinces.flatMap(p => p.cities.map(city => city.name))
    )
  }, [filters.country, filters.province, cities])

  const hasFilters = filters.businessType || filters.city || filters.status ||
                     filters.country || filters.province || filters.search

  // Debounced search handler
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value)
    // Debounce the filter update
    const timeout = setTimeout(() => {
      setFilters({ search: value || null })
    }, 300)
    return () => clearTimeout(timeout)
  }, [setFilters])

  const handleReset = () => {
    setSearchInput("")
    resetFilters()
  }

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search queries..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 h-10 rounded-xl bg-white/5 border-white/10 focus:border-indigo-500/50"
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 text-muted-foreground mr-1">
          <Filter className="h-4 w-4" />
          <span className="text-xs font-medium">Filters</span>
        </div>

        {/* Country filter */}
        <Select
          value={filters.country || "all"}
          onValueChange={(value) => {
            setFilters({
              country: value === "all" ? null : value,
              province: null, // Reset province when country changes
              city: null // Reset city when country changes
            })
          }}
        >
          <SelectTrigger className="w-[130px] h-9 text-xs rounded-lg bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent className="glass-strong border-white/10 rounded-xl">
            <SelectItem value="all" className="rounded-lg text-xs">All Countries</SelectItem>
            {availableCountries.map((country) => (
              <SelectItem key={country.code} value={country.code} className="rounded-lg text-xs">
                {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Province filter */}
        <Select
          value={filters.province || "all"}
          onValueChange={(value) => {
            setFilters({
              province: value === "all" ? null : value,
              city: null // Reset city when province changes
            })
          }}
        >
          <SelectTrigger className="w-[140px] h-9 text-xs rounded-lg bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
            <SelectValue placeholder="Province" />
          </SelectTrigger>
          <SelectContent className="glass-strong border-white/10 rounded-xl max-h-60">
            <SelectItem value="all" className="rounded-lg text-xs">All Provinces</SelectItem>
            {availableProvinces.map((p) => (
              <SelectItem key={`${p.country}-${p.code}`} value={p.code} className="rounded-lg text-xs">
                {p.name} - {p.country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* City filter */}
        <Select
          value={filters.city || "all"}
          onValueChange={(value) =>
            setFilters({ city: value === "all" ? null : value })
          }
        >
          <SelectTrigger className="w-[130px] h-9 text-xs rounded-lg bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
            <SelectValue placeholder="City" />
          </SelectTrigger>
          <SelectContent className="glass-strong border-white/10 rounded-xl max-h-60">
            <SelectItem value="all" className="rounded-lg text-xs">All Cities</SelectItem>
            {availableCities.slice(0, 100).map((city) => (
              <SelectItem key={city} value={city} className="rounded-lg text-xs">
                {city}
              </SelectItem>
            ))}
            {availableCities.length > 100 && (
              <div className="px-2 py-1 text-xs text-muted-foreground">
                +{availableCities.length - 100} more...
              </div>
            )}
          </SelectContent>
        </Select>

        {/* Business Type filter */}
        <Select
          value={filters.businessType || "all"}
          onValueChange={(value) =>
            setFilters({ businessType: value === "all" ? null : value })
          }
        >
          <SelectTrigger className="w-[150px] h-9 text-xs rounded-lg bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
            <SelectValue placeholder="Business Type" />
          </SelectTrigger>
          <SelectContent className="glass-strong border-white/10 rounded-xl max-h-60">
            <SelectItem value="all" className="rounded-lg text-xs">All Types</SelectItem>
            {businessTypes.map((type) => (
              <SelectItem key={type} value={type} className="rounded-lg text-xs">
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select
          value={filters.status || "all"}
          onValueChange={(value) =>
            setFilters({ status: value === "all" ? null : (value as QueryStatus) })
          }
        >
          <SelectTrigger className="w-[120px] h-9 text-xs rounded-lg bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="glass-strong border-white/10 rounded-xl">
            <SelectItem value="all" className="rounded-lg text-xs">All Status</SelectItem>
            <SelectItem value="pending" className="rounded-lg text-xs">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Pending
              </span>
            </SelectItem>
            <SelectItem value="queued" className="rounded-lg text-xs">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                Queued
              </span>
            </SelectItem>
            <SelectItem value="running" className="rounded-lg text-xs">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Running
              </span>
            </SelectItem>
            <SelectItem value="completed" className="rounded-lg text-xs">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Completed
              </span>
            </SelectItem>
            <SelectItem value="error" className="rounded-lg text-xs">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                Error
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="gap-1 h-9 text-xs rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}
