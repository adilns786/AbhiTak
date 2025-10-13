"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export function CategoryFilter({
  categories,
  active,
  onSelect,
}: {
  categories: string[]
  active: string
  onSelect: (c: string) => void
}) {
  return (
    <div className="relative overflow-x-auto">
      <div className="flex items-center gap-2">
        {categories.map((c) => {
          const isActive = c === active
          return (
            <motion.button
              whileTap={{ scale: 0.98 }}
              key={c}
              onClick={() => onSelect(c)}
              className={cn(
                "px-3 py-1.5 rounded-full border text-sm",
                isActive ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-accent",
              )}
              aria-pressed={isActive}
            >
              {c}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
