/**
 * 블로그 랭킹 시스템
 * 벤치마킹: 판다랭크(PandaRank), 키자드(Keyzard), 키워드마스터
 *
 * 기능:
 * 1) 키워드별 블로그 TOP 30 랭킹 (네이버/티스토리/기타)
 * 2) 내 블로그 순위 추적
 * 3) 상위 포스트 역분석 (제목 패턴, 키워드 밀도, 플랫폼 분포)
 * 4) 블로그 점수 산정 (콘텐츠 포화도 기반)
 */

import { searchBlogs, type BlogSearchResult } from '@/lib/naver-search-api'
import { searchDaumBlogs } from '@/lib/kakao-api'

export type BlogPlatform = 'naver' | 'tistory' | 'wordpress' | 'other'

export interface BlogRankItem {
  rank: number
  title: string
  link: string
  blogName: string
  platform: BlogPlatform
  postDate: string
  titleLength: number
  hasKeywordInTitle: boolean
  description: string
}

export interface TopPostAnalysis {
  avgTitleLength: number
  avgDescriptionLength: number
  platformDistribution: Record<BlogPlatform, number>
  keywordInTitleRate: number    // 제목에 키워드 포함 비율
  topKeywords: Array<{ word: string; count: number }>  // 자주 등장하는 단어
  recentPostRate: number        // 최근 30일 이내 포스트 비율
  competitionLevel: 'very_high' | 'high' | 'medium' | 'low'
  recommendations: string[]
}

export interface MyBlogRankResult {
  keyword: string
  myRank: number | null       // null = 30위 밖
  totalResults: number
  topCompetitor: string
  myPost?: BlogRankItem
}

/**
 * 블로그 URL에서 플랫폼 감지
 */
export function detectPlatform(link: string): BlogPlatform {
  if (link.includes('blog.naver.com') || link.includes('m.blog.naver.com')) return 'naver'
  if (link.includes('tistory.com')) return 'tistory'
  if (link.includes('wordpress.com') || link.includes('wp.')) return 'wordpress'
  return 'other'
}

/**
 * 키워드별 블로그 TOP 30 랭킹
 */
export async function getBlogRankings(keyword: string): Promise<{
  rankings: BlogRankItem[]
  analysis: TopPostAnalysis
  sources: string[]
}> {
  const sources: string[] = []

  // 네이버 + 다음 블로그 검색 병렬
  const [naverResult, daumResult] = await Promise.allSettled([
    searchBlogs(keyword, 30, 'sim'),
    searchDaumBlogs(keyword, 1, 30, 'accuracy'),
  ])

  const rankings: BlogRankItem[] = []
  const seen = new Set<string>()

  // 네이버 블로그 결과
  if (naverResult.status === 'fulfilled' && naverResult.value.items?.length > 0) {
    sources.push('naver-blog')
    for (const item of naverResult.value.items) {
      const link = item.link
      if (seen.has(link)) continue
      seen.add(link)

      const cleanTitle = item.title.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ')
      rankings.push({
        rank: rankings.length + 1,
        title: cleanTitle,
        link,
        blogName: item.bloggername || '',
        platform: detectPlatform(link),
        postDate: item.postdate || '',
        titleLength: cleanTitle.length,
        hasKeywordInTitle: cleanTitle.toLowerCase().includes(keyword.toLowerCase()),
        description: (item.description || '').replace(/<[^>]+>/g, '').slice(0, 150),
      })
    }
  }

  // 다음 블로그 결과 (네이버에 없는 것 추가)
  if (daumResult.status === 'fulfilled') {
    const daumVal = daumResult.value as { documents?: Array<{ title: string; url: string; blogname: string; datetime: string; contents: string }> }
    if (daumVal.documents?.length) {
      sources.push('daum-blog')
      for (const doc of daumVal.documents) {
        const link = doc.url
        if (seen.has(link)) continue
        seen.add(link)

        const cleanTitle = doc.title.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ')
        rankings.push({
          rank: rankings.length + 1,
          title: cleanTitle,
          link,
          blogName: doc.blogname || '',
          platform: detectPlatform(link),
          postDate: doc.datetime?.slice(0, 10) || '',
          titleLength: cleanTitle.length,
          hasKeywordInTitle: cleanTitle.toLowerCase().includes(keyword.toLowerCase()),
          description: (doc.contents || '').replace(/<[^>]+>/g, '').slice(0, 150),
        })
      }
    }
  }

  // 순위 재배정
  rankings.forEach((r, i) => r.rank = i + 1)

  // 상위 포스트 분석
  const analysis = analyzeTopPosts(keyword, rankings)

  return { rankings: rankings.slice(0, 30), analysis, sources }
}

