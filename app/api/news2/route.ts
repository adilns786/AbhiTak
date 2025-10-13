// app/api/news/route.ts
import { NextRequest, NextResponse } from "next/server"

const NEWSDATA_API_KEY = process.env.NEXT_PUBLIC_NEWSDATA_API_KEY || ""
const NEWSDATA_BASE_URL = "https://newsdata.io/api/1/latest"

// NewsData.io response type
interface NewsDataArticle {
  article_id: string
  title: string
  link: string
  keywords?: string[]
  creator?: string[]
  description: string | null
  content: string | null
  pubDate: string
  pubDateTZ?: string
  image_url: string | null
  video_url?: string | null
  source_id: string
  source_name: string
  source_priority?: number
  source_url?: string
  source_icon?: string | null
  language: string
  country?: string[]
  category?: string[]
  sentiment?: string
  sentiment_stats?: {
    positive: number
    neutral: number
    negative: number
  }
  ai_tag?: string[]
  ai_region?: string[]
  ai_org?: string | null
  ai_summary?: string
  ai_content?: string
  duplicate?: boolean
}

interface NewsDataResponse {
  status: string
  totalResults: number
  results: NewsDataArticle[]
  nextPage?: string
}

// Your NewsArticle type
export interface NewsArticle {
  source: {
    id: string | null
    name: string
  }
  author: string | null
  title: string
  description: string
  url: string
  urlToImage: string | null
  publishedAt: string
  content: string
}

// Transform NewsData.io article to your NewsArticle format
function transformArticle(article: NewsDataArticle): NewsArticle {
  return {
    source: {
      id: article.source_id || null,
      name: article.source_name || "Unknown Source"
    },
    author: article.creator?.[0] || null,
    title: article.title || "Untitled",
    description: article.description || article.ai_summary || article.content?.substring(0, 200) || "",
    url: article.link,
    urlToImage: article.image_url || null,
    publishedAt: article.pubDate,
    content: article.content || article.description || article.ai_summary || ""
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    // Extract query parameters
    const query = searchParams.get("q") || searchParams.get("query")
    const category = searchParams.get("category")
    const country = searchParams.get("country") || "au,us,in" // Default: Australia, USA, India
    const language = searchParams.get("language") || "en"
    const page = searchParams.get("page") || null
    
    // Build API URL with parameters
    const params = new URLSearchParams({
      apikey: NEWSDATA_API_KEY,
      language: language
    })
    
    // Add optional parameters
    if (query) {
      params.append("q", query)
    }
    
    if (category) {
      params.append("category", category)
    }
    
    if (country) {
      params.append("country", country)
    }
    
    if (page) {
      params.append("page", page)
    }
    
    const apiUrl = `${NEWSDATA_BASE_URL}?${params.toString()}`
    
    // Fetch from NewsData.io
    const response = await fetch(apiUrl, {
      next: { revalidate: 900 } // Cache for 15 minutes
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error("NewsData.io API error:", response.status, errorText)
      
      return NextResponse.json(
        { 
          error: "Failed to fetch news",
          details: response.statusText,
          articles: []
        },
        { status: response.status }
      )
    }
    
    const data: NewsDataResponse = await response.json()
    
    // Check if API returned success
    if (data.status !== "success") {
      return NextResponse.json(
        { 
          error: "API returned error status",
          articles: []
        },
        { status: 500 }
      )
    }
    
    // Transform articles to your format
    const articles: NewsArticle[] = data.results
      .filter(article => article.title && article.link) // Filter out invalid articles
      .map(transformArticle)
    
    return NextResponse.json({
      articles,
      totalResults: data.totalResults,
      nextPage: data.nextPage || null
    })
    
  } catch (error) {
    console.error("Error fetching news:", error)
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        articles: []
      },
      { status: 500 }
    )
  }
}

// Optional: Add POST method for more complex queries
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, category, country, language, page } = body
    
    // Build API URL with parameters from body
    const params = new URLSearchParams({
      apikey: NEWSDATA_API_KEY,
      language: language || "en"
    })
    
    if (query) params.append("q", query)
    if (category) params.append("category", category)
    if (country) params.append("country", country || "au,us,in")
    if (page) params.append("page", page)
    
    const apiUrl = `${NEWSDATA_BASE_URL}?${params.toString()}`
    
    const response = await fetch(apiUrl)
    
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch news", articles: [] },
        { status: response.status }
      )
    }
    
    const data: NewsDataResponse = await response.json()
    
    if (data.status !== "success") {
      return NextResponse.json(
        { error: "API returned error status", articles: [] },
        { status: 500 }
      )
    }
    
    const articles: NewsArticle[] = data.results
      .filter(article => article.title && article.link)
      .map(transformArticle)
    
    return NextResponse.json({
      articles,
      totalResults: data.totalResults,
      nextPage: data.nextPage || null
    })
    
  } catch (error) {
    console.error("Error fetching news:", error)
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        articles: []
      },
      { status: 500 }
    )
  }
}