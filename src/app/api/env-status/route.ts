/**
 * 환경변수 설정 상태 확인 API
 * - 키 값은 절대 노출하지 않음 (설정 여부만 boolean 반환)
 */

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const envStatus = {
    naverAd: {
      customerId: !!process.env.NAVER_AD_CUSTOMER_ID?.trim(),
      apiLicense: !!process.env.NAVER_AD_API_LICENSE?.trim(),
      secretKey: !!process.env.NAVER_AD_SECRET_KEY?.trim(),
      configured: !!(process.env.NAVER_AD_CUSTOMER_ID?.trim() && process.env.NAVER_AD_API_LICENSE?.trim() && process.env.NAVER_AD_SECRET_KEY?.trim()),
    },
    naverDev: {
      clientId: !!process.env.NAVER_CLIENT_ID?.trim(),
      clientSecret: !!process.env.NAVER_CLIENT_SECRET?.trim(),
      configured: !!(process.env.NAVER_CLIENT_ID?.trim() && process.env.NAVER_CLIENT_SECRET?.trim()),
    },
    kakao: {
      restApiKey: !!process.env.KAKAO_REST_API_KEY?.trim(),
      adminKey: !!process.env.KAKAO_ADMIN_KEY?.trim(),
      configured: !!(process.env.KAKAO_REST_API_KEY?.trim()),
    },
    gemini: {
      apiKey: !!process.env.GEMINI_API_KEY?.trim(),
      configured: !!process.env.GEMINI_API_KEY?.trim(),
    },
    supabase: {
      url: !!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
      anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
      configured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()),
    },
  }

  const allConfigured = envStatus.naverAd.configured && envStatus.naverDev.configured && envStatus.kakao.configured

  return NextResponse.json({
    success: true,
    envStatus,
    allConfigured,
    summary: {
      total: 7,
      configured: [
        envStatus.naverAd.customerId,
        envStatus.naverAd.apiLicense,
        envStatus.naverAd.secretKey,
        envStatus.naverDev.clientId,
        envStatus.naverDev.clientSecret,
        envStatus.kakao.restApiKey,
        envStatus.kakao.adminKey,
      ].filter(Boolean).length,
    },
  })
}
