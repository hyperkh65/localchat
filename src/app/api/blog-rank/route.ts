/**
 * 블로그 랭킹 API
 *
 * 벤치마킹: 판다랭크, 키자드, 키워드마스터
 * - 키워드별 블로그 TOP 30 랭킹
 * - 상위 포스트 역분석 (제목 패턴, 플랫폼 분포, 키워드 밀도)
 * - 내 블로그 순위 확인
 * - 콘텐츠 포화도 & 키워드 난이도
 */

import { NextRequest, NextResponse } from 'next/server'
import { getBlogRankings, checkMyBlogRank, calculateSaturationIndex, getKeywordDifficulty } from '@/lib/blog-rank'
import { fetchKeywordData } from '@/lib/naver-ad-api'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get('keyword')
  const blogUrl = request.nextUrl.searchParams.get('blogUrl')

  if (!keyword || keyword.trim().length === 0) {
    return NextResponse.json({ error: '키워드를 입력하세요' }, { status: 400 })
  }

  const trimmed = keyword.trim()

  try {
    // 블로그 랭킹 + 검색광고 데이터 병렬 호출
    const [rankResult, adResult] = await Promise.allSettled([
      getBlogRankings(trimmed),
      fetchKeywordData(trimmed),
    ])

    const rankData = rankResult.status === 'fulfilled' ? rankResult.value : { rankings: [], analysis: null, sources: [] }
    const adData = adResult.status === 'fulfilled' && adResult.value.length > 0 ? adResult.value[0] : null

    // 검색량/경쟁도 데이터
    const monthlyVolume = adData?.monthlyTotalVolume || 0
    const competition = adData?.competition || 'medium'
    const monthlyPosts = rankData.rankings.length > 0
      ? Math.round(rankData.rankings.length * 100) // 추정
      : Math.round(monthlyVolume * (competition === 'high' ? 2 : competition === 'medium' ? 1 : 0.4))

    // 포화도 & 난이도 계산
    const saturation = calculateSaturationIndex(monthlyPosts, monthlyVolume)
    const difficulty = getKeywordDifficulty(monthlyVolume, competition as 'high' | 'medium' | 'low', saturation.index)

    // 내 블로그 순위 (blogUrl이 있을 때만)
    let myRank = null
    if (blogUrl && blogUrl.trim()) {
      try {
        myRank = await checkMyBlogRank(trimmed, blogUrl.trim())
      } catch {
        // 내 블로그 순위 확인 실패해도 OK
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        keyword: trimmed,
        rankings: rankData.rankings,
        analysis: rankData.analysis,
        keywordInfo: {
          monthlyVolume,
          competition,
          monthlyPosts,
          saturation,
          difficulty,
        },
        myRank,
      },
      sources: rankData.sources,
      meta: {
        totalResults: rankData.rankings.length,
        hasAdData: !!adData,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Blog Rank API error:', msg)
    return NextResponse.json({
      success: false,
      error: msg,
      data: null,
    })
  }
}
