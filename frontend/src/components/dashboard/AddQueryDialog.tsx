import { useState } from "react"
import { Plus, Sparkles, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"

interface AddQueryDialogProps {
  onAdd: (businessType: string, city: string) => Promise<void>
  existingQueries: string[]
}

export function AddQueryDialog({ onAdd, existingQueries }: AddQueryDialogProps) {
  const [open, setOpen] = useState(false)
  const [businessType, setBusinessType] = useState("")
  const [city, setCity] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const fullQuery = `${businessType} ${city}`.trim()
  const isDuplicate = existingQueries.some(
    (q) => q.toLowerCase() === fullQuery.toLowerCase()
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!businessType.trim() || !city.trim()) {
      setError("Please fill in both fields")
      return
    }

    if (isDuplicate) {
      setError("This query already exists")
      return
    }

    setLoading(true)
    try {
      await onAdd(businessType.trim(), city.trim())
      setBusinessType("")
      setCity("")
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add query")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 gradient-primary glow-primary hover:scale-105 transition-transform rounded-xl px-5">
          <Plus className="h-4 w-4" />
          Add Query
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] glass-strong border-white/10 rounded-2xl p-0 overflow-hidden">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <div className="p-2 rounded-xl gradient-primary">
                <Plus className="h-4 w-4 text-white" />
              </div>
              New Search Query
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Create a new query to extract business data from Google Maps.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="businessType" className="text-sm font-medium">
                Business Type
              </Label>
              <Input
                id="businessType"
                placeholder="e.g., Naturopathic Doctor, Coffee Shop, Dentist"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="h-12 rounded-xl glass-input bg-white/5 border-white/10 placeholder:text-muted-foreground/50 focus:border-primary focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm font-medium">
                City / Location
              </Label>
              <Input
                id="city"
                placeholder="e.g., Toronto, New York, Los Angeles"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-12 rounded-xl glass-input bg-white/5 border-white/10 placeholder:text-muted-foreground/50 focus:border-primary focus:ring-primary/20"
              />
            </div>

            {fullQuery && fullQuery !== " " && (
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Query Preview
                  </span>
                </div>
                <p className="font-semibold text-lg">{fullQuery}</p>
                {isDuplicate && (
                  <div className="flex items-center gap-2 mt-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-xs">This query already exists</span>
                  </div>
                )}
              </div>
            )}

            {error && !isDuplicate && (
              <div className="flex items-center gap-2 text-destructive bg-destructive/10 rounded-xl p-3">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>

          <DialogFooter className="px-6 py-4 bg-white/[0.02] border-t border-white/5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="rounded-xl hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || isDuplicate || !businessType.trim() || !city.trim()}
              className="rounded-xl gradient-primary glow-primary hover:scale-105 transition-transform px-6"
            >
              {loading && <LoadingSpinner size="sm" className="mr-2" />}
              Create Query
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
