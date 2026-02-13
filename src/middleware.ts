import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// 로그인 없이 접근 가능한 경로 (최소한만 허용)
const PUBLIC_PATHS = ['/login', '/signup', '/api/']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Supabase 키 없으면 인증 스킵 (환경변수 미설정 시)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next()
  }

  // 정적 파일은 패스
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // 공개 경로는 패스 (로그인, 회원가입, API만)
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p))) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // 로그인 안 된 상태 → 로그인 페이지로 리다이렉트
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  // 로그인된 상태에서 랜딩페이지(/) 접근 → 대시보드로 리다이렉트
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/analyze/:path*',
    '/trending/:path*',
    '/discover/:path*',
    '/blog-rank/:path*',
    '/content-guide/:path*',
    '/settings/:path*',
    '/pricing/:path*',
  ],
}
