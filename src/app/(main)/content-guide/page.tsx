'use client'

import { useState } from 'react'
import SearchBar from '@/components/SearchBar'
import { generateDemoContentGuide } from '@/lib/keyword-engine'
import { cn } from '@/lib/utils'
import { FileText, BookOpen, Heading, Tag, Clock, BarChart3, Lightbulb, Lock } from 'lucide-react'

export default function ContentGuidePage() {
  const [keyword, setKeyword] = useState('')
  const [showGuide, setShowGuide] = useState(false)

  const guide = generateDemoContentGuide(keyword || '부업 추천')
  const demoKeyword = keyword || '부업 추천'

  const handleAnalyze = () => {
    if (keyword.trim()) {
      setShowGuide(true)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <FileText className="w-7 h-7 text-emerald-500" />
          <h1 className="text-2xl font-bold text-gray-900">콘텐츠 가이드</h1>
        </div>
        <p className="text-gray-500 text-sm">키워드 기반으로 블로그/뉴스 콘텐츠 작성 방향을 제안합니다</p>
      </div>

      {/* Search */}
      <div className="card p-6">
        <h3 className="font-bold text-gray-900 mb-3">콘텐츠를 작성할 키워드를 입력하세요</h3>
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder="예: 부업 추천, 다이어트 식단, 노트북 추천"
              className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-3 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
            />
          </div>
          <button onClick={handleAnalyze} className="btn-primary whitespace-nowrap">
            가이드 생성
          </button>
        </div>
      </div>

      {/* Demo Guide (always show with demo data) */}
      <div className="space-y-6">
        {/* Suggested Titles */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-accent-dark" />
            <h2 className="font-bold text-gray-900">추천 블로그 제목</h2>
            <span className="text-xs text-gray-400 ml-auto">키워드: &ldquo;{demoKeyword}&rdquo;</span>
          </div>
          <div className="space-y-2">
            {guide.suggestedTitles.map((title, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-surface-light hover:bg-surface transition-colors cursor-pointer group">
                <span className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-gray-900 flex-shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm text-gray-800 group-hover:text-gray-900 font-medium">{title}</span>
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
              {guide.headingStructure.map((h, i) => (
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
                {guide.requiredKeywords.map((kw) => (
                  <span key={kw} className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium border border-emerald-100">
                    {kw}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                이 키워드들을 자연스럽게 본문에 포함하면 검색 상위 노출에 유리합니다
              </p>
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
                  <span className="text-sm font-bold text-gray-900">{guide.recommendedLength.toLocaleString()}자 이상</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-surface-light">
                  <span className="text-sm text-gray-500">최적 발행 시간</span>
                  <span className="text-sm font-bold text-gray-900">{guide.bestPublishTime}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-surface-light">
                  <span className="text-sm text-gray-500">추천 이미지 수</span>
                  <span className="text-sm font-bold text-gray-900">8-12장</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-surface-light">
                  <span className="text-sm text-gray-500">추천 H2 개수</span>
                  <span className="text-sm font-bold text-gray-900">5-7개</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Competitor Insights */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-orange-500" />
            <h2 className="font-bold text-gray-900">경쟁 콘텐츠 인사이트</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {guide.competitorInsights.map((insight, i) => (
              <div key={i} className="p-4 rounded-xl bg-surface-light text-sm text-gray-700 flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {insight}
              </div>
            ))}
          </div>
        </div>

        {/* Premium CTA */}
        <div className="card p-8 bg-gradient-to-r from-gray-900 to-gray-800 text-white text-center">
          <Lock className="w-10 h-10 mx-auto mb-4 text-accent" />
          <h3 className="text-xl font-bold mb-2">프리미엄 콘텐츠 가이드</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-lg mx-auto">
            AI 기반 자동 글 초안 생성, SEO 최적화 점수 체크, 실시간 경쟁 분석 등
            프리미엄 기능으로 콘텐츠 품질을 극대화하세요
          </p>
          <a href="/pricing" className="btn-primary inline-block">
            프리미엄 시작하기
          </a>
        </div>

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
                <li>- 글 마지막에 <strong>관련 키워드 태그</strong>를 추가하세요.</li>
                <li>- 발행 후 24시간 이내에 <strong>다른 채널에 공유</strong>하면 초기 노출에 도움됩니다.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
