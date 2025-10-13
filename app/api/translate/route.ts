import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

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
      const delay = Math.min(1000 * Math.pow(2, i), 4000)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw error
}

export async function POST(req: Request) {
  try {
    const { content, targetLanguage } = await req.json()

    if (!content || !targetLanguage) {
      return NextResponse.json(
        { error: "Missing content or targetLanguage" },
        { status: 400 }
      )
    }

    const prompt = `
Translate the following text to ${targetLanguage}.
Maintain the original meaning, tone, and formatting.
Provide only the translation without any additional explanation.

${content}
    `.trim()

    const translation = await generateWithRetry(prompt)

    return NextResponse.json({ translation })
  } catch (e: any) {
    console.error("Translation Error:", e)
    return NextResponse.json(
      { error: e?.message ?? "Translation failed" },
      { status: 500 }
    )
  }
}
