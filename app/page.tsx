"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import { CategoryFilter } from "@/components/news/category-filter"
import { SearchBar } from "@/components/layout/search-bar"
import { SwipeableNews } from "@/components/news/swipeable-news"
import { NewsGrid } from "@/components/news/news-grid"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { Button } from "@/components/ui/button"
import { Grid, PanelsTopLeft } from "lucide-react"
import { CATEGORIES } from "@/lib/constants"
import type { NewsArticle } from "@/types/news"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function HomePage() {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<string>("All")
  const [view, setView] = useState<"swipe" | "grid">("swipe")

  const params = useMemo(() => {
    const usp = new URLSearchParams()
    if (query) usp.set("q", query)
    if (category && category !== "All") usp.set("category", category)
    usp.set("pageSize", "20")
    usp.set("sortBy", "publishedAt")
    return usp.toString()
  }, [query, category])

  const { data, error, isLoading } = useSWR<{ articles: NewsArticle[] }>(`/api/news?${params}`, fetcher, {
    revalidateOnFocus: false,
  })

  return (
    <main className="min-h-dvh">
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-md bg-primary text-primary-foreground grid place-items-center font-mono text-xs">
              AI
            </div>
            <h1 className="text-lg font-semibold text-balance">AI Tech News</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={view === "swipe" ? "default" : "secondary"}
              size="sm"
              onClick={() => setView("swipe")}
              aria-pressed={view === "swipe"}
            >
              <PanelsTopLeft className="mr-2 size-4" />
              Swipe
            </Button>
            <Button
              variant={view === "grid" ? "default" : "secondary"}
              size="sm"
              onClick={() => setView("grid")}
              aria-pressed={view === "grid"}
            >
              <Grid className="mr-2 size-4" />
              Grid
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-5 space-y-4">
        <SearchBar onChange={setQuery} />
        <CategoryFilter categories={["All", ...CATEGORIES]} active={category} onSelect={setCategory} />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        {error && <div className="text-sm text-destructive">Failed to load news. Please try again.</div>}
        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg border p-4">
                <div className="h-48 w-full rounded-md bg-muted mb-3" />
                <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && data?.articles?.length === 0 && (
          <p className="text-sm text-muted-foreground">No results. Try a different search.</p>
        )}

        {!isLoading &&
          data?.articles &&
          (view === "swipe" ? <SwipeableNews articles={data.articles} /> : <NewsGrid articles={data.articles} />)}
      </section>
    </main>
  )
}
