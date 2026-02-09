import { NextRequest, NextResponse } from 'next/server'
import { generateContentGuide, isGeminiConfigured } from '@/lib/gemini'
import { generateDemoContentGuide } from '@/lib/keyword-engine'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get('keyword')

  if (!keyword || keyword.trim().length === 0) {
    return NextResponse.json({ error: '키워드를 입력하세요' }, { status: 400 })
  }

  const trimmed = keyword.trim()

  // Gemini AI로 콘텐츠 가이드 생성 시도
  if (isGeminiConfigured()) {
    try {
      const aiGuide = await generateContentGuide(trimmed)
      if (aiGuide) {
        return NextResponse.json({
          success: true,
          isAI: true,
          data: {
            suggestedTitles: aiGuide.titles,
            headingStructure: aiGuide.headings,
            requiredKeywords: aiGuide.keywords,
            recommendedLength: aiGuide.length,
            bestPublishTime: aiGuide.publishTime,
            competitorInsights: aiGuide.tips,
          },
        })
      }
    } catch {
      // Gemini 실패 시 기본 가이드로 폴백
    }
  }

  // 기본 가이드 (Gemini 없거나 실패 시)
  const guide = generateDemoContentGuide(trimmed)
  return NextResponse.json({
    success: true,
    isAI: false,
    data: guide,
  })
}
