"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Calendar, ExternalLink, Sparkles, Globe } from "lucide-react"
import type { NewsArticle } from "@/types/news"

const LANGUAGES = [
  "English",
  "Hindi",
  "Bengali",
  "Telugu",
  "Marathi",
  "Tamil",
  "Gujarati",
  "Kannada",
  "Malayalam",
  "Punjabi",
  "Spanish",
  "French",
  "German",
  "Chinese",
  "Japanese",
  "Arabic",
  "Portuguese",
  "Russian"
]

const postFetcher = (url: string, body: any) =>
  fetch(url, { 
    method: "POST", 
    headers: { "Content-Type": "application/json" }, 
    body: JSON.stringify(body) 
  }).then((r) => r.json())

export default function NewsDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const encoded = params?.id as string
  
  const json = searchParams.get("data")
  const article: NewsArticle | null = useMemo(() => {
    if (!json) return null
    try {
      return JSON.parse(decodeURIComponent(json))
    } catch {
      return null
    }
  }, [json])

  const [lang, setLang] = useState<string>("English")

  // Fetch summary
  const { data: summaryData, isLoading: summaryLoading, error: summaryError } = useSWR(
    article ? ["summarize", article.url] : null, 
    ([,]) => postFetcher("/api/summarize", { 
      content: article?.content || article?.description || article?.title 
    }),
    { revalidateOnFocus: false }
  )

  // Fetch translation
  const { data: translationData, isLoading: translationLoading } = useSWR(
    article && lang !== "English" ? ["translate", lang, article.url, summaryData?.summary] : null,
    ([, target]) => {
      const fullContent = [
        `TITLE: ${article?.title}`,
        `CONTENT: ${article?.content || article?.description || ""}`,
        summaryData?.summary ? `SUMMARY: ${summaryData.summary}` : ""
      ].filter(Boolean).join("\n\n---\n\n")
      
      return postFetcher("/api/translate", {
        targetLanguage: target,
        content: fullContent
      })
    },
    { revalidateOnFocus: false }
  )

  if (!article) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="text-center py-20">
          <h1 className="text-2xl font-semibold mb-2">Article not found</h1>
          <p className="text-muted-foreground mb-6">The article you're looking for doesn't exist.</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 size-4" />
            Go Back
          </Button>
        </div>
      </main>
    )
  }

  // Parse translated content
  const getTranslatedContent = () => {
    if (lang === "English" || !translationData?.translation) return null
    
    const parts = translationData.translation.split("---")
    const titlePart = parts.find((p: string) => p.includes("TITLE:"))
    const contentPart = parts.find((p: string) => p.includes("CONTENT:"))
    const summaryPart = parts.find((p: string) => p.includes("SUMMARY:"))
    
    return {
      title: titlePart?.replace("TITLE:", "").trim() || article.title,
      content: contentPart?.replace("CONTENT:", "").trim() || article.content || article.description,
      summary: summaryPart?.replace("SUMMARY:", "").trim() || summaryData?.summary
    }
  }

  const translated = getTranslatedContent()
  const displayTitle = translated?.title || article.title
  const displayContent = translated?.content || article.content || article.description
  const displaySummary = translated?.summary || summaryData?.summary

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button 
            variant="ghost" 
            onClick={() => router.back()} 
            className="mb-6 hover:bg-primary/10"
          >
            <ArrowLeft className="mr-2 size-4" />
            Back to News
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content - Left Column (2/3) */}
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
            {article.urlToImage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="overflow-hidden shadow-lg">
                  <img
                    src={article.urlToImage}
                    alt={article.title}
                    className="w-full h-64 md:h-96 object-cover"
                    loading="lazy"
                  />
                </Card>
              </motion.div>
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
                    <p className="text-lg leading-relaxed whitespace-pre-wrap">
                      {displayContent}
                    </p>
                    
                    {article.content && article.content.includes('[+') && (
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
          </motion.div>

          {/* Sidebar - Right Column (1/3) */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Language Selector */}
            <Card className="p-6 shadow-lg sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="size-5 text-primary" />
                <h3 className="font-semibold text-lg">Language</h3>
              </div>
              
              <Select value={lang} onValueChange={setLang}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {translationLoading && lang !== "English" && (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Translating to {lang}...</span>
                </div>
              )}
            </Card>

            {/* AI Summary */}
            <Card className="p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="size-5 text-primary" />
                <h3 className="font-semibold text-lg">AI Summary</h3>
              </div>

              {summaryLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : summaryError ? (
                <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                  Failed to generate summary. Please try again.
                </div>
              ) : displaySummary ? (
                <ul className="space-y-2.5 text-sm leading-relaxed">
                  {displaySummary.split("\n").filter(Boolean).map((line: string, i: number) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{line.replace(/^[-•*]\s?/, "")}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Generating summary...</span>
                </div>
              )}
            </Card>

            {/* Article Metadata */}
            <Card className="p-6 shadow-lg">
              <h3 className="font-semibold text-lg mb-4">Article Info</h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-muted-foreground mb-1">Source</div>
                  <div className="font-medium">{article.source?.name}</div>
                </div>
                
                {article.author && (
                  <div>
                    <div className="text-muted-foreground mb-1">Author</div>
                    <div className="font-medium">{article.author}</div>
                  </div>
                )}
                
                <div>
                  <div className="text-muted-foreground mb-1">Published</div>
                  <div className="font-medium">
                    {new Date(article.publishedAt || "").toLocaleString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </main>
  )
}