/**
 * 상위 포스트 역분석 (키자드 벤치마킹)
 */
function analyzeTopPosts(keyword: string, rankings: BlogRankItem[]): TopPostAnalysis {
  const top10 = rankings.slice(0, 10)
  if (top10.length === 0) {
    return {
      avgTitleLength: 0,
      avgDescriptionLength: 0,
      platformDistribution: { naver: 0, tistory: 0, wordpress: 0, other: 0 },
      keywordInTitleRate: 0,
      topKeywords: [],
      recentPostRate: 0,
      competitionLevel: 'low',
      recommendations: ['검색 결과가 없습니다. 다른 키워드를 시도해보세요.'],
    }
  }

  // 제목 길이 평균
  const avgTitleLength = Math.round(top10.reduce((s, r) => s + r.titleLength, 0) / top10.length)
  const avgDescriptionLength = Math.round(top10.reduce((s, r) => s + r.description.length, 0) / top10.length)

  // 플랫폼 분포
  const platformDistribution: Record<BlogPlatform, number> = { naver: 0, tistory: 0, wordpress: 0, other: 0 }
  for (const r of top10) {
    platformDistribution[r.platform]++
  }

  // 제목에 키워드 포함 비율
  const keywordInTitleRate = Math.round(top10.filter(r => r.hasKeywordInTitle).length / top10.length * 100)

  // 자주 등장하는 단어 (상위 포스트 제목에서)
  const wordCount = new Map<string, number>()
  const stopwords = new Set(['있다', '없다', '되다', '하다', '이다', '한다', '위해', '대한', '통해', '에서', '으로', '더', '가장', '및', '등', '중'])
  for (const r of top10) {
    const words = r.title.match(/[가-힣]{2,}/g) || []
    for (const w of words) {
      if (!stopwords.has(w) && w.length >= 2) {
        wordCount.set(w, (wordCount.get(w) || 0) + 1)
      }
    }
  }
  const topKeywords = Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word, count]) => ({ word, count }))

  // 최근 포스트 비율
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentPosts = top10.filter(r => {
    if (!r.postDate) return false
    const d = new Date(r.postDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'))
    return d >= thirtyDaysAgo
  })
  const recentPostRate = Math.round(recentPosts.length / top10.length * 100)

  // 경쟁도 판단
  let competitionLevel: 'very_high' | 'high' | 'medium' | 'low'
  const totalResults = rankings.length
  if (totalResults >= 25 && recentPostRate >= 50 && keywordInTitleRate >= 80) {
    competitionLevel = 'very_high'
  } else if (totalResults >= 20 && recentPostRate >= 30) {
    competitionLevel = 'high'
  } else if (totalResults >= 10) {
    competitionLevel = 'medium'
  } else {
    competitionLevel = 'low'
  }

  // 추천사항 생성
  const recommendations: string[] = []

  if (keywordInTitleRate >= 70) {
    recommendations.push(`상위 ${keywordInTitleRate}%가 제목에 키워드를 포함합니다. 반드시 제목에 "${keyword}"를 넣으세요.`)
  }

  if (platformDistribution.naver >= 7) {
    recommendations.push('네이버 블로그가 상위를 독점하고 있습니다. 네이버 블로그가 유리합니다.')
  } else if (platformDistribution.tistory >= 5) {
    recommendations.push('티스토리 블로그가 많이 보입니다. 구글 SEO를 노린다면 티스토리가 유리합니다.')
  } else {
    recommendations.push('다양한 플랫폼이 혼재합니다. 양질의 콘텐츠로 승부하세요.')
  }

  recommendations.push(`상위 포스트의 평균 제목 길이는 ${avgTitleLength}자입니다. 이에 맞춰 작성하세요.`)

  if (topKeywords.length >= 3) {
    const top3Words = topKeywords.slice(0, 3).map(k => k.word).join(', ')
    recommendations.push(`상위 포스트에서 자주 사용되는 단어: ${top3Words}. 이 단어들을 콘텐츠에 포함하세요.`)
  }

  if (recentPostRate >= 50) {
    recommendations.push('최근 포스트가 많습니다. 최신성이 중요한 키워드이므로 빠르게 발행하세요.')
  } else if (recentPostRate < 20) {
    recommendations.push('오래된 포스트가 상위에 많습니다. 최신 정보로 작성하면 상위 진입 가능성이 높습니다.')
  }

  if (competitionLevel === 'low') {
    recommendations.push('경쟁도가 낮은 블루오션 키워드입니다! 빠르게 선점하세요.')
  }

  return {
    avgTitleLength,
    avgDescriptionLength,
    platformDistribution,
    keywordInTitleRate,
    topKeywords,
    recentPostRate,
    competitionLevel,
    recommendations,
  }
}

