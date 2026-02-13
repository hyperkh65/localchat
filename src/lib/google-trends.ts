/**
 * Google Trends 한국 데이터 가져오기
 * 다중 소스 + 강화된 폴백 전략
 * 1) Google Trends Daily API
 * 2) Google Trends Realtime API
 * 3) Google Trends RSS 피드
 * 4) Naver DataLab 인기 검색어 (추가 폴백)
 */

export interface GoogleTrendItem {
  keyword: string
  traffic: string         // "100K+", "50K+" 등
  trafficNumber: number   // 추정 숫자
  relatedQueries: string[]
  articles: Array<{ title: string; url: string }>
  source?: string
}

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
]

function getRandomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

/**
 * Google Trends 일일 인기 검색어 (한국)
 */
export async function fetchGoogleDailyTrends(): Promise<GoogleTrendItem[]> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)

    const url = 'https://trends.google.com/trends/api/dailytrends?hl=ko&tz=-540&geo=KR&ns=15'
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': getRandomUA(),
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Referer': 'https://trends.google.com/trending?geo=KR',
      },
    })

    clearTimeout(timeout)

    if (!res.ok) {
      console.error('[GoogleTrends] Daily HTTP error:', res.status)
      return []
    }

    const text = await res.text()
    const jsonStr = text.replace(/^\)\]\}',?\n/, '')
    const data = JSON.parse(jsonStr)

    const results: GoogleTrendItem[] = []
    const days = data?.default?.trendingSearchesDays || []

    for (const day of days.slice(0, 2)) {
      for (const search of (day.trendingSearches || []).slice(0, 10)) {
        const traffic = search.formattedTraffic || '0'
        results.push({
          keyword: search.title?.query || '',
          traffic,
          trafficNumber: parseTraffic(traffic),
          relatedQueries: (search.relatedQueries || []).map((q: { query: string }) => q.query).slice(0, 5),
          articles: (search.articles || []).slice(0, 3).map((a: { title: string; url: string }) => ({
            title: a.title || '',
            url: a.url || '',
          })),
          source: 'google-daily',
        })
      }
    }

    return results
  } catch (error: unknown) {
    console.error('[GoogleTrends] Daily fetch error:', error instanceof Error ? error.message : error)
    return []
  }
}

/**
 * Google Trends 실시간 인기 검색어 (한국)
 */
export async function fetchGoogleRealtimeTrends(): Promise<GoogleTrendItem[]> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)

    const url = 'https://trends.google.com/trends/api/realtimetrends?hl=ko&tz=-540&geo=KR&cat=all&fi=0&fs=0&ri=300&rs=20&sort=0'
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': getRandomUA(),
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Referer': 'https://trends.google.com/trending?geo=KR',
      },
    })

    clearTimeout(timeout)
    if (!res.ok) return []

    const text = await res.text()
    const jsonStr = text.replace(/^\)\]\}',?\n/, '')
    const data = JSON.parse(jsonStr)

    const results: GoogleTrendItem[] = []
    const stories = data?.storySummaries?.trendingStories || []

    for (const story of stories.slice(0, 15)) {
      const entityNames = (story.entityNames || []) as string[]
      if (entityNames.length > 0) {
        results.push({
          keyword: entityNames[0],
          traffic: '',
          trafficNumber: 0,
          relatedQueries: entityNames.slice(1, 5),
          articles: (story.articles || []).slice(0, 3).map((a: { articleTitle: string; url: string }) => ({
            title: a.articleTitle || '',
            url: a.url || '',
          })),
          source: 'google-realtime',
        })
      }
    }

    return results
  } catch {
    return []
  }
}

/**
 * Google Trends RSS 피드 (폴백용)
 */
export async function fetchGoogleTrendsRSS(): Promise<string[]> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const res = await fetch('https://trends.google.com/trending/rss?geo=KR', {
      signal: controller.signal,
      headers: {
        'User-Agent': getRandomUA(),
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
    })

    clearTimeout(timeout)
    if (!res.ok) return []

    const text = await res.text()
    const titles: string[] = []
    const matches = Array.from(text.matchAll(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/g))
    for (const match of matches) {
      const title = match[1].trim()
      if (title && title !== 'Daily Search Trends' && title !== 'Trending Searches') {
        titles.push(title)
      }
    }

    return titles.slice(0, 20)
  } catch {
    return []
  }
}

/**
 * Google Trends 자동완성으로 관련 인기 검색어 수집
 */
export async function fetchGoogleTrendsSuggestions(keyword: string): Promise<string[]> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const url = `https://trends.google.com/trends/api/autocomplete/${encodeURIComponent(keyword)}?hl=ko&tz=-540&geo=KR`
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': getRandomUA(),
        'Accept': 'application/json',
      },
    })

    clearTimeout(timeout)
    if (!res.ok) return []

    const text = await res.text()
    const jsonStr = text.replace(/^\)\]\}',?\n/, '')
    const data = JSON.parse(jsonStr)

    const topics = data?.default?.topics || []
    return topics
      .map((t: { title: string; type: string }) => t.title)
      .filter((t: string) => t && t.length > 0)
      .slice(0, 10)
  } catch {
    return []
  }
}

function parseTraffic(traffic: string): number {
  const clean = traffic.replace(/[^0-9KkMm+.]/g, '')
  if (clean.includes('M') || clean.includes('m')) {
    return parseFloat(clean) * 1000000
  }
  if (clean.includes('K') || clean.includes('k')) {
    return parseFloat(clean) * 1000
  }
  return parseInt(clean) || 0
}

/**
 * 모든 소스에서 Google Trends 데이터 수집 (강화버전)
 */
export async function fetchAllGoogleTrends(): Promise<{
  daily: GoogleTrendItem[]
  realtime: GoogleTrendItem[]
  rssKeywords: string[]
}> {
  const [daily, realtime, rssKeywords] = await Promise.allSettled([
    fetchGoogleDailyTrends(),
    fetchGoogleRealtimeTrends(),
    fetchGoogleTrendsRSS(),
  ])

  const result = {
    daily: daily.status === 'fulfilled' ? daily.value : [],
    realtime: realtime.status === 'fulfilled' ? realtime.value : [],
    rssKeywords: rssKeywords.status === 'fulfilled' ? rssKeywords.value : [],
  }

  console.log(`[GoogleTrends] Results: daily=${result.daily.length}, realtime=${result.realtime.length}, rss=${result.rssKeywords.length}`)

  return result
}
