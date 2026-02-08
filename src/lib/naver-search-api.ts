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

function getHeaders(): Record<string, string> {
  const clientId = process.env.NAVER_CLIENT_ID
  const clientSecret = process.env.NAVER_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Naver Developer API credentials are not configured')
  }

  return {
    'Content-Type': 'application/json',
    'X-Naver-Client-Id': clientId,
    'X-Naver-Client-Secret': clientSecret,
  }
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
 * - 최대 5개 키워드 그룹 비교 가능
 * - 상대적 검색 비율 (0~100)
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

  const response = await fetch(DATALAB_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Naver DataLab API error (${response.status}): ${errorText}`)
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
 * - 블로그 발행량(total) = 콘텐츠 포화도 계산에 활용
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

  const response = await fetch(`${SEARCH_BLOG_URL}?${params}`, {
    method: 'GET',
    headers: getHeaders(),
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Naver Blog Search API error (${response.status}): ${errorText}`)
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

  const response = await fetch(`${SEARCH_NEWS_URL}?${params}`, {
    method: 'GET',
    headers: getHeaders(),
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Naver News Search API error (${response.status}): ${errorText}`)
  }

  return response.json()
}
