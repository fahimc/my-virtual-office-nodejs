export interface ResearchResult {
  summary: string;
  citations: string[];
}

export async function research(input: { query: string; url?: string }): Promise<ResearchResult> {
  const citations: string[] = [];
  const inspected: PageSummary[] = [];

  if (input.url) {
    const page = await fetchPageSummary(input.url);
    if (page) {
      inspected.push(page);
      citations.push(page.url);
    }
  }

  if (!inspected.length && input.query.trim()) {
    const results = await searchDuckDuckGo(input.query);
    citations.push(...results.map(result => result.url));
    for (const result of results.slice(0, 3)) {
      const page = await fetchPageSummary(result.url).catch(() => undefined);
      inspected.push(page || { url: result.url, title: result.title, description: result.description, headings: [] });
    }
  }

  if (!inspected.length) {
    return {
      summary: `No public research result could be fetched for "${input.url || input.query}".`,
      citations: []
    };
  }

  return {
    summary: buildSummary(input.query || input.url || 'Research', inspected),
    citations: [...new Set(citations)].slice(0, 8)
  };
}

interface PageSummary {
  url: string;
  title: string;
  description?: string;
  headings: string[];
}

async function fetchPageSummary(url: string): Promise<PageSummary | undefined> {
  const resolved = normalizeUrl(url);
  const response = await fetch(resolved, {
    headers: {
      'user-agent': 'Mozilla/5.0 AI Agency Research Bot; contact=local-development',
      accept: 'text/html,application/xhtml+xml'
    },
    signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) return undefined;
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return undefined;
  const html = await response.text();
  return {
    url: response.url || resolved,
    title: text(findFirst(html, /<title[^>]*>([\s\S]*?)<\/title>/i)) || hostname(resolved),
    description: text(findMeta(html, 'description') || findMeta(html, 'og:description')),
    headings: [...html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)]
      .map(match => text(match[1]))
      .filter(Boolean)
      .slice(0, 8)
  };
}

async function searchDuckDuckGo(query: string): Promise<Array<{ title: string; url: string; description?: string }>> {
  const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: { 'user-agent': 'Mozilla/5.0 AI Agency Research Bot; contact=local-development' },
    signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) return [];
  const html = await response.text();
  const results: Array<{ title: string; url: string; description?: string }> = [];
  const resultRegex = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?(?:<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>|<div[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/div>)?/gi;
  for (const match of html.matchAll(resultRegex)) {
    const href = decodeDuckDuckGoUrl(match[1]);
    if (!href) continue;
    results.push({
      url: href,
      title: text(match[2]) || hostname(href),
      description: text(match[3] || match[4] || '')
    });
    if (results.length >= 5) break;
  }
  return results;
}

function buildSummary(query: string, pages: PageSummary[]): string {
  const lines = pages.map(page => {
    const parts = [
      page.title,
      page.description,
      page.headings.length ? `Visible themes: ${page.headings.join('; ')}` : undefined
    ].filter(Boolean);
    return `- ${parts.join(' | ')}`;
  });
  return `Research summary for ${query}:\n${lines.join('\n')}`;
}

function normalizeUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function decodeDuckDuckGoUrl(value: string): string | undefined {
  const decoded = decodeHtml(value);
  try {
    const url = new URL(decoded);
    const redirect = url.searchParams.get('uddg');
    return redirect ? decodeURIComponent(redirect) : decoded;
  } catch {
    return decoded.startsWith('http') ? decoded : undefined;
  }
}

function findFirst(html: string, pattern: RegExp): string | undefined {
  return html.match(pattern)?.[1];
}

function findMeta(html: string, name: string): string | undefined {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return findFirst(html, new RegExp(`<meta[^>]+(?:name|property)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'));
}

function text(value?: string): string {
  return decodeHtml((value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()).slice(0, 500);
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
