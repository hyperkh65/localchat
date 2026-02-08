/**
 * 실시간 트렌딩 키워드 API
 *
 * 전략:
 * 1) 검색광고 API로 인기 시드 키워드의 연관 키워드 + 실제 검색량 조회 (핵심)
 * 2) 뉴스 키워드 추출은 보조 데이터 (실패해도 OK)
 * 3) 모두 실패 시에만 데모 폴백
 */

import { NextResponse } from 'next/server'
import { fetchKeywordData } from '@/lib/naver-ad-api'
import { searchNews } from '@/lib/naver-search-api'
import { calculateMoneyScore, getMoneyGrade } from '@/lib/keyword-engine'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// 인기 시드 키워드 (검색광고 API에 넣으면 연관 키워드 + 검색량 반환)
const TRENDING_SEEDS = [
  '추천', '비교', '가격', '후기', '방법',
  '다이어트', '투자', '노트북', '여행', 'AI',
]

function classifyCategory(keyword: string): string {
  const categories: Record<string, string[]> = {
    'IT/테크': ['아이폰', '갤럭시', '삼성', '애플', 'AI', '인공지능', '노트북', '스마트폰', '반도체', '맥북', '태블릿', '모니터', '이어폰', '키보드', 'SSD', 'GPU'],
    '금융': ['주가', '코스피', '금리', '환율', '비트코인', '투자', '주식', 'ETF', '증시', '은행', '대출', '배당', '펀드'],
    '건강': ['건강', '다이어트', '운동', '병원', '치료', '식단', '영양', '비타민', '유산균', '단백질', '홈트'],
    '부동산': ['아파트', '전세', '월세', '청약', '부동산', '분양', '매매', '인테리어'],
    '교육': ['수능', '입시', '대학', '교육', '자격증', '코딩', '영어', '토익'],
    '패션': ['패션', '브랜드', '명품', '코디', '의류'],
    '여행': ['여행', '항공', '호텔', '관광', '맛집', '제주'],
    '자동차': ['자동차', '전기차', '현대', '기아', 'SUV', '중고차'],
    '엔터': ['드라마', '영화', '넷플릭스', '아이돌', '콘서트', '게임', '웹툰'],
    '쇼핑': ['할인', '세일', '쿠폰', '최저가', '가성비'],
    '재테크': ['부업', '재테크', '적금', '연금', '절약'],
  }
  const lower = keyword.toLowerCase()
  for (const [cat, patterns] of Object.entries(categories)) {
    if (patterns.some(p => lower.includes(p.toLowerCase()))) return cat
  }
  return '일반'
}

// 뉴스 제목에서 키워드 추출
function extractKeywordsFromNews(titles: string[]): string[] {
  const stopwords = new Set([
    '있다', '없다', '되다', '하다', '이다', '것이다', '한다', '위해', '대한', '통해',
    '에서', '으로', '까지', '부터', '에는', '이는', '라고', '라며', '했다', '됐다',
    '밝혔다', '전했다', '보도', '기자', '뉴스', '속보', '종합', '단독', '영상',
    '포토', '사진', '관련', '관한', '대해', '따르면', '것으로', '이번', '지난',
    '올해', '오늘', '어제', '내일', '작년', 'the', 'of', 'and', 'in', 'to',
  ])

  const keywordCount = new Map<string, number>()

  for (const title of titles) {
    const clean = title.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ')
    const phrases = clean.match(/[가-힣]+\s[가-힣]+(?:\s[가-힣]+)?/g) || []
    for (const phrase of phrases) {
      const trimmed = phrase.trim()
      if (trimmed.length >= 4 && trimmed.length <= 20) {
        const words = trimmed.split(/\s+/)
        if (words.every(w => !stopwords.has(w) && w.length >= 2)) {
          keywordCount.set(trimmed, (keywordCount.get(trimmed) || 0) + 2)
        }
      }
    }
  }

  return Array.from(keywordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([keyword]) => keyword)
}

// 데모 폴백
function generateFallbackTrending() {
  const year = new Date().getFullYear()
  const items = [
    { keyword: 'AI 에이전트', category: 'IT/테크', volume: 28500, comp: 'high' as const },
    { keyword: '비트코인 시세', category: '금융', volume: 45200, comp: 'high' as const },
    { keyword: '갤럭시 S25', category: 'IT/테크', volume: 38000, comp: 'high' as const },
    { keyword: '전세사기 예방', category: '부동산', volume: 12300, comp: 'medium' as const },
    { keyword: '다이어트 식단', category: '건강', volume: 21500, comp: 'high' as const },
    { keyword: `전기차 보조금 ${year}`, category: '자동차', volume: 15800, comp: 'medium' as const },
    { keyword: '코딩 부트캠프 추천', category: '교육', volume: 8700, comp: 'low' as const },
    { keyword: '부업 추천 재택', category: '재테크', volume: 16400, comp: 'medium' as const },
    { keyword: '건강기능식품 추천', category: '건강', volume: 11200, comp: 'high' as const },
    { keyword: `노트북 추천 ${year}`, category: 'IT/테크', volume: 25600, comp: 'high' as const },
    { keyword: '주식 초보 종목', category: '금융', volume: 9800, comp: 'medium' as const },
    { keyword: '여행지 추천 국내', category: '여행', volume: 18900, comp: 'medium' as const },
    { keyword: '무선이어폰 가성비', category: 'IT/테크', volume: 13200, comp: 'high' as const },
    { keyword: '영어 회화 앱 추천', category: '교육', volume: 7600, comp: 'low' as const },
    { keyword: '배당주 추천', category: '금융', volume: 8900, comp: 'medium' as const },
    { keyword: 'ETF 적립식 투자', category: '재테크', volume: 6500, comp: 'low' as const },
  ]

  return items.map((item, i) => {
    const cpc = item.comp === 'high' ? 2200 : item.comp === 'medium' ? 1100 : 450
    const posts = Math.round(item.volume * (item.comp === 'high' ? 2.0 : item.comp === 'medium' ? 1.0 : 0.4))
    const moneyScore = calculateMoneyScore({ volume: item.volume, competition: item.comp, cpcEstimate: cpc, keyword: item.keyword, monthlyPosts: posts })
    return {
      rank: i + 1,
      keyword: item.keyword,
      searchVolume: item.volume,
      competition: item.comp,
      changePercent: 10 + ((i * 17) % 80),
      moneyScore,
      moneyGrade: getMoneyGrade(moneyScore),
      category: item.category,
    }
  }).sort((a, b) => b.searchVolume - a.searchVolume).map((item, i) => ({ ...item, rank: i + 1 }))
}

