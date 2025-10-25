"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, ExternalLink, Sparkles } from "lucide-react"
import useSWR from "swr"
import type { NewsArticle } from "@/types/news"

interface ScrapedArticle {
  url: string
  image?: string
  imageDescription?: string
  keyPoints?: string[]
  paragraphs?: string[]
  relatedTopics?: string[]
  relatedTerms?: string[]
}

interface ArticleContentProps {
  article: NewsArticle
  scrapedArticle: ScrapedArticle | null
  lang: string
}

const postFetcher = (url: string, body: any) =>
  fetch(url, { 
    method: "POST", 
    headers: { "Content-Type": "application/json" }, 
    body: JSON.stringify(body) 
  }).then((r) => r.json())

export default function ArticleContent({ article, scrapedArticle, lang }: ArticleContentProps) {
  // Fetch summary
  const { data: summaryData } = useSWR(
    ["summarize", article.url], 
    ([,]) => postFetcher("/api/summarize", { 
      content: scrapedArticle?.paragraphs?.join("\n\n") || article?.content || article?.description || article?.title 
    }),
    { revalidateOnFocus: false }
  )

  // Fetch translation
  const { data: translationData, isLoading: translationLoading } = useSWR(
    lang !== "English" ? ["translate", lang, article.url, summaryData?.summary] : null,
    ([, target]) => {
      const fullContent = [
        `TITLE: ${article?.title}`,
        `CONTENT: ${scrapedArticle?.paragraphs?.join("\n\n") || article?.content || article?.description || ""}`,
        summaryData?.summary ? `SUMMARY: ${summaryData.summary}` : "",
        scrapedArticle?.keyPoints ? `KEY POINTS: ${scrapedArticle.keyPoints.join("\n")}` : ""
      ].filter(Boolean).join("\n\n---\n\n")
      
      return postFetcher("/api/translate", {
        targetLanguage: target,
        content: fullContent
      })
    },
    { revalidateOnFocus: false }
  )

  const getTranslatedContent = () => {
    if (lang === "English" || !translationData?.translation) return null
    
    const parts = translationData.translation.split("---")
    const titlePart = parts.find((p: string) => p.includes("TITLE:"))
    const contentPart = parts.find((p: string) => p.includes("CONTENT:"))
    const keyPointsPart = parts.find((p: string) => p.includes("KEY POINTS:"))
    
    return {
      title: titlePart?.replace("TITLE:", "").trim() || article.title,
      content: contentPart?.replace("CONTENT:", "").trim() || article.content || article.description,
      keyPoints: keyPointsPart?.replace("KEY POINTS:", "").trim().split("\n").filter(Boolean)
    }
  }

  const translated = getTranslatedContent()
  const displayTitle = translated?.title || article.title
  const displayContent = translated?.content || scrapedArticle?.paragraphs?.join("\n\n") || article.content || article.description
  const displayKeyPoints = translated?.keyPoints || scrapedArticle?.keyPoints

  return (
    <motion.div 
      className="lg:col-span-2 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Article Header */}
      <Card className="p-6 md:p-8 space-y-4 shadow-lg">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full font-medium">
            {article.source?.name}
          </span>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Calendar className="size-3.5" />
            <span>{new Date(article.publishedAt || "").toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}</span>
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-balance">
          {translationLoading && lang !== "English" ? (
            <Skeleton className="h-12 w-full" />
          ) : (
            displayTitle
          )}
        </h1>

        {article.author && (
          <p className="text-muted-foreground">
            By <span className="font-medium text-foreground">{article.author}</span>
          </p>
        )}
      </Card>

      {/* Hero Image */}
      {(scrapedArticle?.image || article.urlToImage) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="overflow-hidden shadow-lg">
            <img
              src={scrapedArticle?.image || article.urlToImage}
              alt={article.title}
              className="w-full h-64 md:h-96 object-cover"
              loading="lazy"
            />
            {scrapedArticle?.imageDescription && (
              <div className="p-4 bg-muted/50 text-sm text-muted-foreground italic">
                {scrapedArticle.imageDescription}
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* Key Points */}
      {displayKeyPoints && displayKeyPoints.length > 0 && (
        <Card className="p-6 md:p-8 shadow-lg bg-primary/5">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            Key Points
          </h2>
          <ul className="space-y-3">
            {displayKeyPoints.map((point, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-primary font-bold mt-1">•</span>
                <span className="leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Article Content */}
      <Card className="p-6 md:p-8 shadow-lg">
        <div className="prose prose-lg dark:prose-invert max-w-none">
          {translationLoading && lang !== "English" ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <>
              {scrapedArticle?.paragraphs ? (
                <div className="space-y-4">
                  {scrapedArticle.paragraphs.map((para, i) => (
                    <p key={i} className="text-lg leading-relaxed">{para}</p>
                  ))}
                </div>
              ) : (
                <p className="text-lg leading-relaxed whitespace-pre-wrap">
                  {displayContent}
                </p>
              )}
              
              {article.content && article.content.includes('[+') && !scrapedArticle && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-dashed">
                  <p className="text-sm text-muted-foreground italic">
                    Note: This is a preview. The full article may contain additional content not shown here.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {article.url && (
          <div className="mt-8 pt-6 border-t">
            <Button asChild className="w-full md:w-auto" size="lg">
              <a 
                href={article.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <ExternalLink className="size-4" />
                Read Full Article on {article.source?.name}
              </a>
            </Button>
          </div>
        )}
      </Card>

      {/* Related Topics & Terms */}
      {(scrapedArticle?.relatedTopics || scrapedArticle?.relatedTerms) && (
        <Card className="p-6 shadow-lg">
          {scrapedArticle.relatedTopics && (
            <div className="mb-4">
              <h3 className="font-semibold mb-3">Related Topics</h3>
              <div className="flex flex-wrap gap-2">
                {scrapedArticle.relatedTopics.map((topic, i) => (
                  <span key={i} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
          {scrapedArticle.relatedTerms && (
            <div>
              <h3 className="font-semibold mb-3">Related Terms</h3>
              <div className="flex flex-wrap gap-2">
                {scrapedArticle.relatedTerms.map((term, i) => (
                  <span key={i} className="px-3 py-1 bg-muted rounded-full text-sm">
                    {term}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </motion.div>
  )
}