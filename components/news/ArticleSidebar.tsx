"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Globe, Sparkles, MessageSquare, ThumbsUp } from "lucide-react"
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

interface ArticleSidebarProps {
  article: NewsArticle
  scrapedArticle: ScrapedArticle | null
  lang: string
  setLang: (lang: string) => void
  onOpenChat: () => void
  onOpenFeedback: () => void
}

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

export default function ArticleSidebar({ 
  article, 
  scrapedArticle, 
  lang, 
  setLang, 
  onOpenChat, 
  onOpenFeedback 
}: ArticleSidebarProps) {
  // Fetch summary
  const { data: summaryData, isLoading: summaryLoading, error: summaryError } = useSWR(
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

  const getTranslatedSummary = () => {
    if (lang === "English" || !translationData?.translation) return summaryData?.summary
    
    const parts = translationData.translation.split("---")
    const summaryPart = parts.find((p: string) => p.includes("SUMMARY:"))
    
    return summaryPart?.replace("SUMMARY:", "").trim() || summaryData?.summary
  }

  const displaySummary = getTranslatedSummary()

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {/* Language Selector */}
      <Card className="p-6 shadow-lg  top-6">
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

      {/* Chat with Article */}
      <Card className="p-6 shadow-lg">
        <Button 
          onClick={onOpenChat} 
          className="w-full"
          variant="outline"
        >
          <MessageSquare className="mr-2 size-4" />
          Chat with Article
        </Button>
      </Card>

      {/* Feedback Button */}
      <Card className="p-6 shadow-lg">
        <Button 
          onClick={onOpenFeedback} 
          className="w-full"
          variant="outline"
        >
          <ThumbsUp className="mr-2 size-4" />
          Give Feedback
        </Button>
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
  )
}