import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

const BASE_URL = "https://www.sciencedaily.com";

export async function GET() {
  try {
    // 1️⃣ Fetch ScienceDaily homepage
    const res = await fetch(BASE_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch page: ${res.status}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // 2️⃣ Extract articles
    const articles: {
      title: string;
      url: string;
      date: string;
      description: string;
    }[] = [];

    $(".row").each((_, row) => {
      $(row)
        .find(".col-md-6")
        .each((_, col) => {
          const titleEl = $(col).find(".latest-head a");
          const summaryEl = $(col).find(".latest-summary");
          const dateEl = summaryEl.find(".story-date");

          const title = titleEl.text().trim();
          const relativeLink = titleEl.attr("href") || "";
          const url = relativeLink.startsWith("http")
            ? relativeLink
            : `${BASE_URL}${relativeLink}`;

          // Extract and clean date
          const rawDate = dateEl.text().replace("—", "").trim();
          let formattedDate = "";

          // Try parsing the date into ISO format
          if (rawDate) {
            const parsedDate = new Date(rawDate);
            if (!isNaN(parsedDate.getTime())) {
              formattedDate = parsedDate.toISOString();
            } else {
              // fallback: keep original if parsing fails
              formattedDate = rawDate;
            }
          }

          // Remove date text from summary to get description only
          const description = summaryEl.text().replace(dateEl.text(), "").trim();

          if (title && url && description) {
            articles.push({
              title,
              url,
              publishedAt: formattedDate || null,
              description,
            });
          }
        });
    });
    
    // 3️⃣ Return data in clean JSON
    return NextResponse.json({
      count: articles.length,
      articles,
    });
  } catch (error: any) {
    console.error("Scraping error:", error);
    return NextResponse.json(
      {
        error: "Failed to scrape ScienceDaily",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
