"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import { motion, AnimatePresence } from "framer-motion"
import { CategoryFilter } from "@/components/news/category-filter"
import { SearchBar } from "@/components/layout/search-bar"
import { SwipeableNews } from "@/components/news/swipeable-news"
import { NewsGrid } from "@/components/news/news-grid"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { Button } from "@/components/ui/button"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Grid, PanelsTopLeft, Newspaper, Globe } from "lucide-react"
import { CATEGORIES } from "@/lib/constants"
import type { NewsArticle } from "@/types/news"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type NewsSource = "newsapi" | "newsdata"

const NEWS_SOURCES = [
  { 
    value: "newsapi" as const, 
    label: "NewsAPI", 
    icon: Newspaper,
    endpoint: "/api/news"
  },
  { 
    value: "newsdata" as const, 
    label: "NewsData.io", 
    icon: Globe,
    endpoint: "/api/news2"
  }
]

export default function HomePage() {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<string>("All")
  const [view, setView] = useState<"swipe" | "grid">("grid")
  const [source, setSource] = useState<NewsSource>("newsdata")

  const params = useMemo(() => {
    const usp = new URLSearchParams()
    if (query) usp.set("q", query)
    if (category && category !== "All") {
      usp.set("category", category.toLowerCase())
    }
    usp.set("pageSize", "20")
    usp.set("sortBy", "publishedAt")
    return usp.toString()
  }, [query, category])

  const endpoint = NEWS_SOURCES.find(s => s.value === source)?.endpoint || "/api/news2"
  
  const { data, error, isLoading } = useSWR<{ articles: NewsArticle[] }>(
    `${endpoint}?${params}`, 
    fetcher, 
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  )

  const currentSource = NEWS_SOURCES.find(s => s.value === source)
  const SourceIcon = currentSource?.icon || Newspaper

  return (
    <main className="min-h-dvh bg-gradient-to-b from-background to-muted/20">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
  <div className="mx-auto max-w-7xl px-4 py-3">
    <div className="flex items-center justify-between flex-wrap gap-4">
      
      {/* Left Section — Logo + Name */}
      <div className="flex items-center gap-3">
        <motion.div
          className="size-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground grid place-items-center font-bold text-sm shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          AT
        </motion.div>
        <div>
          <h1 className="text-lg font-bold leading-tight">AbhiTak News</h1>
          <p className="text-xs text-muted-foreground">Powered by AI • Multiple Sources</p>
        </div>
      </div>

      {/* Right Section — View Toggle, Source Select, Theme */}
      <div className="flex items-center gap-3 flex-wrap justify-end">

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          <Button
            variant={view === "swipe" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("swipe")}
            aria-pressed={view === "swipe"}
            className="h-8"
          >
            <PanelsTopLeft className="mr-1.5 size-4" />
            <span className="hidden sm:inline">Swipe</span>
          </Button>
          <Button
            variant={view === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("grid")}
            aria-pressed={view === "grid"}
            className="h-8"
          >
            <Grid className="mr-1.5 size-4" />
            <span className="hidden sm:inline">Grid</span>
          </Button>
        </div>

        {/* Source Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:inline">Source:</span>
          <Select value={source} onValueChange={(val) => setSource(val as NewsSource)}>
            <SelectTrigger className="w-[160px] h-9">
              <div className="flex items-center gap-2">
                <SourceIcon className="size-4" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {NEWS_SOURCES.map((src) => {
                const Icon = src.icon
                return (
                  <SelectItem key={src.value} value={src.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="size-4" />
                      <span>{src.label}</span>
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />
      </div>
    </div>
  </div>
</header>

      {/* Filters Section */}
      {/* <section className="mx-auto max-w-7xl px-4 py-5 space-y-4">
        <SearchBar onChange={setQuery} />
        <CategoryFilter 
          categories={["All", ...CATEGORIES.map(c => c.label)]} 
          active={category} 
          onSelect={setCategory} 
        />
      </section> */}

      {/* News Content */}
      <section className="mx-auto max-w-7xl px-4 pb-12">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center"
            >
              <p className="text-sm text-destructive font-medium">
                Failed to load news from {currentSource?.label}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Please try again or switch to a different source
              </p>
            </motion.div>
          )}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div 
                  key={i} 
                  className="rounded-lg border p-4 bg-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="h-48 w-full rounded-md bg-muted/50 mb-3 animate-pulse" />
                  <div className="h-4 bg-muted/50 rounded w-2/3 mb-2 animate-pulse" />
                  <div className="h-4 bg-muted/50 rounded w-1/2 animate-pulse" />
                </motion.div>
              ))}
            </motion.div>
          )}

          {!isLoading && data?.articles?.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-16 rounded-lg border bg-card/50"
            >
              <div className="size-16 rounded-full bg-muted mx-auto mb-4 grid place-items-center">
                <Newspaper className="size-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium mb-1">No articles found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filters, or switch to a different news source
              </p>
            </motion.div>
          )}

          {!isLoading && data?.articles && data.articles.length > 0 && (
            <motion.div
              key={`${source}-${view}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {view === "swipe" ? (
                <SwipeableNews articles={data.articles} />
              ) : (
                <NewsGrid articles={data.articles} />
              )}
              
              {/* Results count */}
              <div className="text-center mt-8 text-sm text-muted-foreground">
                Showing {data.articles.length} articles from {currentSource?.label}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  )
}