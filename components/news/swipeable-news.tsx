"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { NewsArticle } from "@/types/news"
import { NewsCard } from "./news-card"
import { Button } from "@/components/ui/button"

export function SwipeableNews({ articles }: { articles: NewsArticle[] }) {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)

  const paginate = (dir: 1 | -1) => {
    setDirection(dir)
    setIndex((i) => {
      const next = i + dir
      if (next < 0) return articles.length - 1
      if (next >= articles.length) return 0
      return next
    })
  }

  const current = articles[index]

  return (
    <div className="relative mx-auto max-w-2xl">
      <div className="flex items-center justify-between mb-3">
        <Button variant="secondary" onClick={() => paginate(-1)} aria-label="Previous article">
          Prev
        </Button>
        <div className="text-sm text-muted-foreground">
          {index + 1} / {articles.length}
        </div>
        <Button variant="secondary" onClick={() => paginate(1)} aria-label="Next article">
          Next
        </Button>
      </div>

      <div className="h-[28rem]">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={current?.url}
            className="h-full"
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 60 : -60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -60 : 60 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x > 120) paginate(-1)
              else if (info.offset.x < -120) paginate(1)
            }}
          >
            <NewsCard article={current} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
