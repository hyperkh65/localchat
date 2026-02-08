import { NextRequest, NextResponse } from 'next/server'
import { analyzeKeywordReal } from '@/lib/analyze-keyword'
import { generateDemoAnalysis } from '@/lib/keyword-engine'

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
    const result = await analyzeKeywordReal(trimmed)

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
      data: demoData,
      dataSources: { adApi: false, trendApi: false, blogApi: false, daumApi: false },
    })
  }
}
