"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { NewsArticle } from "@/types/news"
import { Button } from "@/components/ui/button"
import { useMemo } from "react"
import Link from "next/link";

export function NewsCard({ article }: { article: NewsArticle }) {
  const linkHref = useMemo(() => {
    const payload = encodeURIComponent(JSON.stringify(article))
    return `/news/${encodeURIComponent(btoa(article.url))}?data=${payload}`
  }, [article])

  return (
    <Link href={linkHref} target="_blank" rel="noopener noreferrer" className="block group">
      <Card
        className="
          overflow-hidden transition-all duration-300 
          hover:shadow-lg hover:scale-[1.01] cursor-pointer
        "
      >
        {article.urlToImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.urlToImage || "/placeholder.svg"}
            alt="Article image"
            className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : null}

        <CardContent className="p-4 space-y-2">
          <h3 className="font-medium text-pretty group-hover:text-primary">
            {article.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {article.description}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{article.source?.name}</span>
            <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}