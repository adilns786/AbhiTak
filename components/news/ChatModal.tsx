"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageSquare, Send, X } from "lucide-react"
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

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

interface ChatModalProps {
  isOpen: boolean
  onClose: () => void
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

export default function ChatModal({ isOpen, onClose, article, scrapedArticle, lang }: ChatModalProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [isChatLoading, setIsChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Fetch summary and translation data
  const { data: summaryData } = useSWR(
    ["summarize", article.url], 
    ([,]) => postFetcher("/api/summarize", { 
      content: scrapedArticle?.paragraphs?.join("\n\n") || article?.content || article?.description || article?.title 
    }),
    { revalidateOnFocus: false }
  )

  const { data: translationData } = useSWR(
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

  const getDisplayContent = () => {
    if (lang === "English" || !translationData?.translation) {
      return {
        title: article.title,
        content: scrapedArticle?.paragraphs?.join("\n\n") || article.content || article.description,
        summary: summaryData?.summary,
        keyPoints: scrapedArticle?.keyPoints
      }
    }
    
    const parts = translationData.translation.split("---")
    const titlePart = parts.find((p: string) => p.includes("TITLE:"))
    const contentPart = parts.find((p: string) => p.includes("CONTENT:"))
    const summaryPart = parts.find((p: string) => p.includes("SUMMARY:"))
    const keyPointsPart = parts.find((p: string) => p.includes("KEY POINTS:"))
    
    return {
      title: titlePart?.replace("TITLE:", "").trim() || article.title,
      content: contentPart?.replace("CONTENT:", "").trim() || article.content || article.description,
      summary: summaryPart?.replace("SUMMARY:", "").trim() || summaryData?.summary,
      keyPoints: keyPointsPart?.replace("KEY POINTS:", "").trim().split("\n").filter(Boolean) || scrapedArticle?.keyPoints
    }
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return

    const userMessage: ChatMessage = { role: "user", content: chatInput }
    setChatMessages(prev => [...prev, userMessage])
    setChatInput("")
    setIsChatLoading(true)

    try {
      const displayContent = getDisplayContent()
      
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          article: {
            title: displayContent.title,
            content: displayContent.content,
            summary: displayContent.summary,
            keyPoints: displayContent.keyPoints,
            url: article.url
          },
          message: chatInput,
          history: chatMessages
        })
      })

      const data = await response.json()
      const assistantMessage: ChatMessage = { 
        role: "assistant", 
        content: data.response || "Sorry, I couldn't process that request." 
      }
      setChatMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error("Chat error:", error)
      setChatMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Sorry, there was an error processing your message." 
      }])
    } finally {
      setIsChatLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-background rounded-lg shadow-xl max-w-2xl w-full h-[600px] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="size-5 text-primary" />
                <h2 className="text-xl font-bold">Chat with Article</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="size-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="size-12 mx-auto mb-4 opacity-50" />
                  <p>Ask me anything about this article!</p>
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex gap-1">
                      <div className="size-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="size-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="size-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about the article..."
                  disabled={isChatLoading}
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!chatInput.trim() || isChatLoading}
                >
                  <Send className="size-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}