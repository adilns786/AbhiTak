"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star, ThumbsUp, X } from "lucide-react"
import type { NewsArticle } from "@/types/news"

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  article: NewsArticle
  lang: string
}

export default function FeedbackModal({ isOpen, onClose, article, lang }: FeedbackModalProps) {
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [summaryRating, setSummaryRating] = useState(0)
  const [translationRating, setTranslationRating] = useState(0)
  const [accuracyRating, setAccuracyRating] = useState(0)
  const [feedbackComments, setFeedbackComments] = useState("")

  const handleFeedbackSubmit = async () => {
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleUrl: article.url,
          articleTitle: article.title,
          summaryRating,
          translationRating,
          accuracyRating,
          comments: feedbackComments,
          language: lang,
          timestamp: new Date().toISOString()
        })
      })
      setFeedbackSubmitted(true)
      setTimeout(() => {
        onClose()
        // Reset state after closing
        setTimeout(() => {
          setFeedbackSubmitted(false)
          setSummaryRating(0)
          setTranslationRating(0)
          setAccuracyRating(0)
          setFeedbackComments("")
        }, 300)
      }, 2000)
    } catch (error) {
      console.error("Failed to submit feedback:", error)
    }
  }

  const StarRating = ({ rating, setRating }: { rating: number, setRating: (n: number) => void }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          onClick={() => setRating(n)}
          className="transition-transform hover:scale-110"
          type="button"
        >
          <Star className={`size-6 ${n <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
        </button>
      ))}
    </div>
  )

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
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-background rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Feedback</h2>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="size-4" />
                </Button>
              </div>

              {feedbackSubmitted ? (
                <div className="py-8 text-center">
                  <div className="size-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ThumbsUp className="size-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Thank you!</h3>
                  <p className="text-muted-foreground">Your feedback helps us improve.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div>
                      <label className="block font-medium mb-2">Summary Quality</label>
                      <StarRating rating={summaryRating} setRating={setSummaryRating} />
                    </div>

                    <div>
                      <label className="block font-medium mb-2">Translation Quality</label>
                      <StarRating rating={translationRating} setRating={setTranslationRating} />
                    </div>

                    <div>
                      <label className="block font-medium mb-2">Overall Accuracy</label>
                      <StarRating rating={accuracyRating} setRating={setAccuracyRating} />
                    </div>

                    <div>
                      <label className="block font-medium mb-2">Additional Comments</label>
                      <Textarea
                        value={feedbackComments}
                        onChange={(e) => setFeedbackComments(e.target.value)}
                        placeholder="Share your thoughts..."
                        rows={4}
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleFeedbackSubmit} 
                    className="w-full"
                    disabled={!summaryRating && !translationRating && !accuracyRating}
                  >
                    Submit Feedback
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}