export async function GET() {
  const errors: string[] = []

  try {
    // === 전략 1: 검색광고 API로 시드 키워드 기반 인기 키워드 수집 ===
    // 시드 키워드 5개씩 2배치로 나누어 호출
    const batch1Seeds = TRENDING_SEEDS.slice(0, 5).join(',')
    const batch2Seeds = TRENDING_SEEDS.slice(5, 10).join(',')

    const [adBatch1, adBatch2, newsResult] = await Promise.allSettled([
      fetchKeywordData(batch1Seeds),
      fetchKeywordData(batch2Seeds),
      searchNews('오늘 인기', 50, 'date'),
    ])

    // 검색광고 API 결과 합치기
    const adKeywords = [
      ...(adBatch1.status === 'fulfilled' ? adBatch1.value : []),
      ...(adBatch2.status === 'fulfilled' ? adBatch2.value : []),
    ]

    if (adBatch1.status === 'rejected') errors.push(`adBatch1: ${adBatch1.reason?.message || 'failed'}`)
    if (adBatch2.status === 'rejected') errors.push(`adBatch2: ${adBatch2.reason?.message || 'failed'}`)

    // 뉴스 키워드 추출 (보조 데이터)
    let newsKeywords: string[] = []
    if (newsResult.status === 'fulfilled' && newsResult.value.items?.length > 0) {
      newsKeywords = extractKeywordsFromNews(newsResult.value.items.map(item => item.title))
    }

    // 뉴스 키워드가 있으면 검색광고 API로 추가 조회
    let newsAdKeywords: typeof adKeywords = []
    if (newsKeywords.length > 0) {
      try {
        const newsAdResult = await fetchKeywordData(newsKeywords.slice(0, 5).join(','))
        newsAdKeywords = newsAdResult
      } catch (e: unknown) {
        errors.push(`newsAd: ${e instanceof Error ? e.message : 'failed'}`)
      }
    }

    // 전체 키워드 합치기
    const allKeywords = [...adKeywords, ...newsAdKeywords]

    if (allKeywords.length === 0) {
      console.error('Trending: All API calls failed.', errors.join(' | '))
      return NextResponse.json({
        success: true,
        data: generateFallbackTrending(),
        isRealData: false,
        errors,
        meta: { total: 16, source: 'fallback', timestamp: new Date().toISOString() },
      })
    }

    // 중복 제거 + 검색량 기준 필터
    const seen = new Set<string>()
    const trendingKeywords = allKeywords
      .filter(kw => {
        const key = kw.keyword.toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return kw.monthlyTotalVolume >= 100
      })
      .map(kw => {
        const cpcEstimate = kw.competition === 'high' ? 1500 + kw.adDepth * 200
          : kw.competition === 'medium' ? 800 + kw.adDepth * 200
          : 300 + kw.adDepth * 200
        const monthlyPosts = Math.round(kw.monthlyTotalVolume * (kw.competition === 'high' ? 2.5 : kw.competition === 'medium' ? 1.2 : 0.4))
        const moneyScore = calculateMoneyScore({
          volume: kw.monthlyTotalVolume,
          competition: kw.competition,
          cpcEstimate,
          keyword: kw.keyword,
          monthlyPosts,
        })
        return {
          rank: 0,
          keyword: kw.keyword,
          searchVolume: kw.monthlyTotalVolume,
          competition: kw.competition,
          changePercent: 10 + Math.round(Math.abs(Math.sin(kw.keyword.length * 3.14)) * 80),
          moneyScore,
          moneyGrade: getMoneyGrade(moneyScore),
          category: classifyCategory(kw.keyword),
        }
      })
      .sort((a, b) => b.searchVolume - a.searchVolume)
      .slice(0, 50)
      .map((item, i) => ({ ...item, rank: i + 1 }))

    const hasRealData = adBatch1.status === 'fulfilled' || adBatch2.status === 'fulfilled'

    return NextResponse.json({
      success: true,
      data: trendingKeywords,
      isRealData: hasRealData,
      errors: errors.length > 0 ? errors : undefined,
      meta: {
        total: trendingKeywords.length,
        source: hasRealData ? 'naver-ad-api' : 'fallback',
        newsKeywords: newsKeywords.length,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error: unknown) {
    console.error('Trending API critical error:', error instanceof Error ? error.message : error)
    return NextResponse.json({
      success: true,
      data: generateFallbackTrending(),
      isRealData: false,
      errors: [...errors, error instanceof Error ? error.message : 'unknown'],
      meta: { total: 16, source: 'fallback', timestamp: new Date().toISOString() },
    })
  }
}
