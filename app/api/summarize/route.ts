import { NextResponse } from "next/server"
import { getTextModel } from "../../../lib/gemini"

async function generateWithRetry(prompt: string, attempts = 3) {
  const model = getTextModel("gemini-pro")
  let error: any
  for (let i = 0; i < attempts; i++) {
    try {
      const result = await model.generateContent(prompt)
      return result.response.text()
    } catch (e: any) {
      error = e
      const delay = Math.min(1000 * Math.pow(2, i), 4000)
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw error
}

export async function POST(req: Request) {
  try {
    const { content } = await req.json()
    if (!content) {
      return NextResponse.json({ error: "Missing content" }, { status: 400 })
    }

    const prompt = [
      "You are a professional news summarizer.",
      "Provide a concise 3-4 bullet point summary of the following news article, highlighting the key facts, main developments, and implications.",
      "Keep each point clear and factual.",
      "",
      `Article: ${content}`,
      "",
      'Return the result as 3-4 lines, each starting with a bullet like "- ".',
    ].join("\n")

    const text = await generateWithRetry(prompt)
    return NextResponse.json({ summary: text })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Summarization failed" }, { status: 500 })
  }
}
