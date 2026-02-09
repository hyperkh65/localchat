/**
 * Gemini AI 클라이언트
 * 무료 버전 (gemini-2.0-flash) 사용
 * 토큰/호출 제한 시 에러 없이 graceful fallback
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

const getGenAI = () => {
  const key = process.env.GEMINI_API_KEY?.trim()
  if (!key) return null
  return new GoogleGenerativeAI(key)
}

// 순차 호출을 위한 큐 (동시 호출 방지)
let lastCallTime = 0
const MIN_INTERVAL = 1500 // 1.5초 간격

async function waitForRateLimit() {
  const now = Date.now()
  const elapsed = now - lastCallTime
  if (elapsed < MIN_INTERVAL) {
    await new Promise(r => setTimeout(r, MIN_INTERVAL - elapsed))
  }
  lastCallTime = Date.now()
}

/**
 * Gemini에 텍스트 프롬프트 전송
 * 실패 시 null 반환 (에러 무시)
 */
export async function askGemini(prompt: string, maxTokens = 2048): Promise<string | null> {
  const genAI = getGenAI()
  if (!genAI) return null

  try {
    await waitForRateLimit()

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.7,
      },
    })

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    try {
      const result = await model.generateContent(prompt)
      clearTimeout(timeout)
      return result.response.text()
    } catch {
      clearTimeout(timeout)
      return null
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('429') || msg.includes('quota') || msg.includes('rate')) {
      console.log('[Gemini] Rate limited, skipping gracefully')
    } else {
      console.error('[Gemini] Error:', msg)
    }
    return null
  }
}

/**
 * 트렌드 키워드 분석 (Gemini)
 */
export async function analyzeKeywordTrend(keyword: string): Promise<{
  summary: string
  opportunity: string
  targetAudience: string
  contentStrategy: string
  monetization: string
} | null> {
  const prompt = `당신은 한국 키워드 마케팅 전문가입니다. 다음 키워드를 분석해주세요.

키워드: "${keyword}"

아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "summary": "이 키워드의 현재 트렌드와 시장 상황을 2-3문장으로 요약",
  "opportunity": "이 키워드의 수익화 기회를 2-3문장으로 설명",
  "targetAudience": "이 키워드를 검색하는 타겟 사용자층 설명",
  "contentStrategy": "이 키워드로 상위 노출하기 위한 콘텐츠 전략 2-3가지",
  "monetization": "이 키워드를 활용한 수익화 방법 2-3가지"
}`

  const text = await askGemini(prompt)
  if (!text) return null

  try {
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(jsonStr)
  } catch {
    return null
  }
}

/**
 * 콘텐츠 가이드 생성 (Gemini)
 */
export async function generateContentGuide(keyword: string): Promise<{
  titles: string[]
  headings: string[]
  keywords: string[]
  length: number
  publishTime: string
  tips: string[]
} | null> {
  const year = new Date().getFullYear()
  const prompt = `당신은 한국 블로그 SEO 전문가입니다. "${keyword}" 키워드로 네이버 블로그 상위 노출을 위한 콘텐츠 가이드를 작성해주세요.

${year}년 최신 트렌드를 반영해주세요.

아래 JSON 형식으로만 응답하세요:
{
  "titles": ["추천 블로그 제목 5개 배열"],
  "headings": ["H1, H2, H3 포함 추천 글 구조 배열"],
  "keywords": ["필수 포함 키워드 6-8개 배열"],
  "length": 추천글자수(숫자만),
  "publishTime": "최적 발행 시간",
  "tips": ["상위노출 팁 5개 배열"]
}`

  const text = await askGemini(prompt, 3000)
  if (!text) return null

  try {
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(jsonStr)
  } catch {
    return null
  }
}

/**
 * 트렌딩 키워드 종합 분석 (Gemini)
 */
export async function analyzeTrendingKeywords(keywords: string[]): Promise<{
  hotTopics: string[]
  analysis: string
  prediction: string
} | null> {
  const prompt = `당신은 한국 트렌드 분석가입니다. 현재 실시간 트렌딩 키워드 목록을 분석해주세요.

키워드 목록: ${keywords.slice(0, 15).join(', ')}

아래 JSON 형식으로만 응답하세요:
{
  "hotTopics": ["가장 주목할 핫토픽 3-5개"],
  "analysis": "전체 트렌드 흐름 분석 (3-4문장)",
  "prediction": "향후 1주일 트렌드 예측 (2-3문장)"
}`

  const text = await askGemini(prompt)
  if (!text) return null

  try {
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(jsonStr)
  } catch {
    return null
  }
}

export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY?.trim()
}
