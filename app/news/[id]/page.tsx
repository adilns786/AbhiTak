"use client"

import { useMemo, useState, useEffect } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import type { NewsArticle } from "@/types/news"
import ArticleSidebar from "@/components/news/ArticleSidebar"
import ArticleContent from "@/components/news/ArticleContent"
import ChatModal from "@/components/news/ChatModal"
import FeedbackModal from "@/components/news/FeedbackModal"

interface ScrapedArticle {
  url: string
  image?: string
  imageDescription?: string
  keyPoints?: string[]
  paragraphs?: string[]
  relatedTopics?: string[]
  relatedTerms?: string[]
}

export default function NewsDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  
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
  const [scrapedArticle, setScrapedArticle] = useState<ScrapedArticle | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [showChat, setShowChat] = useState(false)

  // Check localStorage cache and fetch scraped article if URL contains "sciencedaily"
  useEffect(() => {
    if (!article?.url) return
    
    const isScienceDaily = article.url.toLowerCase().includes("sciencedaily")
    if (!isScienceDaily) return

    const cacheKey = `scraped_${article.url}`
    const cached = localStorage.getItem(cacheKey)
    
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        if (parsed.timestamp && Date.now() - parsed.timestamp < 86400000) {
          setScrapedArticle(parsed.data)
          return
        }
      } catch (e) {
        localStorage.removeItem(cacheKey)
      }
    }

    const fetchScrapedArticle = async () => {
      try {
        const response = await fetch("/api/scrape", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: article.url })
        })
        
        if (response.ok) {
          const data = await response.json()
          setScrapedArticle(data)
          localStorage.setItem(cacheKey, JSON.stringify({
            data,
            timestamp: Date.now()
          }))
        }
      } catch (error) {
        console.error("Failed to scrape article:", error)
      }
    }

    fetchScrapedArticle()
  }, [article?.url])

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

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
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
          <ArticleContent 
            article={article}
            scrapedArticle={scrapedArticle}
            lang={lang}
          />

          <ArticleSidebar
            article={article}
            scrapedArticle={scrapedArticle}
            lang={lang}
            setLang={setLang}
            onOpenChat={() => setShowChat(true)}
            onOpenFeedback={() => setShowFeedback(true)}
          />
        </div>
      </div>

      <ChatModal
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        article={article}
        scrapedArticle={scrapedArticle}
        lang={lang}
      />

      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        article={article}
        lang={lang}
      />
    </main>
  )
}