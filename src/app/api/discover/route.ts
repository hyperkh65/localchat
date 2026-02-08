/**
 * 블루오션 키워드 발굴 API
 * - 카테고리별 시드 키워드로 연관 키워드 조회
 * - API 실패 시 데모 폴백
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchKeywordData } from '@/lib/naver-ad-api'
import { calculateMoneyScore, getMoneyGrade } from '@/lib/keyword-engine'

const categorySeedKeywords: Record<string, string[]> = {
  '재테크': ['주식 투자 방법', '부업 추천', 'ETF 투자', '배당주 추천'],
  '건강': ['건강기능식품 추천', '다이어트 식단', '영양제 추천', '운동 루틴'],
  'IT/테크': ['노트북 추천', 'AI 도구 추천', '무선이어폰 추천', '태블릿 추천'],
  '부동산': ['청약 자격', '전세 대출', '부동산 투자', '아파트 분양'],
  '교육': ['자격증 추천', '코딩 부트캠프', '영어 공부법', '온라인 강의'],
  '패션': ['코디 추천', '명품 할인', '가성비 의류', '패션 트렌드'],
  '여행': ['여행지 추천', '항공권 할인', '호텔 예약', '여행 보험'],
  '생활': ['인테리어 추천', '가전 추천', '생활용품 추천', '청소 꿀팁'],
}

function estimateCpc(adDepth: number, competition: 'high' | 'medium' | 'low'): number {
  const base = competition === 'high' ? 1500 : competition === 'medium' ? 800 : 300
  return Math.round(base + Math.max(1, adDepth) * 200)
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
    const moneyScore = calculateMoneyScore({
      volume: item.volume,
      competition: item.comp,
      cpcEstimate: cpc,
      keyword: item.keyword,
      monthlyPosts: posts,
    })
    return {
      keyword: item.keyword,
      monthlyVolume: item.volume,
      competition: item.comp,
      moneyScore,
      moneyGrade: getMoneyGrade(moneyScore),
      cpcEstimate: cpc,
      isBlueOcean: item.comp !== 'high' && moneyScore >= 60 && item.volume >= 500,
    }
  }).sort((a, b) => b.moneyScore - a.moneyScore)

  return {
    blueOcean: results.filter(r => r.isBlueOcean),
    all: results,
  }
}

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get('category') || '재테크'
  const seedKeyword = request.nextUrl.searchParams.get('seed')

  try {
    const keywords = seedKeyword ? [seedKeyword] : (categorySeedKeywords[category] || categorySeedKeywords['재테크'])

    const batchResults = await Promise.allSettled(
      keywords.map(kw => fetchKeywordData(kw))
    )

    const allKeywordData = batchResults
      .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof fetchKeywordData>>> => r.status === 'fulfilled')
      .flatMap(r => r.value)

    // API 실패 시 폴백
    if (allKeywordData.length === 0) {
      const fallback = generateFallbackDiscover(category)
      return NextResponse.json({
        success: true,
        isRealData: false,
        data: { ...fallback, category: seedKeyword ? `"${seedKeyword}" 관련` : category },
        meta: { total: fallback.all.length, blueOceanCount: fallback.blueOcean.length, timestamp: new Date().toISOString() },
      })
    }

    const seen = new Set<string>()
    const results = allKeywordData
      .filter(kw => {
        if (seen.has(kw.keyword)) return false
        seen.add(kw.keyword)
        return kw.monthlyTotalVolume >= 50
      })
      .map(kw => {
        const cpcEstimate = estimateCpc(kw.adDepth, kw.competition)
        const monthlyPosts = Math.round(kw.monthlyTotalVolume * (kw.competition === 'high' ? 2.5 : kw.competition === 'medium' ? 1.2 : 0.4))
        const moneyScore = calculateMoneyScore({
          volume: kw.monthlyTotalVolume,
          competition: kw.competition,
          cpcEstimate,
          keyword: kw.keyword,
          monthlyPosts,
        })
        return {
          keyword: kw.keyword,
          monthlyVolume: kw.monthlyTotalVolume,
          competition: kw.competition,
          moneyScore,
          moneyGrade: getMoneyGrade(moneyScore),
          cpcEstimate,
          isBlueOcean: kw.competition !== 'high' && moneyScore >= 60 && kw.monthlyTotalVolume >= 500,
        }
      })
      .sort((a, b) => b.moneyScore - a.moneyScore)

    return NextResponse.json({
      success: true,
      isRealData: true,
      data: {
        blueOcean: results.filter(r => r.isBlueOcean).slice(0, 20),
        all: results.slice(0, 50),
        category: seedKeyword ? `"${seedKeyword}" 관련` : category,
      },
      meta: { total: results.length, blueOceanCount: results.filter(r => r.isBlueOcean).length, timestamp: new Date().toISOString() },
    })
  } catch (error: unknown) {
    console.error('Discover API error:', error instanceof Error ? error.message : error)
    const fallback = generateFallbackDiscover(category)
    return NextResponse.json({
      success: true,
      isRealData: false,
      data: { ...fallback, category },
      meta: { total: fallback.all.length, blueOceanCount: fallback.blueOcean.length, timestamp: new Date().toISOString() },
    })
  }
}
