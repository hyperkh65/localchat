import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

async function getSupabaseServer() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

const PLAN_LIMITS: Record<string, { dailySearches: number; aiCalls: number }> = {
  free: { dailySearches: 10, aiCalls: 3 },
  pro: { dailySearches: 100, aiCalls: 50 },
  premium: { dailySearches: -1, aiCalls: -1 }, // unlimited
  admin: { dailySearches: -1, aiCalls: -1 },   // unlimited
}

export async function GET() {
  try {
    const supabase = await getSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ success: false, error: '프로필을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 일일 리셋 체크
    const today = new Date().toISOString().split('T')[0]
    if (profile.daily_searches_reset !== today) {
      await supabase.from('user_profiles').update({
        daily_searches_used: 0,
        daily_searches_reset: today,
        ai_calls_used: 0,
        ai_calls_reset: today,
      }).eq('id', user.id)
      profile.daily_searches_used = 0
      profile.ai_calls_used = 0
    }

    const limits = PLAN_LIMITS[profile.plan] || PLAN_LIMITS.free

    return NextResponse.json({
      success: true,
      data: {
        email: user.email,
        nickname: profile.nickname,
        plan: profile.plan,
        usage: {
          dailySearches: profile.daily_searches_used,
          dailySearchLimit: limits.dailySearches,
          aiCalls: profile.ai_calls_used,
          aiCallLimit: limits.aiCalls,
        },
        createdAt: profile.created_at,
      },
    })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'unknown' })
  }
}

// 사용량 증가
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: '로그인 필요' }, { status: 401 })
    }

    const body = await request.json()
    const { type } = body // 'search' | 'ai'

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ success: false, error: '프로필 없음' }, { status: 404 })
    }

    const limits = PLAN_LIMITS[profile.plan] || PLAN_LIMITS.free

    if (type === 'search') {
      if (limits.dailySearches !== -1 && profile.daily_searches_used >= limits.dailySearches) {
        return NextResponse.json({
          success: false,
          error: `일일 검색 한도(${limits.dailySearches}회)를 초과했습니다. 프로 플랜으로 업그레이드하세요.`,
          limitReached: true,
        })
      }
      await supabase.from('user_profiles').update({
        daily_searches_used: profile.daily_searches_used + 1,
      }).eq('id', user.id)
    }

    if (type === 'ai') {
      if (limits.aiCalls !== -1 && profile.ai_calls_used >= limits.aiCalls) {
        return NextResponse.json({
          success: false,
          error: `일일 AI 분석 한도(${limits.aiCalls}회)를 초과했습니다.`,
          limitReached: true,
        })
      }
      await supabase.from('user_profiles').update({
        ai_calls_used: profile.ai_calls_used + 1,
      }).eq('id', user.id)
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'unknown' })
  }
}
