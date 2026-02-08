/**
 * 환경변수 설정 상태 확인 API
 * - Vercel에 설정된 API 키들이 정상적으로 로드되는지 확인
 * - 키 값 자체는 노출하지 않고, 설정 여부만 반환
 */

import { NextResponse } from 'next/server'

export async function GET() {
  const envStatus = {
    naverAd: {
      customerId: !!process.env.NAVER_AD_CUSTOMER_ID,
      apiLicense: !!process.env.NAVER_AD_API_LICENSE,
      secretKey: !!process.env.NAVER_AD_SECRET_KEY,
      configured: !!(process.env.NAVER_AD_CUSTOMER_ID && process.env.NAVER_AD_API_LICENSE && process.env.NAVER_AD_SECRET_KEY),
      maskedId: process.env.NAVER_AD_CUSTOMER_ID
        ? process.env.NAVER_AD_CUSTOMER_ID.slice(0, 3) + '****'
        : null,
    },
    naverDev: {
      clientId: !!process.env.NAVER_CLIENT_ID,
      clientSecret: !!process.env.NAVER_CLIENT_SECRET,
      configured: !!(process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET),
      maskedId: process.env.NAVER_CLIENT_ID
        ? process.env.NAVER_CLIENT_ID.slice(0, 4) + '****'
        : null,
    },
    kakao: {
      restApiKey: !!process.env.KAKAO_REST_API_KEY,
      adminKey: !!process.env.KAKAO_ADMIN_KEY,
      configured: !!(process.env.KAKAO_REST_API_KEY),
      maskedKey: process.env.KAKAO_REST_API_KEY
        ? process.env.KAKAO_REST_API_KEY.slice(0, 4) + '****'
        : null,
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
