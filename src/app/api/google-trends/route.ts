import { NextResponse } from 'next/server'
import { fetchAllGoogleTrends } from '@/lib/google-trends'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET() {
  try {
    // 캐시 확인 (1시간)
    const cutoff = new Date(Date.now() - 3600 * 1000).toISOString()
    const { data: cached } = await supabase
      .from('google_trends_cache')
      .select('*')
      .gte('captured_at', cutoff)
      .order('captured_at', { ascending: false })
      .limit(1)
      .single()

    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached.trends_data,
        source: 'cache',
        capturedAt: cached.captured_at,
      })
    }

    // Google Trends 데이터 가져오기
    const trends = await fetchAllGoogleTrends()

    const hasData = trends.daily.length > 0 || trends.realtime.length > 0 || trends.rssKeywords.length > 0

    if (hasData) {
      // DB 캐시 저장
      await supabase.from('google_trends_cache').insert({
        trends_data: trends,
        geo: 'KR',
      }).then(() => {})
    }

    return NextResponse.json({
      success: true,
      data: trends,
      source: 'live',
      meta: {
        dailyCount: trends.daily.length,
        realtimeCount: trends.realtime.length,
        rssCount: trends.rssKeywords.length,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'unknown'
    return NextResponse.json({
      success: false,
      error: msg,
      data: { daily: [], realtime: [], rssKeywords: [] },
    })
  }
}
