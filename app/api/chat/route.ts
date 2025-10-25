import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

// Retry-safe generator (similar to your translation route)
async function generateWithRetry(prompt: string, attempts = 3) {
  let error: any

  for (let i = 0; i < attempts; i++) {
    try {
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      return text
    } catch (e: any) {
      error = e
      const delay = Math.min(1000 * Math.pow(2, i), 4000) // exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw error
}

export async function POST(req: Request) {
  try {
    const { message, article } = await req.json()

    if (!message) {
      return NextResponse.json({ response: "No input provided." }, { status: 400 })
    }

    // Build an intelligent context-aware prompt
    const prompt = `
You are an AI news assistant. The user is chatting about the following article:

Title: ${article?.title || "Unknown"}
URL: ${article?.url || "N/A"}
Date: ${article?.date || "N/A"}
Description: ${article?.description || "No summary provided."}

User message: "${message}"

Respond naturally and informatively based on the article context.
If the message is unrelated to the article, respond helpfully but stay concise.
Do not fabricate scientific facts; only generalize responsibly.
    `.trim()

    const aiResponse = await generateWithRetry(prompt)

    return NextResponse.json({ response: aiResponse })
  } catch (e: any) {
    console.error("Chatbot Error:", e)
    return NextResponse.json(
      { response: e?.message ?? "Chat temporarily unavailable." },
      { status: 500 }
    )
  }
}
