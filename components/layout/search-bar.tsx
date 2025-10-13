"use client"

import type React from "react"

import { useCallback } from "react"
import { Input } from "@/components/ui/input"
import { X, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDebouncedCallback } from "use-debounce"

export function SearchBar({ onChange }: { onChange: (q: string) => void }) {
  const debounced = useDebouncedCallback((val: string) => onChange(val), 500)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      debounced(e.target.value)
    },
    [debounced],
  )

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input aria-label="Search articles" placeholder="Search keywords..." className="pl-9" onChange={handleChange} />
      </div>
      <Button type="button" variant="secondary" onClick={() => onChange("")} aria-label="Clear search">
        <X className="mr-2 size-4" />
        Clear
      </Button>
    </div>
  )
}
