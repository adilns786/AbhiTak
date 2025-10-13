"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { NewsArticle } from "@/types/news"
import { Button } from "@/components/ui/button"
import { useMemo } from "react"

export function NewsCard({ article }: { article: NewsArticle }) {
  const linkHref = useMemo(() => {
    const payload = encodeURIComponent(JSON.stringify(article))
    return `/news/${encodeURIComponent(btoa(article.url))}?data=${payload}`
  }, [article])

  return (
    <Card className="overflow-hidden">
      {article.urlToImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={article.urlToImage || "/placeholder.svg"} alt="Article image" className="h-48 w-full object-cover" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/news-thumbnail.png" alt="Placeholder image" className="h-48 w-full object-cover" />
      )}
      <CardContent className="p-4 space-y-2">
        <h3 className="font-medium text-pretty">{article.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{article.description}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{article.source?.name}</span>
          <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
        </div>
        <div className="pt-2">
          <Button asChild size="sm">
            <a href={linkHref}>Read more</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
