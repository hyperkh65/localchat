import { NextRequest, NextResponse } from 'next/server'
import { analyzeKeywordReal } from '@/lib/analyze-keyword'
import { generateDemoAnalysis } from '@/lib/keyword-engine'
import { getCachedAnalysis, saveAnalysisCache, saveSearchHistory, saveDailyStats } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get('keyword')

  if (!keyword || keyword.trim().length === 0) {
    return NextResponse.json(
      { error: '키워드를 입력해주세요' },
      { status: 400 }
    )
  }

  const trimmed = keyword.trim()

  try {
    // DB 캐시 확인 (6시간 이내)
    const cached = await getCachedAnalysis(trimmed, 6)
    if (cached) {
      // 검색 기록은 캐시 히트해도 저장
      saveSearchHistory(trimmed, cached.analysis_data?.moneyScore, cached.analysis_data?.moneyGrade).catch(() => {})
      return NextResponse.json({
        success: true,
        isRealData: cached.is_real_data,
        data: cached.analysis_data,
        dataSources: cached.data_sources,
        source: 'db-cache',
      })
    }

    const result = await analyzeKeywordReal(trimmed)

    // DB에 캐시 저장 (비동기)
    saveAnalysisCache(trimmed, result.analysis, true, result.dataSources).catch(() => {})
    saveSearchHistory(trimmed, result.analysis.moneyScore, result.analysis.moneyGrade).catch(() => {})
    saveDailyStats(trimmed, {
      search_volume: result.analysis.monthlySearchVolume,
      money_score: result.analysis.moneyScore,
      competition: result.analysis.competition,
      cpc_estimate: result.analysis.cpcEstimate,
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      isRealData: true,
      data: result.analysis,
      dataSources: result.dataSources,
      relatedRaw: result.rawData.slice(0, 5).map((r) => ({
        keyword: r.keyword,
        pcVolume: r.monthlyPcVolume,
        mobileVolume: r.monthlyMobileVolume,
        competition: r.competitionRaw,
      })),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Keyword analysis error:', message)

    // API 실패 시 데모 데이터로 폴백 (에러 대신 데이터 반환)
    const demoData = generateDemoAnalysis(trimmed)
    return NextResponse.json({
      success: true,
      isRealData: false,
      error: message,
      data: demoData,
      dataSources: { adApi: false, trendApi: false, blogApi: false, daumApi: false },
    })
  }
}
