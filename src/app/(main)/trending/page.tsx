'use client'

import { useState } from 'react'
import KeywordTable from '@/components/KeywordTable'
import { generateDemoTrending } from '@/lib/keyword-engine'
import { cn } from '@/lib/utils'
import { TrendingUp, Flame, Clock, Filter } from 'lucide-react'

const platforms = ['전체', 'Naver', 'Google', 'Daum', 'Bing']
const categories = ['전체', 'IT/테크', '금융', '건강', '부동산', '교육', '패션', '여행', '재테크', '쇼핑', '엔터', '생활', '자동차']

export default function TrendingPage() {
  const [selectedPlatform, setSelectedPlatform] = useState('전체')
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const trending = generateDemoTrending()

  const filtered = trending.filter((t) => {
    if (selectedCategory !== '전체' && t.category !== selectedCategory) return false
    return true
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Flame className="w-7 h-7 text-orange-500" />
          <h1 className="text-2xl font-bold text-gray-900">실시간 트렌드</h1>
        </div>
        <p className="text-gray-500 text-sm">현재 급상승 중인 키워드를 실시간으로 확인하세요</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <TrendingUp className="w-4 h-4" />
            급상승 키워드
          </div>
          <div className="text-2xl font-bold text-gray-900">{trending.length}</div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Flame className="w-4 h-4 text-orange-500" />
            S등급 키워드
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {trending.filter(t => t.moneyGrade === 'S').length}
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Clock className="w-4 h-4" />
            마지막 업데이트
          </div>
          <div className="text-2xl font-bold text-gray-900">방금 전</div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Filter className="w-4 h-4" />
            카테고리
          </div>
          <div className="text-2xl font-bold text-gray-900">{new Set(trending.map(t => t.category)).size}개</div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-500 mr-2">플랫폼:</span>
          {platforms.map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPlatform(p)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                selectedPlatform === p
                  ? 'bg-accent text-gray-900'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              )}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-500 mr-2">카테고리:</span>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                selectedCategory === c
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Trending Table */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">
            급상승 키워드 TOP {filtered.length}
          </h2>
          <span className="text-xs text-gray-400">자동 갱신 • 5분 간격</span>
        </div>
        <KeywordTable
          keywords={filtered.map(t => ({
            keyword: t.keyword,
            monthlyVolume: t.searchVolume,
            competition: t.moneyScore >= 70 ? 'high' : t.moneyScore >= 50 ? 'medium' : 'low',
            moneyScore: t.moneyScore,
            moneyGrade: t.moneyGrade,
          }))}
          showRank
        />
      </div>
    </div>
  )
}
