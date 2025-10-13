import { NextResponse } from "next/server"

const NEWS_API_ENDPOINT = "https://newsapi.org/v2/everything"

// Use a server-only key for security (set in Vars sidebar)
const NEWS_API_KEY = process.env.NEXT_PUBLIC_NEWS_API_KEY

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q") || "technology"
  const category = searchParams.get("category") || ""
  const pageSize = searchParams.get("pageSize") || "20"
  const sortBy = searchParams.get("sortBy") || "publishedAt"
  const language = "en"

  if (!NEWS_API_KEY) {
    return NextResponse.json({ articles: [], error: "Missing NEWS_API_KEY" }, { status: 500 })
  }

  // Keep query simple; map category into q when present
  const effectiveQuery = [q, category].filter(Boolean).join(" ")

  const url = new URL(NEWS_API_ENDPOINT)
  url.searchParams.set("q", effectiveQuery)
  url.searchParams.set("language", language)
  url.searchParams.set("pageSize", pageSize)
  url.searchParams.set("sortBy", sortBy)
  url.searchParams.set("apiKey", NEWS_API_KEY)

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 900 } })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ articles: [], error: text }, { status: res.status })
    }
    const data = await res.json()
    console.log(`Fetched ${data.articles?.length || 0} articles for query "${effectiveQuery}"`)
    return NextResponse.json({ articles: data.articles ?? [] })
  } catch (e: any) {
    return NextResponse.json({ articles: [], error: e?.message ?? "Request failed" }, { status: 500 })
  }
}