/**
 * 내 블로그 순위 확인
 */
export async function checkMyBlogRank(
  keyword: string,
  blogUrl: string
): Promise<MyBlogRankResult> {
  const { rankings } = await getBlogRankings(keyword)

  // 블로그 URL에서 도메인/ID 추출
  const normalizedUrl = blogUrl.toLowerCase().replace(/\/$/, '')

  let myRank: number | null = null
  let myPost: BlogRankItem | undefined

  for (const r of rankings) {
    const normalizedLink = r.link.toLowerCase().replace(/\/$/, '')
    if (normalizedLink.includes(normalizedUrl) || normalizedUrl.includes(normalizedLink.split('/').slice(0, 4).join('/'))) {
      myRank = r.rank
      myPost = r
      break
    }
  }

  return {
    keyword,
    myRank,
    totalResults: rankings.length,
    topCompetitor: rankings[0]?.blogName || '-',
    myPost,
  }
}

/**
 * 콘텐츠 포화도 계산 (블랙키위 벤치마킹)
 * = 월간 발행 포스트 수 / 월간 검색량
 * 낮을수록 블루오션
 */
export function calculateSaturationIndex(monthlyPosts: number, monthlyVolume: number): {
  index: number
  level: 'very_low' | 'low' | 'medium' | 'high' | 'very_high'
  label: string
} {
  if (monthlyVolume === 0) return { index: 0, level: 'very_low', label: '데이터 없음' }

  const index = Math.round((monthlyPosts / monthlyVolume) * 100) / 100

  let level: 'very_low' | 'low' | 'medium' | 'high' | 'very_high'
  let label: string

  if (index < 0.3) {
    level = 'very_low'
    label = '매우 낮음 (블루오션)'
  } else if (index < 0.7) {
    level = 'low'
    label = '낮음 (기회 있음)'
  } else if (index < 1.5) {
    level = 'medium'
    label = '보통'
  } else if (index < 3.0) {
    level = 'high'
    label = '높음 (경쟁 치열)'
  } else {
    level = 'very_high'
    label = '매우 높음 (레드오션)'
  }

  return { index, level, label }
}

/**
 * 키워드 난이도 등급 (블랙키위 + 블로그톡 벤치마킹)
 * 내 블로그 수준과 매칭
 */
export function getKeywordDifficulty(
  monthlyVolume: number,
  competition: 'high' | 'medium' | 'low',
  saturationIndex: number
): {
  score: number       // 0-100
  grade: 'S' | 'A' | 'B' | 'C' | 'D'
  label: string
  recommendedBlogLevel: string
} {
  let score = 50

  // 검색량 반영
  if (monthlyVolume > 50000) score += 25
  else if (monthlyVolume > 10000) score += 15
  else if (monthlyVolume > 5000) score += 8
  else if (monthlyVolume > 1000) score += 3
  else score -= 5

  // 경쟁도 반영
  if (competition === 'high') score += 20
  else if (competition === 'medium') score += 8
  else score -= 5

  // 포화도 반영
  if (saturationIndex > 3) score += 15
  else if (saturationIndex > 1.5) score += 8
  else if (saturationIndex < 0.3) score -= 10

  score = Math.max(0, Math.min(100, score))

  let grade: 'S' | 'A' | 'B' | 'C' | 'D'
  let label: string
  let recommendedBlogLevel: string

  if (score >= 80) {
    grade = 'S'
    label = '매우 어려움'
    recommendedBlogLevel = '상위 1% 블로그 (일 방문자 5,000+)'
  } else if (score >= 60) {
    grade = 'A'
    label = '어려움'
    recommendedBlogLevel = '상위 10% 블로그 (일 방문자 1,000+)'
  } else if (score >= 40) {
    grade = 'B'
    label = '보통'
    recommendedBlogLevel = '중급 블로그 (일 방문자 300+)'
  } else if (score >= 20) {
    grade = 'C'
    label = '쉬움'
    recommendedBlogLevel = '초보 블로그 (일 방문자 100+)'
  } else {
    grade = 'D'
    label = '매우 쉬움'
    recommendedBlogLevel = '신규 블로그도 가능'
  }

  return { score, grade, label, recommendedBlogLevel }
}
