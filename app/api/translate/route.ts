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
    const { content, targetLanguage } = await req.json()
    if (!content || !targetLanguage) {
      return NextResponse.json({ error: "Missing content or targetLanguage" }, { status: 400 })
    }

    const prompt = [
      `Translate the following text to ${targetLanguage}.`,
      "Maintain the original meaning, tone, and formatting.",
      "Provide only the translation without any additional explanation.",
      "",
      content,
    ].join("\n")

    const text = await generateWithRetry(prompt)
    return NextResponse.json({ translation: text })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Translation failed" }, { status: 500 })
  }
}
