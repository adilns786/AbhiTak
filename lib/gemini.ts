import { GoogleGenerativeAI } from "@google/generative-ai"

let client: GoogleGenerativeAI | null = null

export function getGeminiClient() {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable")
  }
  if (!client) {
    client = new GoogleGenerativeAI(apiKey)
  }
  return client
}

export function getTextModel(modelName = "gemini-1.5-flash") {
  const gemini = getGeminiClient()
  return gemini.getGenerativeModel({ model: modelName })
}
