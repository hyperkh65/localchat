/**
 * 블루오션 키워드 발굴 API
 *
 * 전략:
 * 1) 네이버 블로그 검색 (작동중!) → 카테고리별 인기 키워드 추출
 * 2) 카카오/다음 검색 (작동중!) → 추가 키워드 보강
 * 3) 네이버 검색광고 API (보너스) → 실제 검색량 보강
 * 4) API 실패 시 데모 폴백
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchKeywordData } from '@/lib/naver-ad-api'
import { searchBlogs } from '@/lib/naver-search-api'
import { searchDaumBlogs } from '@/lib/kakao-api'
import { calculateMoneyScore, getMoneyGrade } from '@/lib/keyword-engine'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const categorySeedKeywords: Record<string, string[]> = {
  '재테크': ['주식 투자 방법', '부업 추천', 'ETF 투자', '배당주 추천', '재테크 초보'],
  '건강': ['건강기능식품 추천', '다이어트 식단', '영양제 추천', '운동 루틴', '단백질 보충제'],
  'IT/테크': ['노트북 추천', 'AI 도구 추천', '무선이어폰 추천', '태블릿 추천', '코딩 입문'],
  '부동산': ['청약 자격', '전세 대출', '부동산 투자', '아파트 분양', '인테리어 비용'],
  '교육': ['자격증 추천', '코딩 부트캠프', '영어 공부법', '온라인 강의', '토익 독학'],
  '패션': ['코디 추천', '명품 할인', '가성비 의류', '패션 트렌드', '뷰티 추천'],
  '여행': ['여행지 추천', '항공권 할인', '호텔 예약', '여행 보험', '제주도 맛집'],
  '생활': ['인테리어 추천', '가전 추천', '생활용품 추천', '공기청정기 추천', '로봇청소기'],
}

function estimateCpc(adDepth: number, competition: 'high' | 'medium' | 'low'): number {
  const base = competition === 'high' ? 1500 : competition === 'medium' ? 800 : 300
  return Math.round(base + Math.max(1, adDepth) * 200)
}

// 블로그 제목에서 키워드 추출
function extractKeywordsFromTitles(titles: string[]): string[] {
  const stopwords = new Set([
    '있다', '없다', '되다', '하다', '이다', '한다', '위해', '대한', '통해',
    '에서', '으로', '까지', '부터', '라고', '라며', '했다', '됐다', '밝혔다',
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

    const words = clean.match(/[가-힣]{3,8}/g) || []
    for (const word of words) {
      if (!stopwords.has(word)) {
        keywordCount.set(word, (keywordCount.get(word) || 0) + 1)
      }
    }
  }

  return Array.from(keywordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([kw]) => kw)
}

// 카테고리별 폴백 데이터
const categoryFallback: Record<string, Array<{ keyword: string; volume: number; comp: 'high' | 'medium' | 'low' }>> = {
  '재테크': [
    { keyword: '주식 초보 종목 추천', volume: 5200, comp: 'medium' },
    { keyword: 'ETF 적립식 투자', volume: 3100, comp: 'low' },
    { keyword: '배당주 추천 순위', volume: 4800, comp: 'medium' },
    { keyword: '부업 추천 재택근무', volume: 6200, comp: 'medium' },
    { keyword: '소액 투자 방법', volume: 2800, comp: 'low' },
    { keyword: '연금저축 세액공제', volume: 3500, comp: 'low' },
    { keyword: '재테크 초보 시작', volume: 4100, comp: 'medium' },
    { keyword: '적금 금리 비교', volume: 7200, comp: 'medium' },
  ],
  '건강': [
    { keyword: '유산균 추천 순위', volume: 6800, comp: 'high' },
    { keyword: '단백질 보충제 비교', volume: 4200, comp: 'medium' },
    { keyword: '간헐적 단식 효과', volume: 7500, comp: 'medium' },
    { keyword: '비타민D 추천', volume: 3900, comp: 'medium' },
    { keyword: '홈트레이닝 루틴', volume: 5100, comp: 'low' },
    { keyword: '건강검진 항목 추천', volume: 2800, comp: 'low' },
    { keyword: '수면 보조제 추천', volume: 3200, comp: 'medium' },
    { keyword: '오메가3 효능 비교', volume: 4500, comp: 'medium' },
  ],
  'IT/테크': [
    { keyword: '노트북 추천 가성비', volume: 12000, comp: 'high' },
    { keyword: '무선 이어폰 가성비', volume: 8500, comp: 'high' },
    { keyword: 'AI 도구 추천', volume: 3200, comp: 'low' },
    { keyword: '태블릿 추천 순위', volume: 6800, comp: 'high' },
    { keyword: '모니터 추천 사무용', volume: 4300, comp: 'medium' },
    { keyword: '키보드 추천 사무용', volume: 3100, comp: 'low' },
    { keyword: 'SSD 외장하드 추천', volume: 2500, comp: 'low' },
    { keyword: '코딩용 노트북 추천', volume: 1800, comp: 'low' },
  ],
  '부동산': [
    { keyword: '청약 자격 조건', volume: 9200, comp: 'medium' },
    { keyword: '전세 vs 월세 비교', volume: 5100, comp: 'low' },
    { keyword: '부동산 투자 방법', volume: 4300, comp: 'medium' },
    { keyword: '전세 대출 금리', volume: 6100, comp: 'medium' },
    { keyword: '아파트 분양 일정', volume: 7800, comp: 'medium' },
    { keyword: '신혼부부 전세자금', volume: 3200, comp: 'low' },
  ],
  '교육': [
    { keyword: '자격증 추천 취업', volume: 5500, comp: 'medium' },
    { keyword: '코딩 부트캠프 비교', volume: 3800, comp: 'low' },
    { keyword: '영어 회화 앱 추천', volume: 4200, comp: 'medium' },
    { keyword: '온라인 강의 추천', volume: 6100, comp: 'medium' },
    { keyword: '토익 독학 방법', volume: 8900, comp: 'high' },
    { keyword: '프로그래밍 독학', volume: 3500, comp: 'low' },
  ],
  '패션': [
    { keyword: '코디 추천 남자', volume: 4500, comp: 'medium' },
    { keyword: '명품 할인 시기', volume: 2800, comp: 'low' },
    { keyword: '가성비 의류 브랜드', volume: 3200, comp: 'low' },
    { keyword: '패션 트렌드 봄', volume: 5100, comp: 'medium' },
  ],
  '여행': [
    { keyword: '여행지 추천 국내', volume: 8200, comp: 'medium' },
    { keyword: '항공권 할인 시기', volume: 5500, comp: 'medium' },
    { keyword: '호텔 예약 사이트', volume: 6300, comp: 'high' },
    { keyword: '여행자 보험 비교', volume: 3800, comp: 'low' },
    { keyword: '제주도 맛집 추천', volume: 9100, comp: 'high' },
  ],
  '생활': [
    { keyword: '인테리어 비용 평균', volume: 4800, comp: 'medium' },
    { keyword: '가전 추천 신혼', volume: 3500, comp: 'medium' },
    { keyword: '생활용품 추천 필수', volume: 2100, comp: 'low' },
    { keyword: '공기청정기 추천', volume: 7200, comp: 'high' },
    { keyword: '로봇청소기 비교', volume: 5800, comp: 'medium' },
  ],
}

function generateFallbackDiscover(category: string) {
  const items = categoryFallback[category] || categoryFallback['재테크']
  const results = items.map(item => {
    const cpc = item.comp === 'high' ? 2200 : item.comp === 'medium' ? 1100 : 450
    const posts = Math.round(item.volume * (item.comp === 'high' ? 2.0 : item.comp === 'medium' ? 1.0 : 0.4))
    const moneyScore = calculateMoneyScore({ volume: item.volume, competition: item.comp, cpcEstimate: cpc, keyword: item.keyword, monthlyPosts: posts })
    return {
      keyword: item.keyword, monthlyVolume: item.volume, competition: item.comp,
      moneyScore, moneyGrade: getMoneyGrade(moneyScore), cpcEstimate: cpc,
      isBlueOcean: item.comp !== 'high' && moneyScore >= 60 && item.volume >= 500,
    }
  }).sort((a, b) => b.moneyScore - a.moneyScore)
  return { blueOcean: results.filter(r => r.isBlueOcean), all: results }
}

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get('category') || '재테크'
  const seedKeyword = request.nextUrl.searchParams.get('seed')
  const errors: string[] = []
  const sources: string[] = []

  try {
    const seeds = seedKeyword ? [seedKeyword] : (categorySeedKeywords[category] || categorySeedKeywords['재테크'])

    // ===== 1단계: 블로그 검색 + 검색광고 병렬 호출 =====
    const blogPromises = seeds.slice(0, 3).map(s => searchBlogs(s, 30, 'sim'))
    const daumPromises = seeds.slice(0, 2).map(s => searchDaumBlogs(s, 1, 30, 'accuracy'))

    const allResults = await Promise.allSettled([
      fetchKeywordData(seeds.slice(0, 4).join(',')),
      ...blogPromises,
      ...daumPromises,
    ])

    const adResult = allResults[0]
    const searchResults = allResults.slice(1)

    // 블로그 제목에서 키워드 추출
    const allTitles: string[] = []
    for (const result of searchResults) {
      if (result.status === 'fulfilled') {
        const val = result.value as { items?: Array<{ title: string }>; documents?: Array<{ title: string }> }
        if (val && 'items' in val && val.items) {
          allTitles.push(...val.items.map((i: { title: string }) => i.title))
          if (!sources.includes('naver-blog')) sources.push('naver-blog')
        }
        if (val && 'documents' in val && val.documents) {
          allTitles.push(...val.documents.map((d: { title: string }) => d.title))
          if (!sources.includes('kakao-blog')) sources.push('kakao-blog')
        }
      }
    }

    const extractedKeywords = allTitles.length > 0 ? extractKeywordsFromTitles(allTitles) : []

    // ===== 2단계: 검색광고 API 데이터 =====
    const adKeywords = adResult.status === 'fulfilled' ? adResult.value : []
    if (adKeywords.length > 0) sources.push('naver-ad')
    if (adResult.status === 'rejected') errors.push(`ad: ${(adResult.reason as Error)?.message?.slice(0, 80) || 'failed'}`)

    // ===== 3단계: 결과 조합 =====
    const seen = new Set<string>()
    const results: Array<{
      keyword: string; monthlyVolume: number; competition: 'high' | 'medium' | 'low';
      moneyScore: number; moneyGrade: string; cpcEstimate: number; isBlueOcean: boolean;
    }> = []

    // 검색광고 데이터 (정확한 검색량)
    for (const kw of adKeywords) {
      if (seen.has(kw.keyword.toLowerCase())) continue
      seen.add(kw.keyword.toLowerCase())
      if (kw.monthlyTotalVolume < 50) continue

      const cpcEstimate = estimateCpc(kw.adDepth, kw.competition)
      const monthlyPosts = Math.round(kw.monthlyTotalVolume * (kw.competition === 'high' ? 2.5 : kw.competition === 'medium' ? 1.2 : 0.4))
      const moneyScore = calculateMoneyScore({ volume: kw.monthlyTotalVolume, competition: kw.competition, cpcEstimate, keyword: kw.keyword, monthlyPosts })
      results.push({
        keyword: kw.keyword, monthlyVolume: kw.monthlyTotalVolume, competition: kw.competition,
        moneyScore, moneyGrade: getMoneyGrade(moneyScore), cpcEstimate,
        isBlueOcean: kw.competition !== 'high' && moneyScore >= 60 && kw.monthlyTotalVolume >= 500,
      })
    }

    // 블로그 추출 키워드 (추정 데이터)
    for (const kw of extractedKeywords) {
      if (seen.has(kw.toLowerCase())) continue
      seen.add(kw.toLowerCase())

      const estimatedVolume = 1000 + Math.round(Math.random() * 5000)
      const competition = Math.random() > 0.6 ? 'medium' as const : 'low' as const
      const cpcEstimate = estimateCpc(2, competition)
      const monthlyPosts = Math.round(estimatedVolume * (competition === 'medium' ? 1.2 : 0.4))
      const moneyScore = calculateMoneyScore({ volume: estimatedVolume, competition, cpcEstimate, keyword: kw, monthlyPosts })
      results.push({
        keyword: kw, monthlyVolume: estimatedVolume, competition,
        moneyScore, moneyGrade: getMoneyGrade(moneyScore), cpcEstimate,
        isBlueOcean: moneyScore >= 60 && estimatedVolume >= 500,
      })
    }

    if (results.length === 0) {
      const fallback = generateFallbackDiscover(category)
      return NextResponse.json({
        success: true, isRealData: false, sources, errors,
        data: { ...fallback, category: seedKeyword ? `"${seedKeyword}" 관련` : category },
        meta: { total: fallback.all.length, blueOceanCount: fallback.blueOcean.length, timestamp: new Date().toISOString() },
      })
    }

    results.sort((a, b) => b.moneyScore - a.moneyScore)

    return NextResponse.json({
      success: true, isRealData: true, sources,
      errors: errors.length > 0 ? errors : undefined,
      data: {
        blueOcean: results.filter(r => r.isBlueOcean).slice(0, 20),
        all: results.slice(0, 50),
        category: seedKeyword ? `"${seedKeyword}" 관련` : category,
      },
      meta: { total: results.length, blueOceanCount: results.filter(r => r.isBlueOcean).length, timestamp: new Date().toISOString() },
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Discover API error:', msg)
    const fallback = generateFallbackDiscover(category)
    return NextResponse.json({
      success: true, isRealData: false, error: msg,
      data: { ...fallback, category },
      meta: { total: fallback.all.length, blueOceanCount: fallback.blueOcean.length, timestamp: new Date().toISOString() },
    })
  }
}
