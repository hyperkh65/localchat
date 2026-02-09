/**
 * Google Trends 한국 데이터 가져오기
 * 비공식 API 엔드포인트 사용
 * 실패 시 graceful fallback
 */

export interface GoogleTrendItem {
  keyword: string
  traffic: string         // "100K+", "50K+" 등
  trafficNumber: number   // 추정 숫자
  relatedQueries: string[]
  articles: Array<{ title: string; url: string }>
}

/**
 * Google Trends 일일 인기 검색어 (한국)
 */
export async function fetchGoogleDailyTrends(): Promise<GoogleTrendItem[]> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    // Google Trends Daily Trends API (비공식)
    const url = 'https://trends.google.com/trends/api/dailytrends?hl=ko&tz=-540&geo=KR&ns=15'
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    })

    clearTimeout(timeout)

    if (!res.ok) {
      console.error('[GoogleTrends] HTTP error:', res.status)
      return []
    }

    const text = await res.text()
    // Google API는 응답 앞에 ")]}',\n" 접두사를 붙임
    const jsonStr = text.replace(/^\)\]\}',?\n/, '')
    const data = JSON.parse(jsonStr)

    const results: GoogleTrendItem[] = []
    const days = data?.default?.trendingSearchesDays || []

    for (const day of days.slice(0, 2)) { // 최근 2일
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
        })
      }
    }

    return results
  } catch (error: unknown) {
    console.error('[GoogleTrends] Fetch error:', error instanceof Error ? error.message : error)
    return []
  }
}

/**
 * Google Trends 실시간 인기 검색어 (한국)
 */
export async function fetchGoogleRealtimeTrends(): Promise<GoogleTrendItem[]> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const url = 'https://trends.google.com/trends/api/realtimetrends?hl=ko&tz=-540&geo=KR&cat=all&fi=0&fs=0&ri=300&rs=20&sort=0'
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
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
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch('https://trends.google.com/trending/rss?geo=KR', {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
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
 * 모든 소스에서 Google Trends 데이터 수집
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

  return {
    daily: daily.status === 'fulfilled' ? daily.value : [],
    realtime: realtime.status === 'fulfilled' ? realtime.value : [],
    rssKeywords: rssKeywords.status === 'fulfilled' ? rssKeywords.value : [],
  }
}
