"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import type { NewsArticle } from "@/types/news"
import { LANGUAGES } from "@/lib/constants"

const postFetcher = (url: string, body: any) =>
  fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(
    (r) => r.json(),
  )

export default function NewsDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const encoded = params?.id as string
  // We pass the article via query to avoid refetching by ID (NewsAPI lacks stable IDs)
  const json = searchParams.get("data")
  const article: NewsArticle | null = useMemo(() => {
    if (!json) return null
    try {
      return JSON.parse(decodeURIComponent(json))
    } catch {
      return null
    }
  }, [json])

  const [lang, setLang] = useState<string>("English")

  const { data: summaryData } = useSWR(article ? ["summarize", article.url] : null, ([,]) =>
    postFetcher("/api/summarize", { content: article?.content || article?.description || article?.title }),
  )

  const { data: translationData } = useSWR(
    article && lang !== "English" ? ["translate", lang, article.url, summaryData?.summary] : null,
    ([, target]) =>
      postFetcher("/api/translate", {
        targetLanguage: target,
        content: [article?.title, article?.content || article?.description || "", summaryData?.summary || ""].join(
          "\n\n---\n\n",
        ),
      }),
  )

  const translated = lang === "English" ? null : translationData?.translation

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      <Button variant="ghost" onClick={() => router.back()} aria-label="Go back">
        <ArrowLeft className="mr-2 size-4" />
        Back
      </Button>

      <article className="space-y-4">
        <h1 className="text-2xl md:text-3xl font-semibold text-balance">
          {translated ? "Translated Title" : article?.title}
        </h1>
        <div className="text-sm text-muted-foreground">
          {article?.source?.name} • {new Date(article?.publishedAt || "").toLocaleString()}
        </div>
        {article?.urlToImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.urlToImage || "/placeholder.svg"}
            alt="Article hero image"
            className="w-full h-64 object-cover rounded-lg border"
          />
        )}
        <div className="flex items-center gap-3">
          <label htmlFor="language" className="text-sm">
            Language
          </label>
          <Select value={lang} onValueChange={setLang}>
            <SelectTrigger id="language" className="w-56">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <section className="prose dark:prose-invert max-w-none">
          <h2>Content</h2>
          <p className="leading-relaxed">{translated ? translated : article?.content || article?.description}</p>
        </section>

        <section className="rounded-lg border p-4">
          <h3 className="font-medium mb-2">AI Summary</h3>
          {!summaryData?.summary ? (
            <p className="text-sm text-muted-foreground">Generating summary...</p>
          ) : (
            <ul className="list-disc pl-6 space-y-1">
              {summaryData.summary.split("\n").map((line: string, i: number) => (
                <li key={i}>{line.replace(/^[-•]\s?/, "")}</li>
              ))}
            </ul>
          )}
        </section>

        {article?.url && (
          <Button asChild>
            <a href={article.url} target="_blank" rel="noreferrer">
              Read Original
            </a>
          </Button>
        )}
      </article>
    </main>
  )
}
