import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { LOCATIONS, type Country, type Province } from "@/data/locations"
import type { BaseTerm, BulkGenerateRequest } from "@/types"

interface BulkGenerateDialogProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (request: BulkGenerateRequest) => Promise<void>
  term: BaseTerm | null
  isLoading?: boolean
}

export function BulkGenerateDialog({
  isOpen,
  onClose,
  onGenerate,
  term,
  isLoading,
}: BulkGenerateDialogProps) {
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [allCountries, setAllCountries] = useState(false)
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([])
  const [allProvinces, setAllProvinces] = useState(false)
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [allCities, setAllCities] = useState(true) // Default to all cities

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCountries([])
      setAllCountries(false)
      setSelectedProvinces([])
      setAllProvinces(false)
      setSelectedCities([])
      setAllCities(true)
    }
  }, [isOpen])

  // Get available provinces based on selected countries
  const availableProvinces = useMemo(() => {
    const countries = allCountries ? LOCATIONS : LOCATIONS.filter((c) => selectedCountries.includes(c.code))
    const provinces: { province: Province; country: Country }[] = []
    countries.forEach((country) => {
      country.provinces.forEach((province) => {
        provinces.push({ province, country })
      })
    })
    return provinces.sort((a, b) => a.province.name.localeCompare(b.province.name))
  }, [selectedCountries, allCountries])

  // Get available cities based on selected provinces
  const availableCities = useMemo(() => {
    const cities: { city: string; province: Province; country: Country }[] = []
    const targetProvinces = allProvinces
      ? availableProvinces
      : availableProvinces.filter((p) => selectedProvinces.includes(p.province.code))

    targetProvinces.forEach(({ province, country }) => {
      province.cities.forEach((city) => {
        cities.push({ city: city.name, province, country })
      })
    })
    return cities.sort((a, b) => a.city.localeCompare(b.city))
  }, [availableProvinces, selectedProvinces, allProvinces])

  // Calculate estimated query count
  const estimatedCount = useMemo(() => {
    if (allCities) {
      return availableCities.length
    }
    return selectedCities.length
  }, [availableCities, selectedCities, allCities])

  // Estimated cost (roughly $32/1000 for text search + $17/1000 for details)
  const estimatedCost = useMemo(() => {
    return ((estimatedCount * 49) / 1000).toFixed(2)
  }, [estimatedCount])

  const handleSubmit = async () => {
    const request: BulkGenerateRequest = {
      countries: allCountries ? ["ALL"] : selectedCountries,
      provinces: allProvinces ? ["ALL"] : selectedProvinces,
      cities: allCities ? ["ALL"] : selectedCities,
    }
    await onGenerate(request)
  }

  const toggleCountry = (code: string) => {
    setSelectedCountries((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
    // Clear province and city selections when countries change
    setSelectedProvinces([])
    setSelectedCities([])
  }

  const toggleProvince = (code: string) => {
    setSelectedProvinces((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code]
    )
    // Clear city selections when provinces change
    setSelectedCities([])
  }

  const toggleCity = (name: string) => {
    setSelectedCities((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    )
  }

  const isValid = estimatedCount > 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-white/10 sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Generate Queries for "{term?.term}"</DialogTitle>
          <DialogDescription>
            Select locations to generate queries. Each combination will create a query like "{term?.term} [city]".
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4 pr-2">
          {/* Countries */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Countries</Label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={allCountries}
                  onChange={(e) => {
                    setAllCountries(e.target.checked)
                    if (e.target.checked) {
                      setSelectedCountries([])
                    }
                  }}
                  className="rounded border-white/20 bg-white/5"
                />
                All Countries
              </label>
            </div>
            {!allCountries && (
              <div className="flex flex-wrap gap-2">
                {LOCATIONS.map((country) => (
                  <Badge
                    key={country.code}
                    variant={selectedCountries.includes(country.code) ? "default" : "secondary"}
                    className={`cursor-pointer transition-all ${
                      selectedCountries.includes(country.code)
                        ? "bg-indigo-600 hover:bg-indigo-500"
                        : "hover:bg-white/20"
                    }`}
                    onClick={() => toggleCountry(country.code)}
                  >
                    {country.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Provinces/States */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Provinces / States</Label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={allProvinces}
                  onChange={(e) => {
                    setAllProvinces(e.target.checked)
                    if (e.target.checked) {
                      setSelectedProvinces([])
                    }
                  }}
                  className="rounded border-white/20 bg-white/5"
                  disabled={!allCountries && selectedCountries.length === 0}
                />
                All Provinces
              </label>
            </div>
            {!allProvinces && (allCountries || selectedCountries.length > 0) && (
              <div className="max-h-40 overflow-y-auto rounded-lg bg-white/5 p-3">
                <div className="flex flex-wrap gap-2">
                  {availableProvinces.map(({ province, country }) => (
                    <Badge
                      key={`${country.code}-${province.code}`}
                      variant={selectedProvinces.includes(province.code) ? "default" : "secondary"}
                      className={`cursor-pointer transition-all text-xs ${
                        selectedProvinces.includes(province.code)
                          ? "bg-indigo-600 hover:bg-indigo-500"
                          : "hover:bg-white/20"
                      }`}
                      onClick={() => toggleProvince(province.code)}
                    >
                      {province.name} - {country.code}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cities */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Cities</Label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={allCities}
                  onChange={(e) => {
                    setAllCities(e.target.checked)
                    if (e.target.checked) {
                      setSelectedCities([])
                    }
                  }}
                  className="rounded border-white/20 bg-white/5"
                  disabled={
                    (!allCountries && selectedCountries.length === 0) ||
                    (!allProvinces && selectedProvinces.length === 0)
                  }
                />
                All Cities
              </label>
            </div>
            {!allCities && (allProvinces || selectedProvinces.length > 0) && (
              <div className="max-h-40 overflow-y-auto rounded-lg bg-white/5 p-3">
                <div className="flex flex-wrap gap-2">
                  {availableCities.slice(0, 100).map(({ city, province, country }) => (
                    <Badge
                      key={`${country.code}-${province.code}-${city}`}
                      variant={selectedCities.includes(city) ? "default" : "secondary"}
                      className={`cursor-pointer transition-all text-xs ${
                        selectedCities.includes(city)
                          ? "bg-indigo-600 hover:bg-indigo-500"
                          : "hover:bg-white/20"
                      }`}
                      onClick={() => toggleCity(city)}
                    >
                      {city}
                    </Badge>
                  ))}
                  {availableCities.length > 100 && (
                    <span className="text-xs text-muted-foreground px-2">
                      +{availableCities.length - 100} more cities
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="rounded-xl bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Estimated Queries</p>
                <p className="text-2xl font-bold text-indigo-400">
                  {estimatedCount.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Estimated Cost</p>
                <p className="text-2xl font-bold text-emerald-400">${estimatedCost}</p>
              </div>
            </div>
            {estimatedCount > 50 && (
              <p className="text-xs text-amber-400 mt-2">
                Warning: Creating {estimatedCount.toLocaleString()} queries. This may take a moment.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="border-t border-white/10 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isLoading}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generating...
              </>
            ) : (
              <>Generate {estimatedCount.toLocaleString()} Queries</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
