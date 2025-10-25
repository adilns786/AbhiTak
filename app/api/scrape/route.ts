import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

const BASE_URL = "https://www.sciencedaily.com";

/** 
 * Expected client POST body:
 * { "url": "https://www.sciencedaily.com/releases/2025/10/251024041752.htm" }
 */

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || !url.startsWith(BASE_URL)) {
      return NextResponse.json(
        { error: "Invalid or missing ScienceDaily URL" },
        { status: 400 }
      );
    }

    // 1️⃣ Fetch the article HTML
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch article: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // 2️⃣ Extract featured image and caption
    const imageEl = $("#featured img");
    const imageSrc = imageEl.attr("src")
      ? `${BASE_URL}${imageEl.attr("src")}`
      : null;
    const imageDescription = $("#featured figcaption").text().trim() || null;

    // 3️⃣ Extract key points (ul li under #text > ul)
    const keyPoints: string[] = [];
    $("#text > ul li").each((_, el) => {
      const point = $(el).text().trim();
      if (point) keyPoints.push(point);
    });

    // 4️⃣ Extract paragraphs (p elements in #text, excluding those with <ul> inside)
    const paragraphs: string[] = [];
    $("#text")
      .find("p")
      .each((_, el) => {
        const text = $(el).text().trim();
        if (text && !$(el).find("ul").length) {
          paragraphs.push(text);
        }
      });

    // 5️⃣ Extract related topics and terms
    const relatedTopics: string[] = [];
    $("#related_topics a[rel='tag']").each((_, el) => {
      const topic = $(el).text().trim();
      if (topic) relatedTopics.push(topic);
    });

    const relatedTerms: string[] = [];
    $("#related_terms a[rel='tag']").each((_, el) => {
      const term = $(el).text().trim();
      if (term) relatedTerms.push(term);
    });

    // 6️⃣ Minimal structured response
    const articleData = {
      url,
      image: imageSrc,
      imageDescription,
      keyPoints,
      paragraphs,
      relatedTopics,
      relatedTerms,
    };

    return NextResponse.json(articleData, { status: 200 });
  } catch (error: any) {
    console.error("Article scrape error:", error);
    return NextResponse.json(
      {
        error: "Failed to scrape article",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
