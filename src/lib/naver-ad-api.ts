/**
 * Naver Search Ads API Client
 *
 * API Docs: https://naver.github.io/searchad-apidoc/
 * Endpoint: GET https://api.searchad.naver.com/keywordstool
 *
 * Authentication: HMAC-SHA256 signature
 */

import crypto from 'crypto'

const API_BASE = 'https://api.searchad.naver.com'

interface NaverAdConfig {
  customerId: string
  apiLicense: string
  secretKey: string
}

function getConfig(): NaverAdConfig {
  const customerId = process.env.NAVER_AD_CUSTOMER_ID
  const apiLicense = process.env.NAVER_AD_API_LICENSE
  const secretKey = process.env.NAVER_AD_SECRET_KEY

  if (!customerId || !apiLicense || !secretKey) {
    throw new Error('Naver Search Ads API credentials are not configured')
  }

  return { customerId, apiLicense, secretKey }
}

function generateSignature(timestamp: string, method: string, path: string, secretKey: string): string {
  const message = `${timestamp}.${method}.${path}`
  const hmac = crypto.createHmac('sha256', secretKey)
  hmac.update(message)
  return hmac.digest('base64')
}

function buildHeaders(method: string, path: string): Record<string, string> {
  const config = getConfig()
  const timestamp = String(Date.now())
  const signature = generateSignature(timestamp, method, path, config.secretKey)

  return {
    'Content-Type': 'application/json; charset=UTF-8',
    'X-Timestamp': timestamp,
    'X-API-KEY': config.apiLicense,
    'X-Customer': config.customerId,
    'X-Signature': signature,
  }
}

// --- Raw API response types ---

export interface NaverKeywordRaw {
  relKeyword: string
  monthlyPcQcCnt: number | '<10'
  monthlyMobileQcCnt: number | '<10'
  monthlyAvePcClkCnt: number
  monthlyAvePcCtr: number
  monthlyAveMobileClkCnt: number
  monthlyAveMobileCtr: number
  plAvgDepth: number
  compIdx: string // '높음' | '중간' | '낮음'
}

export interface NaverKeywordToolResponse {
  keywordList: NaverKeywordRaw[]
}

// --- Cleaned types ---

export interface NaverKeywordData {
  keyword: string
  monthlyPcVolume: number
  monthlyMobileVolume: number
  monthlyTotalVolume: number
  avgPcClicks: number
  avgPcCtr: number
  avgMobileClicks: number
  avgMobileCtr: number
  adDepth: number
  competition: 'high' | 'medium' | 'low'
  competitionRaw: string
}

/**
 * Fetch keyword data from Naver Search Ads API
 *
 * @param keywords - Comma-separated keywords (up to 5)
 * @param showDetail - Whether to show detailed metrics
 */
export async function fetchKeywordData(keywords: string, showDetail: boolean = true): Promise<NaverKeywordData[]> {
  const path = '/keywordstool'
  const method = 'GET'
  const headers = buildHeaders(method, path)

  const params = new URLSearchParams({
    hintKeywords: keywords,
    showDetail: showDetail ? '1' : '0',
  })

  const url = `${API_BASE}${path}?${params.toString()}`

  const response = await fetch(url, {
    method,
    headers,
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Naver API error (${response.status}): ${errorText}`)
  }

  const data: NaverKeywordToolResponse = await response.json()

  return (data.keywordList || []).map(cleanKeywordData)
}

function parseVolume(value: number | '<10'): number {
  if (value === '<10') return 5 // estimate for "<10"
  return typeof value === 'number' ? value : 0
}

function mapCompetition(compIdx: string): 'high' | 'medium' | 'low' {
  if (compIdx === '높음') return 'high'
  if (compIdx === '중간') return 'medium'
  return 'low'
}

function cleanKeywordData(raw: NaverKeywordRaw): NaverKeywordData {
  const pcVol = parseVolume(raw.monthlyPcQcCnt)
  const mobileVol = parseVolume(raw.monthlyMobileQcCnt)

  return {
    keyword: raw.relKeyword,
    monthlyPcVolume: pcVol,
    monthlyMobileVolume: mobileVol,
    monthlyTotalVolume: pcVol + mobileVol,
    avgPcClicks: raw.monthlyAvePcClkCnt || 0,
    avgPcCtr: raw.monthlyAvePcCtr || 0,
    avgMobileClicks: raw.monthlyAveMobileClkCnt || 0,
    avgMobileCtr: raw.monthlyAveMobileCtr || 0,
    adDepth: raw.plAvgDepth || 0,
    competition: mapCompetition(raw.compIdx),
    competitionRaw: raw.compIdx,
  }
}
