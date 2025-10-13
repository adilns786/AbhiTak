import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!)

// Retry helper for transient errors or rate limits
async function generateWithRetry(prompt: string, attempts = 3) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
  let lastError: any

  for (let i = 0; i < attempts; i++) {
    try {
      const result = await model.generateContent(prompt)
      return result.response.text()
    } catch (e: any) {
      lastError = e
      const delay = Math.min(1000 * Math.pow(2, i), 4000) // exponential backoff
      await new Promise((r) => setTimeout(r, delay))
    }
  }

  throw lastError
}

// POST /api/ai
export async function POST(req: Request) {
  try {
    const { content } = await req.json()
    if (!content) {
      return NextResponse.json({ error: "Missing content" }, { status: 400 })
    }

    const prompt = [
      "You are a professional news summarizer.",
      "Provide a concise 3–4 bullet point summary of the following news article, highlighting the key facts, main developments, and implications.",
      "Keep each point clear and factual.",
      "",
      `Article:\n${content}`,
      "",
      'Return the result as 3–4 lines, each starting with a bullet like "- ".'
    ].join("\n")

    const text = await generateWithRetry(prompt)
    return NextResponse.json({ summary: text })
  } catch (e: any) {
    console.error("AI summarization error:", e)
    return NextResponse.json(
      { error: e?.message ?? "Summarization failed" },
      { status: 500 }
    )
  }
}
