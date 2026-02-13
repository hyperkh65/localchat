'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { generateDemoContentGuide } from '@/lib/keyword-engine'
import { cn } from '@/lib/utils'
import { FileText, BookOpen, Heading, Tag, Clock, BarChart3, Lightbulb, Loader2, Brain, Trophy, Compass, ArrowRight } from 'lucide-react'
import AdSense, { AD_SLOTS } from '@/components/AdSense'
import AdInterstitial from '@/components/AdInterstitial'

interface ContentGuideData {
  suggestedTitles: string[]
  headingStructure: string[]
  requiredKeywords: string[]
  recommendedLength: number
  bestPublishTime: string
  competitorInsights: string[]
}

function ContentGuideContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const urlKeyword = searchParams.get('keyword') || ''

  const [keyword, setKeyword] = useState(urlKeyword)
  const [guide, setGuide] = useState<ContentGuideData | null>(null)
  const [isAI, setIsAI] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showInterstitial, setShowInterstitial] = useState(false)
  const [generateCount, setGenerateCount] = useState(0)

  const handleGenerate = async (kw?: string) => {
    const target = (kw || keyword).trim()
    if (!target) return

    const newCount = generateCount + 1
    setGenerateCount(newCount)
    // Show interstitial every 2 generations
    if (newCount > 1 && newCount % 2 === 0) {
      setShowInterstitial(true)
    }

    setLoading(true)
    setGuide(null)

    try {
      const res = await fetch(`/api/content-guide?keyword=${encodeURIComponent(target)}`)
      const json = await res.json()
      if (json.success && json.data) {
        setGuide(json.data)
        setIsAI(json.isAI === true)
      } else {
        const fallback = generateDemoContentGuide(target)
        setGuide(fallback)
        setIsAI(false)
      }
    } catch {
      const fallback = generateDemoContentGuide(target)
      setGuide(fallback)
      setIsAI(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (urlKeyword) {
      setKeyword(urlKeyword)
      handleGenerate(urlKeyword)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlKeyword])

  const displayGuide = guide || generateDemoContentGuide('부업 추천')
  const displayKeyword = keyword.trim() || '부업 추천'

  return (
    <div className="space-y-8">
      {/* Interstitial Ad */}
      <AdInterstitial show={showInterstitial} onClose={() => setShowInterstitial(false)} delay={5} />

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <FileText className="w-7 h-7 text-emerald-500" />
          <h1 className="text-2xl font-bold text-gray-900">콘텐츠 가이드</h1>
          {isAI && (
            <span className="flex items-center gap-1 text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
              <Brain className="w-3 h-3" /> AI 생성
            </span>
          )}
        </div>
        <p className="text-gray-500 text-sm">
          {isAI ? 'Gemini AI가 분석한 최적의 콘텐츠 전략입니다' : '키워드 기반 블로그 콘텐츠 가이드를 생성합니다'}
        </p>
      </div>

      {/* Ad - Top */}
      <AdSense slot={AD_SLOTS.CONTENT_GUIDE_TOP} className="my-2" />

      {/* Search */}
      <div className="card p-6">
        <h3 className="font-bold text-gray-900 mb-3">콘텐츠를 작성할 키워드를 입력하세요</h3>
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder="예: 부업 추천, 다이어트 식단, 노트북 추천"
              className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-3 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
            />
          </div>
          <button onClick={() => handleGenerate()} disabled={loading} className="btn-primary whitespace-nowrap disabled:opacity-50">
            {loading ? '생성 중...' : '가이드 생성'}
          </button>
        </div>
        {/* Quick Links to other tools */}
        {keyword.trim() && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => router.push(`/blog-rank?keyword=${encodeURIComponent(displayKeyword)}`)}
              className="flex items-center gap-1 text-xs text-yellow-700 bg-yellow-50 px-3 py-1.5 rounded-full hover:bg-yellow-100 transition-colors"
            >
              <Trophy className="w-3 h-3" /> 블로그 랭킹 보기
            </button>
            <button
              onClick={() => router.push(`/discover?seed=${encodeURIComponent(displayKeyword)}`)}
              className="flex items-center gap-1 text-xs text-purple-700 bg-purple-50 px-3 py-1.5 rounded-full hover:bg-purple-100 transition-colors"
            >
              <Compass className="w-3 h-3" /> 관련 키워드 발굴
            </button>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="card p-12 text-center">
          <Loader2 className="w-10 h-10 text-accent animate-spin mx-auto mb-4" />
          <p className="text-gray-500">AI가 콘텐츠 전략을 분석하고 있습니다...</p>
        </div>
      )}

      {/* Guide Content */}
      {!loading && (
        <div className="space-y-6">
          {/* Suggested Titles */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-accent-dark" />
              <h2 className="font-bold text-gray-900">추천 블로그 제목</h2>
              <span className="text-xs text-gray-400 ml-auto">키워드: &ldquo;{displayKeyword}&rdquo;</span>
            </div>
            <div className="space-y-2">
              {displayGuide.suggestedTitles.map((title, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-surface-light hover:bg-surface transition-colors cursor-pointer group">
                  <span className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-gray-900 flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm text-gray-800 group-hover:text-gray-900 font-medium flex-1">{title}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Heading Structure */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Heading className="w-5 h-5 text-blue-500" />
                <h2 className="font-bold text-gray-900">추천 글 구조</h2>
              </div>
              <div className="space-y-2">
                {displayGuide.headingStructure.map((h, i) => (
                  <div key={i} className={cn(
                    'p-3 rounded-lg text-sm transition-colors',
                    h.startsWith('H1') ? 'bg-accent/20 font-bold pl-4 text-gray-900' :
                    h.startsWith('H2') ? 'bg-blue-50 font-medium pl-8 text-gray-800' :
                    'bg-gray-50 pl-12 text-gray-600'
                  )}>
                    {h}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {/* Required Keywords */}
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="w-5 h-5 text-emerald-500" />
                  <h2 className="font-bold text-gray-900">필수 포함 키워드</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {displayGuide.requiredKeywords.map((kw) => (
                    <button
                      key={kw}
                      onClick={() => { setKeyword(kw); handleGenerate(kw) }}
                      className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium border border-emerald-100 hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                      {kw}
                    </button>
                  ))}
                </div>
              </div>

              {/* Publish Strategy */}
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-purple-500" />
                  <h2 className="font-bold text-gray-900">발행 전략</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-surface-light">
                    <span className="text-sm text-gray-500">추천 글 길이</span>
                    <span className="text-sm font-bold text-gray-900">{displayGuide.recommendedLength.toLocaleString()}자 이상</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-surface-light">
                    <span className="text-sm text-gray-500">최적 발행 시간</span>
                    <span className="text-sm font-bold text-gray-900">{displayGuide.bestPublishTime}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ad - Mid */}
          <AdSense slot={AD_SLOTS.CONTENT_GUIDE_MID} format="fluid" className="my-2" />

          {/* Competitor Insights */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-orange-500" />
              <h2 className="font-bold text-gray-900">{isAI ? '상위 노출 전략' : '경쟁 콘텐츠 인사이트'}</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayGuide.competitorInsights.map((insight, i) => (
                <div key={i} className="p-4 rounded-xl bg-surface-light text-sm text-gray-700 flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {insight}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid sm:grid-cols-2 gap-4">
            <button
              onClick={() => router.push(`/blog-rank?keyword=${encodeURIComponent(displayKeyword)}`)}
              className="card p-5 hover:shadow-lg transition-shadow text-left group"
            >
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-yellow-500" />
                <div>
                  <h3 className="font-bold text-gray-900 group-hover:text-yellow-600 transition-colors">블로그 랭킹 확인</h3>
                  <p className="text-xs text-gray-500">상위 포스트를 역분석하고 내 블로그 순위를 확인하세요</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-yellow-500 ml-auto transition-colors" />
              </div>
            </button>
            <button
              onClick={() => router.push(`/discover?seed=${encodeURIComponent(displayKeyword)}`)}
              className="card p-5 hover:shadow-lg transition-shadow text-left group"
            >
              <div className="flex items-center gap-3">
                <Compass className="w-8 h-8 text-purple-500" />
                <div>
                  <h3 className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors">관련 키워드 발굴</h3>
                  <p className="text-xs text-gray-500">이 키워드의 롱테일 & 블루오션 키워드를 찾으세요</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-purple-500 ml-auto transition-colors" />
              </div>
            </button>
          </div>

          {/* Ad - Bottom */}
          <AdSense slot={AD_SLOTS.CONTENT_GUIDE_BOTTOM} className="my-2" />

          {/* Tips */}
          <div className="card p-6 bg-gradient-to-r from-accent/5 to-blue-50">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-6 h-6 text-accent-dark flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-gray-900 mb-2">콘텐츠 작성 팁</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>- 제목에 <strong>메인 키워드</strong>를 반드시 포함하세요.</li>
                  <li>- 첫 문단(200자 이내)에 핵심 키워드를 자연스럽게 넣으세요.</li>
                  <li>- H2, H3 소제목에도 <strong>연관 키워드</strong>를 활용하세요.</li>
                  <li>- 이미지 ALT 태그에 키워드를 포함하면 이미지 검색 유입도 가능합니다.</li>
                  <li>- 발행 후 24시간 이내에 <strong>다른 채널에 공유</strong>하면 초기 노출에 도움됩니다.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ContentGuidePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-gray-500">로딩 중...</p>
      </div>
    }>
      <ContentGuideContent />
    </Suspense>
  )
}
