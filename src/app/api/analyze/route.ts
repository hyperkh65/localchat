import { NextRequest, NextResponse } from 'next/server'
import { analyzeKeywordReal } from '@/lib/analyze-keyword'

export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get('keyword')

  if (!keyword || keyword.trim().length === 0) {
    return NextResponse.json(
      { error: '키워드를 입력해주세요' },
      { status: 400 }
    )
  }

  try {
    const result = await analyzeKeywordReal(keyword.trim())

    return NextResponse.json({
      success: true,
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

    return NextResponse.json(
      { error: `분석 실패: ${message}` },
      { status: 500 }
    )
  }
}
