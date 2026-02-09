import { NextRequest, NextResponse } from 'next/server'
import { analyzeKeywordTrend, analyzeTrendingKeywords, isGeminiConfigured } from '@/lib/gemini'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get('keyword')
  const type = request.nextUrl.searchParams.get('type') || 'keyword' // keyword | trending

  if (!isGeminiConfigured()) {
    return NextResponse.json({
      success: false,
      error: 'Gemini API 키가 설정되지 않았습니다. 환경설정에서 GEMINI_API_KEY를 추가하세요.',
      data: null,
    })
  }

  try {
    // 캐시 확인 (1시간)
    const cutoff = new Date(Date.now() - 3600 * 1000).toISOString()
    if (keyword) {
      const { data: cached } = await supabase
        .from('ai_analysis_cache')
        .select('*')
        .eq('keyword', keyword)
        .eq('analysis_type', type)
        .gte('created_at', cutoff)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (cached) {
        return NextResponse.json({ success: true, data: cached.result_data, source: 'cache' })
      }
    }

    if (type === 'trending') {
      // 트렌딩 키워드 목록 분석
      const keywords = keyword ? keyword.split(',').map(k => k.trim()) : []
      if (keywords.length === 0) {
        return NextResponse.json({ success: false, error: '키워드 목록이 필요합니다.', data: null })
      }

      const result = await analyzeTrendingKeywords(keywords)
      if (!result) {
        return NextResponse.json({ success: false, error: 'AI 분석 실패 (토큰 제한일 수 있음)', data: null })
      }

      // 캐시 저장
      await supabase.from('ai_analysis_cache').insert({
        keyword: keywords.join(','),
        analysis_type: 'trending',
        result_data: result,
      }).then(() => {})

      return NextResponse.json({ success: true, data: result })
    }

    // 단일 키워드 분석
    if (!keyword) {
      return NextResponse.json({ success: false, error: '키워드를 입력하세요.', data: null })
    }

    const result = await analyzeKeywordTrend(keyword)
    if (!result) {
      return NextResponse.json({ success: false, error: 'AI 분석 실패 (토큰 제한일 수 있음)', data: null })
    }

    // 캐시 저장
    await supabase.from('ai_analysis_cache').insert({
      keyword,
      analysis_type: 'keyword',
      result_data: result,
    }).then(() => {})

    return NextResponse.json({ success: true, data: result })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'unknown'
    return NextResponse.json({ success: false, error: msg, data: null })
  }
}
