'use client'

import { useState } from 'react'
import SearchBar from '@/components/SearchBar'
import KeywordTable from '@/components/KeywordTable'
import { generateDemoAnalysis, calculateMoneyScore, getMoneyGrade } from '@/lib/keyword-engine'
import { cn } from '@/lib/utils'
import { Compass, Gem, Target, Lightbulb, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const blueOceanKeywords = [
  { keyword: '재택근무 부업 추천', monthlyVolume: 2400, competition: 'low' as const, moneyScore: 82, moneyGrade: 'A' as const },
  { keyword: '소액 투자 방법 2024', monthlyVolume: 1800, competition: 'low' as const, moneyScore: 78, moneyGrade: 'A' as const },
  { keyword: '직장인 자격증 추천', monthlyVolume: 3200, competition: 'medium' as const, moneyScore: 75, moneyGrade: 'A' as const },
  { keyword: '홈카페 용품 추천', monthlyVolume: 1500, competition: 'low' as const, moneyScore: 85, moneyGrade: 'A' as const },
  { keyword: '1인가구 가전 추천', monthlyVolume: 2100, competition: 'low' as const, moneyScore: 88, moneyGrade: 'A' as const },
  { keyword: '건강기능식품 비교', monthlyVolume: 4500, competition: 'medium' as const, moneyScore: 91, moneyGrade: 'S' as const },
  { keyword: '전기자전거 가성비', monthlyVolume: 1200, competition: 'low' as const, moneyScore: 79, moneyGrade: 'A' as const },
  { keyword: '온라인 수익 창출', monthlyVolume: 3800, competition: 'medium' as const, moneyScore: 72, moneyGrade: 'A' as const },
]

const categoryKeywords: Record<string, Array<{ keyword: string; monthlyVolume: number; competition: 'high' | 'medium' | 'low'; moneyScore: number; moneyGrade: 'S' | 'A' | 'B' | 'C' | 'D' }>> = {
  '재테크': [
    { keyword: '주식 초보 종목 추천', monthlyVolume: 5200, competition: 'medium', moneyScore: 74, moneyGrade: 'A' },
    { keyword: 'ETF 적립식 투자', monthlyVolume: 3100, competition: 'low', moneyScore: 81, moneyGrade: 'A' },
    { keyword: '배당주 추천 2024', monthlyVolume: 4800, competition: 'medium', moneyScore: 77, moneyGrade: 'A' },
  ],
  '건강': [
    { keyword: '유산균 추천 순위', monthlyVolume: 6800, competition: 'high', moneyScore: 86, moneyGrade: 'A' },
    { keyword: '단백질 보충제 비교', monthlyVolume: 4200, competition: 'medium', moneyScore: 83, moneyGrade: 'A' },
    { keyword: '간헐적 단식 효과', monthlyVolume: 7500, competition: 'medium', moneyScore: 65, moneyGrade: 'B' },
  ],
  'IT/테크': [
    { keyword: '노트북 추천 2024', monthlyVolume: 12000, competition: 'high', moneyScore: 72, moneyGrade: 'A' },
    { keyword: '무선 이어폰 가성비', monthlyVolume: 8500, competition: 'high', moneyScore: 79, moneyGrade: 'A' },
    { keyword: 'AI 도구 추천', monthlyVolume: 3200, competition: 'low', moneyScore: 90, moneyGrade: 'S' },
  ],
  '부동산': [
    { keyword: '청약 자격 조건', monthlyVolume: 9200, competition: 'medium', moneyScore: 68, moneyGrade: 'B' },
    { keyword: '전세 vs 월세', monthlyVolume: 5100, competition: 'low', moneyScore: 62, moneyGrade: 'B' },
    { keyword: '부동산 투자 방법', monthlyVolume: 4300, competition: 'medium', moneyScore: 75, moneyGrade: 'A' },
  ],
}

export default function DiscoverPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('재테크')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Compass className="w-7 h-7 text-purple-500" />
          <h1 className="text-2xl font-bold text-gray-900">키워드 발굴</h1>
        </div>
        <p className="text-gray-500 text-sm">경쟁이 적고 수익성 높은 블루오션 키워드를 발굴하세요</p>
      </div>

      {/* Search for seed keyword */}
      <div className="card p-6">
        <h3 className="font-bold text-gray-900 mb-3">시드 키워드로 확장하기</h3>
        <p className="text-sm text-gray-500 mb-4">키워드를 입력하면 관련 롱테일 키워드를 자동으로 발굴합니다</p>
        <SearchBar placeholder="시드 키워드를 입력하세요 (예: 다이어트, 부업, 투자)" />
      </div>

      {/* Blue Ocean Keywords */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Gem className="w-5 h-5 text-blue-500" />
          <h2 className="font-bold text-gray-900">블루오션 키워드 발굴</h2>
          <span className="ml-auto text-xs text-gray-400">AI 추천 • 매일 업데이트</span>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          검색량 대비 콘텐츠 포화도가 낮고, Money Score가 높은 키워드입니다
        </p>
        <KeywordTable keywords={blueOceanKeywords} />
      </div>

      {/* Category Keywords */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-orange-500" />
          <h2 className="font-bold text-gray-900">카테고리별 추천 키워드</h2>
        </div>

        <div className="flex gap-2 flex-wrap mb-6">
          {Object.keys(categoryKeywords).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                selectedCategory === cat
                  ? 'bg-accent text-gray-900'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {categoryKeywords[selectedCategory] && (
          <KeywordTable keywords={categoryKeywords[selectedCategory]} />
        )}
      </div>

      {/* Tips */}
      <div className="card p-6 bg-gradient-to-r from-accent/5 to-emerald-50">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-6 h-6 text-accent-dark flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-gray-900 mb-2">키워드 발굴 팁</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>- <strong>롱테일 키워드</strong>를 공략하세요. 3어절 이상의 구체적인 키워드가 경쟁이 적습니다.</li>
              <li>- <strong>검색량 1,000~10,000</strong> 구간이 최적입니다. 너무 적으면 수익X, 너무 많으면 경쟁과다.</li>
              <li>- <strong>상업성 키워드</strong> (추천, 비교, 가격, 후기)가 포함된 키워드가 수익성이 높습니다.</li>
              <li>- <strong>콘텐츠 포화도</strong>가 낮은 키워드를 찾으세요. 블루오션 = 낮은 포화도 + 높은 검색량.</li>
              <li>- <strong>트렌드 키워드</strong>를 빠르게 선점하면 초기 트래픽을 확보할 수 있습니다.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
