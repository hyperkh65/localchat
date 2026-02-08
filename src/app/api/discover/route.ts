/**
 * 블루오션 키워드 발굴 API
 * - 카테고리별 시드 키워드로 연관 키워드 조회
 * - 검색광고 API 실제 데이터 기반
 * - 낮은 경쟁도 + 높은 Money Score = 블루오션
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchKeywordData } from '@/lib/naver-ad-api'
import { calculateMoneyScore, getMoneyGrade } from '@/lib/keyword-engine'

// 카테고리별 시드 키워드 (실제 인기 키워드 기반)
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

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get('category') || '재테크'
  const seedKeyword = request.nextUrl.searchParams.get('seed') // 사용자 입력 시드 키워드

  try {
    let keywords: string[]

    if (seedKeyword) {
      keywords = [seedKeyword]
    } else {
      keywords = categorySeedKeywords[category] || categorySeedKeywords['재테크']
    }

    // 검색광고 API로 연관 키워드 + 실제 데이터 조회
    const batchResults = await Promise.allSettled(
      keywords.map(kw => fetchKeywordData(kw))
    )

    const allKeywordData = batchResults
      .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof fetchKeywordData>>> => r.status === 'fulfilled')
      .flatMap(r => r.value)

    // 중복 제거 & Money Score 계산
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
          pcVolume: kw.monthlyPcVolume,
          mobileVolume: kw.monthlyMobileVolume,
          competition: kw.competition,
          moneyScore,
          moneyGrade: getMoneyGrade(moneyScore),
          cpcEstimate,
          isBlueOcean: kw.competition !== 'high' && moneyScore >= 60 && kw.monthlyTotalVolume >= 500,
        }
      })
      .sort((a, b) => b.moneyScore - a.moneyScore)

    // 블루오션 키워드 분리
    const blueOcean = results.filter(r => r.isBlueOcean).slice(0, 20)
    const allResults = results.slice(0, 50)

    return NextResponse.json({
      success: true,
      data: {
        blueOcean,
        all: allResults,
        category: seedKeyword ? `"${seedKeyword}" 관련` : category,
      },
      meta: {
        total: results.length,
        blueOceanCount: blueOcean.length,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Discover API error:', message)
    return NextResponse.json({ error: `키워드 발굴 실패: ${message}` }, { status: 500 })
  }
}
