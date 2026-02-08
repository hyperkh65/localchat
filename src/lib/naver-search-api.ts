/**
 * Naver Developer API Client
 * - DataLab Search Trend API
 * - Search API (Blog, News)
 *
 * Docs: https://developers.naver.com/docs/serviceapi/datalab/search/search.md
 * Docs: https://developers.naver.com/docs/serviceapi/search/blog/blog.md
 */

const DATALAB_URL = 'https://openapi.naver.com/v1/datalab/search'
const SEARCH_BLOG_URL = 'https://openapi.naver.com/v1/search/blog.json'
const SEARCH_NEWS_URL = 'https://openapi.naver.com/v1/search/news.json'
const REQUEST_TIMEOUT = 10000

function getHeaders(): Record<string, string> {
  const clientId = process.env.NAVER_CLIENT_ID
  const clientSecret = process.env.NAVER_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error(
      `Naver Developer API credentials missing: clientId=${!!clientId}, clientSecret=${!!clientSecret}`
    )
  }

  return {
    'Content-Type': 'application/json',
    'X-Naver-Client-Id': clientId,
    'X-Naver-Client-Secret': clientSecret,
  }
}

function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer))
}

// --- DataLab Search Trend ---

export interface TrendDataPoint {
  period: string
  ratio: number
}

export interface TrendResult {
  title: string
  keywords: string[]
  data: TrendDataPoint[]
}

/**
 * 네이버 DataLab 검색어 트렌드 조회
 */
export async function fetchSearchTrend(
  keywords: string[],
  startDate?: string,
  endDate?: string,
  timeUnit: 'date' | 'week' | 'month' = 'month'
): Promise<TrendResult[]> {
  const now = new Date()
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  const body = {
    startDate: startDate || oneYearAgo.toISOString().slice(0, 10),
    endDate: endDate || now.toISOString().slice(0, 10),
    timeUnit,
    keywordGroups: keywords.map((kw) => ({
      groupName: kw,
      keywords: [kw],
    })),
  }

  const response = await fetchWithTimeout(DATALAB_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Naver DataLab API ${response.status}: ${errorText.slice(0, 300)}`)
  }

  const data = await response.json()

  return (data.results || []).map((result: { title: string; keywords: string[]; data: TrendDataPoint[] }) => ({
    title: result.title,
    keywords: result.keywords,
    data: result.data || [],
  }))
}

// --- Blog Search ---

export interface BlogSearchResult {
  title: string
  link: string
  description: string
  bloggername: string
  postdate: string
}

export interface BlogSearchResponse {
  total: number
  start: number
  display: number
  items: BlogSearchResult[]
}

/**
 * 네이버 블로그 검색
 */
export async function searchBlogs(
  query: string,
  display: number = 10,
  sort: 'sim' | 'date' = 'sim'
): Promise<BlogSearchResponse> {
  const params = new URLSearchParams({
    query,
    display: String(display),
    sort,
  })

  const response = await fetchWithTimeout(`${SEARCH_BLOG_URL}?${params}`, {
    method: 'GET',
    headers: getHeaders(),
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Naver Blog Search API ${response.status}: ${errorText.slice(0, 300)}`)
  }

  return response.json()
}

// --- News Search ---

export interface NewsSearchResult {
  title: string
  originallink: string
  link: string
  description: string
  pubDate: string
}

export interface NewsSearchResponse {
  total: number
  start: number
  display: number
  items: NewsSearchResult[]
}

/**
 * 네이버 뉴스 검색
 */
export async function searchNews(
  query: string,
  display: number = 10,
  sort: 'sim' | 'date' = 'date'
): Promise<NewsSearchResponse> {
  const params = new URLSearchParams({
    query,
    display: String(display),
    sort,
  })

  const response = await fetchWithTimeout(`${SEARCH_NEWS_URL}?${params}`, {
    method: 'GET',
    headers: getHeaders(),
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Naver News Search API ${response.status}: ${errorText.slice(0, 300)}`)
  }

  return response.json()
}
