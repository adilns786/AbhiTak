"use client";

import { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Grid, PanelsTopLeft, Newspaper, Globe } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SwipeableNews } from "@/components/news/swipeable-news";
import { NewsGrid } from "@/components/news/news-grid";
import type { NewsArticle } from "@/types/news";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type NewsSource = "newsapi" | "newsdata" | "sciencedaily";

const NEWS_SOURCES = [
  {
    value: "newsapi" as const,
    label: "NewsAPI",
    icon: Newspaper,
    endpoint: "/api/news",
  },
  {
    value: "newsdata" as const,
    label: "NewsData.io",
    icon: Globe,
    endpoint: "/api/news2",
  },
  {
    value: "sciencedaily" as const,
    label: "Science Daily",
    icon: Globe,
    endpoint: "/api/sciencedaily",
  },
];

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [view, setView] = useState<"swipe" | "grid">("grid");
  const [source, setSource] = useState<NewsSource>("sciencedaily");
  const [cachedData, setCachedData] = useState<{ articles: NewsArticle[] } | null>(null);

  const params = useMemo(() => {
    const usp = new URLSearchParams();
    if (query) usp.set("q", query);
    if (category && category !== "All") usp.set("category", category.toLowerCase());
    usp.set("pageSize", "20");
    usp.set("sortBy", "publishedAt");
    return usp.toString();
  }, [query, category]);

  const endpoint =
    NEWS_SOURCES.find((s) => s.value === source)?.endpoint || "/api/news2";

  // ⏰ LocalStorage key for caching ScienceDaily data
  const CACHE_KEY = "sciencedaily_cache_v1";

  const shouldUseCache = source === "sciencedaily";

  // 🧠 Load cached data if available
  useEffect(() => {
    if (shouldUseCache) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { date, data } = JSON.parse(cached);
        const today = new Date().toDateString();
        if (date === today) {
          setCachedData(data);
        }
      }
    }
  }, [source]);

  // 🚀 SWR for non-ScienceDaily sources OR refresh ScienceDaily when cache expired
  const { data, error, isLoading } = useSWR<{ articles: NewsArticle[] }>(
    !shouldUseCache || !cachedData ? `${endpoint}?${params}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      onSuccess: (fetchedData) => {
        if (shouldUseCache) {
          const today = new Date().toDateString();
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ date: today, data: fetchedData })
          );
          setCachedData(fetchedData);
        }
      },
    }
  );

  const displayedData =
    shouldUseCache && cachedData ? cachedData : data || { articles: [] };

  const currentSource = NEWS_SOURCES.find((s) => s.value === source);
  const SourceIcon = currentSource?.icon || Newspaper;

  return (
    <main className="min-h-dvh bg-gradient-to-b from-background to-muted/20">
      {/* Header Section */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <motion.div
                className="size-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground grid place-items-center font-bold text-sm shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                AT
              </motion.div>
              <div>
                <h1 className="text-lg font-bold leading-tight">
                  AbhiTak News
                </h1>
                <p className="text-xs text-muted-foreground">
                  Powered by AI • Multiple Sources
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap justify-end">
              {/* View Toggle */}
              <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                <Button
                  variant={view === "swipe" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setView("swipe")}
                >
                  <PanelsTopLeft className="mr-1.5 size-4" />
                  <span className="hidden sm:inline">Swipe</span>
                </Button>
                <Button
                  variant={view === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setView("grid")}
                >
                  <Grid className="mr-1.5 size-4" />
                  <span className="hidden sm:inline">Grid</span>
                </Button>
              </div>

              {/* Source Selector */}
              <Select
                value={source}
                onValueChange={(val) => {
                  setSource(val as NewsSource);
                  setCachedData(null);
                }}
              >
                <SelectTrigger className="w-[160px] h-9">
                  <div className="flex items-center gap-2">
                    <SourceIcon className="size-4" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {NEWS_SOURCES.map((src) => {
                    const Icon = src.icon;
                    return (
                      <SelectItem key={src.value} value={src.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="size-4" />
                          <span>{src.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* News Section */}
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
            </motion.div>
          )}

          {isLoading && !cachedData && (
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

          {!isLoading && displayedData.articles?.length > 0 && (
            <motion.div
              key={`${source}-${view}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {view === "swipe" ? (
                <SwipeableNews articles={displayedData.articles} />
              ) : (
                <NewsGrid articles={displayedData.articles} />
              )}
              <div className="text-center mt-8 text-sm text-muted-foreground">
                Showing {displayedData.articles.length} articles from{" "}
                {currentSource?.label}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}
