import { NextResponse } from "next/server";

export const revalidate = 180;

export type NewsItem = {
  id: string;
  title: string;
  source: string;
  url: string;
  published?: string;
};

const FALLBACK: NewsItem[] = [
  {
    id: "fb-1",
    title: "Markets digest: watch liquidity and macro prints before sizing risk",
    source: "Concierge context",
    url: "https://www.coindesk.com/",
  },
  {
    id: "fb-2",
    title: "Stablecoin flows and funding rates remain key short-term signals",
    source: "Concierge context",
    url: "https://cointelegraph.com/",
  },
  {
    id: "fb-3",
    title: "Risk note: never size a swap from headlines alone — use vault + mandate",
    source: "Concierge context",
    url: "https://docs.0g.ai/",
  },
];

function stripCdata(s: string) {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

function decodeEntities(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function parseRss(xml: string, source: string): NewsItem[] {
  const items: NewsItem[] = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  for (const block of blocks.slice(0, 8)) {
    const title = block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
    const link =
      block.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1] ||
      block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i)?.[1];
    const pub = block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1];
    if (!title || !link) continue;
    const cleanTitle = decodeEntities(stripCdata(title));
    const cleanLink = decodeEntities(stripCdata(link)).trim();
    let published: string | undefined;
    if (pub) {
      const d = new Date(stripCdata(pub));
      if (!Number.isNaN(d.getTime())) {
        published = d.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        });
      }
    }
    items.push({
      id: `${source}-${items.length}-${cleanLink.slice(-24)}`,
      title: cleanTitle,
      source,
      url: cleanLink.startsWith("http") ? cleanLink : `https://${cleanLink}`,
      published,
    });
  }
  return items;
}

async function fetchRss(url: string, source: string): Promise<NewsItem[]> {
  const res = await fetch(url, {
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml, */*",
      "User-Agent":
        "Mozilla/5.0 (compatible; ConciergeAdvisor/1.0; +https://0g.ai)",
    },
    next: { revalidate: 180 },
  });
  if (!res.ok) throw new Error(`${source} ${res.status}`);
  const xml = await res.text();
  return parseRss(xml, source);
}

/** Multi-source market headlines; always returns items (fallback if feeds fail). */
export async function GET() {
  const sources: Array<{ url: string; source: string }> = [
    { url: "https://cointelegraph.com/rss", source: "CoinTelegraph" },
    // Trailing slash 308s on some hosts — use no-slash path.
    {
      url: "https://www.coindesk.com/arc/outboundfeeds/rss",
      source: "CoinDesk",
    },
    {
      url: "https://feeds.finance.yahoo.com/rss/2.0/headline?s=BTC-USD&region=US&lang=en-US",
      source: "Yahoo Finance",
    },
  ];

  const results = await Promise.allSettled(
    sources.map((s) => fetchRss(s.url, s.source))
  );

  const collected: NewsItem[] = [];
  const errors: string[] = [];

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === "fulfilled") {
      collected.push(...r.value);
    } else {
      errors.push(
        r.reason instanceof Error ? r.reason.message : String(r.reason)
      );
    }
  }

  const seen = new Set<string>();
  const unique = collected.filter((n) => {
    const key = n.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const items = (unique.length > 0 ? unique : FALLBACK).slice(0, 10);

  return NextResponse.json({
    items,
    fallback: unique.length === 0,
    sourcesOk: results.filter((r) => r.status === "fulfilled").length,
    ...(errors.length && unique.length === 0
      ? { note: "Live feeds unreachable — showing context cards" }
      : {}),
  });
}
