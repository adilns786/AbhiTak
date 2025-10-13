"use client"

import type { NewsArticle } from "@/types/news"
import { NewsCard } from "./news-card"
import { motion } from "framer-motion"

export function NewsGrid({ articles }: { articles: NewsArticle[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((a, idx) => (
        <motion.div
          key={a.url}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.04, duration: 0.2 }}
        >
          <NewsCard article={a} />
        </motion.div>
      ))}
    </div>
  )
}
