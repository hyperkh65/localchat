/**
 * Kakao API Client (Daum Search)
 * - Daum Blog Search
 * - Daum Web Search
 *
 * Docs: https://developers.kakao.com/docs/latest/ko/daum-search/dev-guide
 */

const DAUM_BLOG_URL = 'https://dapi.kakao.com/v2/search/blog'
const DAUM_WEB_URL = 'https://dapi.kakao.com/v2/search/web'
const DAUM_CAFE_URL = 'https://dapi.kakao.com/v2/search/cafe'
const REQUEST_TIMEOUT = 10000

function getHeaders(): Record<string, string> {
  const apiKey = process.env.KAKAO_REST_API_KEY

  if (!apiKey) {
    throw new Error('Kakao REST API key is not configured')
  }

  return {
    Authorization: `KakaoAK ${apiKey}`,
  }
}

function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer))
}

// --- Blog Search ---

export interface DaumBlogItem {
  title: string
  contents: string
  url: string
  blogname: string
  thumbnail: string
  datetime: string
}

export interface DaumSearchResponse<T> {
  meta: {
    total_count: number
    pageable_count: number
    is_end: boolean
  }
  documents: T[]
}

/**
 * 다음 블로그 검색
 */
export async function searchDaumBlogs(
  query: string,
  page: number = 1,
  size: number = 10,
  sort: 'accuracy' | 'recency' = 'accuracy'
): Promise<DaumSearchResponse<DaumBlogItem>> {
  const params = new URLSearchParams({
    query,
    page: String(page),
    size: String(size),
    sort,
  })

  const response = await fetchWithTimeout(`${DAUM_BLOG_URL}?${params}`, {
    method: 'GET',
    headers: getHeaders(),
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Kakao Blog Search API ${response.status}: ${errorText.slice(0, 300)}`)
  }

  return response.json()
}

// --- Web Search ---

export interface DaumWebItem {
  title: string
  contents: string
  url: string
  datetime: string
}

/**
 * 다음 웹 검색
 */
export async function searchDaumWeb(
  query: string,
  page: number = 1,
  size: number = 10,
  sort: 'accuracy' | 'recency' = 'accuracy'
): Promise<DaumSearchResponse<DaumWebItem>> {
  const params = new URLSearchParams({
    query,
    page: String(page),
    size: String(size),
    sort,
  })

  const response = await fetchWithTimeout(`${DAUM_WEB_URL}?${params}`, {
    method: 'GET',
    headers: getHeaders(),
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Kakao Web Search API ${response.status}: ${errorText.slice(0, 300)}`)
  }

  return response.json()
}

// --- Cafe Search ---

export interface DaumCafeItem {
  title: string
  contents: string
  url: string
  cafename: string
  thumbnail: string
  datetime: string
}

/**
 * 다음 카페 검색
 */
export async function searchDaumCafe(
  query: string,
  page: number = 1,
  size: number = 10,
  sort: 'accuracy' | 'recency' = 'accuracy'
): Promise<DaumSearchResponse<DaumCafeItem>> {
  const params = new URLSearchParams({
    query,
    page: String(page),
    size: String(size),
    sort,
  })

  const response = await fetchWithTimeout(`${DAUM_CAFE_URL}?${params}`, {
    method: 'GET',
    headers: getHeaders(),
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Kakao Cafe Search API ${response.status}: ${errorText.slice(0, 300)}`)
  }

  return response.json()
}

/**
 * 다음 통합 검색량 추정
 */
export async function estimateDaumVolume(query: string): Promise<{
  blogTotal: number
  webTotal: number
  cafeTotal: number
  combinedTotal: number
}> {
  const [blogResult, webResult, cafeResult] = await Promise.allSettled([
    searchDaumBlogs(query, 1, 1),
    searchDaumWeb(query, 1, 1),
    searchDaumCafe(query, 1, 1),
  ])

  const blogTotal = blogResult.status === 'fulfilled' ? blogResult.value.meta.total_count : 0
  const webTotal = webResult.status === 'fulfilled' ? webResult.value.meta.total_count : 0
  const cafeTotal = cafeResult.status === 'fulfilled' ? cafeResult.value.meta.total_count : 0

  return {
    blogTotal,
    webTotal,
    cafeTotal,
    combinedTotal: blogTotal + webTotal + cafeTotal,
  }
}
