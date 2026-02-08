/**
 * API 디버그 엔드포인트
 * 각 API를 개별 테스트하여 정확한 에러 원인 파악
 */

import { NextResponse } from 'next/server'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 10000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    return res
  } finally {
    clearTimeout(timer)
  }
}

export async function GET() {
  const results: Record<string, unknown> = {}

  // 1) 네이버 검색광고 API 테스트
  try {
    const customerId = process.env.NAVER_AD_CUSTOMER_ID
    const apiLicense = process.env.NAVER_AD_API_LICENSE
    const secretKey = process.env.NAVER_AD_SECRET_KEY

    if (!customerId || !apiLicense || !secretKey) {
      results.naverAd = { status: 'error', reason: 'ENV_MISSING', detail: { customerId: !!customerId, apiLicense: !!apiLicense, secretKey: !!secretKey } }
    } else {
      const timestamp = String(Date.now())
      const method = 'GET'
      const path = '/keywordstool'
      const message = `${timestamp}.${method}.${path}`
      const hmac = crypto.createHmac('sha256', secretKey)
      hmac.update(message)
      const signature = hmac.digest('base64')

      const params = new URLSearchParams({ hintKeywords: '노트북', showDetail: '1' })
      const url = `https://api.searchad.naver.com${path}?${params.toString()}`

      const res = await fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Timestamp': timestamp,
          'X-API-KEY': apiLicense,
          'X-Customer': customerId,
          'X-Signature': signature,
        },
      })

      const body = await res.text()
      if (res.ok) {
        const json = JSON.parse(body)
        results.naverAd = {
          status: 'ok',
          httpStatus: res.status,
          keywordCount: json.keywordList?.length || 0,
          sampleKeyword: json.keywordList?.[0]?.relKeyword || null,
        }
      } else {
        results.naverAd = { status: 'api_error', httpStatus: res.status, body: body.slice(0, 500) }
      }
    }
  } catch (e: unknown) {
    results.naverAd = { status: 'exception', message: e instanceof Error ? e.message : String(e) }
  }

  // 2) 네이버 검색 API (뉴스) 테스트
  try {
    const clientId = process.env.NAVER_CLIENT_ID
    const clientSecret = process.env.NAVER_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      results.naverSearch = { status: 'error', reason: 'ENV_MISSING', detail: { clientId: !!clientId, clientSecret: !!clientSecret } }
    } else {
      const params = new URLSearchParams({ query: '오늘', display: '5', sort: 'date' })
      const res = await fetchWithTimeout(`https://openapi.naver.com/v1/search/news.json?${params}`, {
        method: 'GET',
        headers: {
          'X-Naver-Client-Id': clientId,
          'X-Naver-Client-Secret': clientSecret,
        },
      })

      const body = await res.text()
      if (res.ok) {
        const json = JSON.parse(body)
        results.naverSearch = {
          status: 'ok',
          httpStatus: res.status,
          totalResults: json.total,
          itemCount: json.items?.length || 0,
        }
      } else {
        results.naverSearch = { status: 'api_error', httpStatus: res.status, body: body.slice(0, 500) }
      }
    }
  } catch (e: unknown) {
    results.naverSearch = { status: 'exception', message: e instanceof Error ? e.message : String(e) }
  }

  // 3) 네이버 DataLab API 테스트
  try {
    const clientId = process.env.NAVER_CLIENT_ID
    const clientSecret = process.env.NAVER_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      results.naverDatalab = { status: 'error', reason: 'ENV_MISSING' }
    } else {
      const now = new Date()
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

      const res = await fetchWithTimeout('https://openapi.naver.com/v1/datalab/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Naver-Client-Id': clientId,
          'X-Naver-Client-Secret': clientSecret,
        },
        body: JSON.stringify({
          startDate: oneMonthAgo.toISOString().slice(0, 10),
          endDate: now.toISOString().slice(0, 10),
          timeUnit: 'date',
          keywordGroups: [{ groupName: '노트북', keywords: ['노트북'] }],
        }),
      })

      const body = await res.text()
      if (res.ok) {
        const json = JSON.parse(body)
        results.naverDatalab = {
          status: 'ok',
          httpStatus: res.status,
          resultCount: json.results?.length || 0,
        }
      } else {
        results.naverDatalab = { status: 'api_error', httpStatus: res.status, body: body.slice(0, 500) }
      }
    }
  } catch (e: unknown) {
    results.naverDatalab = { status: 'exception', message: e instanceof Error ? e.message : String(e) }
  }

  // 4) 카카오 API 테스트
  try {
    const apiKey = process.env.KAKAO_REST_API_KEY

    if (!apiKey) {
      results.kakao = { status: 'error', reason: 'ENV_MISSING' }
    } else {
      const params = new URLSearchParams({ query: '인기', page: '1', size: '5' })
      const res = await fetchWithTimeout(`https://dapi.kakao.com/v2/search/web?${params}`, {
        method: 'GET',
        headers: { Authorization: `KakaoAK ${apiKey}` },
      })

      const body = await res.text()
      if (res.ok) {
        const json = JSON.parse(body)
        results.kakao = {
          status: 'ok',
          httpStatus: res.status,
          totalCount: json.meta?.total_count || 0,
          docCount: json.documents?.length || 0,
        }
      } else {
        results.kakao = { status: 'api_error', httpStatus: res.status, body: body.slice(0, 500) }
      }
    }
  } catch (e: unknown) {
    results.kakao = { status: 'exception', message: e instanceof Error ? e.message : String(e) }
  }

  // 요약
  const allOk = Object.values(results).every((r: unknown) => (r as Record<string, unknown>).status === 'ok')

  return NextResponse.json({
    success: true,
    allOk,
    timestamp: new Date().toISOString(),
    runtime: process.env.NEXT_RUNTIME || 'nodejs',
    results,
  })
}
