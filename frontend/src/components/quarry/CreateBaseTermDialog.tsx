import { useState } from "react"
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

interface CreateBaseTermDialogProps {
  onAdd: (term: string, category?: string) => Promise<void>
  isLoading?: boolean
}

export function CreateBaseTermDialog({ onAdd, isLoading }: CreateBaseTermDialogProps) {
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState("")
  const [category, setCategory] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!term.trim()) return

    try {
      await onAdd(term.trim(), category.trim() || undefined)
      setTerm("")
      setCategory("")
      setOpen(false)
    } catch {
      // Error handled by parent
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/25">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Base Term
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card border-white/10 sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Base Term</DialogTitle>
            <DialogDescription>
              Add a new search term that can be combined with multiple locations.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-6">
            <div className="space-y-2">
              <Label htmlFor="term">Search Term</Label>
              <Input
                id="term"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="e.g., naturopathic doctor"
                className="bg-white/5 border-white/10 focus:border-indigo-500/50"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                This will be combined with city names to create queries like "naturopathic doctor Oakville"
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category (Optional)</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Healthcare"
                className="bg-white/5 border-white/10 focus:border-indigo-500/50"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!term.trim() || isLoading}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500"
            >
              {isLoading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
