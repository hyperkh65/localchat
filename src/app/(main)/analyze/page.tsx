'use client'

import SearchBar from '@/components/SearchBar'
import KeywordTable from '@/components/KeywordTable'
import { generateDemoTrending } from '@/lib/keyword-engine'
import { Search, TrendingUp, Star, Clock } from 'lucide-react'

export default function AnalyzePage() {
  const trending = generateDemoTrending()

  const recentSearches = [
    '아이폰16 사전예약',
    '전세사기 예방',
    '겨울 패딩 추천',
    '삼성전자 주가',
  ]

  const popularKeywords = [
    '부업 추천', '다이어트 식단', '비트코인 전망',
    '청약 자격', '영어 회화', '인테리어 비용',
    '연말정산', '코딩 부트캠프',
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">키워드 분석</h1>
        <p className="text-gray-500 text-sm">키워드를 입력하면 수익성 분석 결과를 확인할 수 있습니다</p>
      </div>

      {/* Search */}
      <div className="card p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-accent-dark" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">키워드를 검색하세요</h2>
        <p className="text-gray-500 text-sm mb-6">
          분석하고 싶은 키워드를 입력하면 Money Score, 검색량, 경쟁도 등을 확인할 수 있습니다
        </p>
        <div className="flex justify-center">
          <SearchBar large placeholder="예: 아이폰16 추천, 다이어트 방법, 부업 추천" />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Searches */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-400" />
            <h3 className="font-bold text-gray-900">최근 검색</h3>
          </div>
          <div className="space-y-2">
            {recentSearches.map((kw) => (
              <a
                key={kw}
                href={`/analyze/${encodeURIComponent(kw)}`}
                className="block p-3 rounded-xl bg-surface-light hover:bg-surface text-sm text-gray-700 transition-colors"
              >
                {kw}
              </a>
            ))}
          </div>
        </div>

        {/* Popular Keywords */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-gray-400" />
            <h3 className="font-bold text-gray-900">인기 키워드</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {popularKeywords.map((kw) => (
              <a
                key={kw}
                href={`/analyze/${encodeURIComponent(kw)}`}
                className="px-4 py-2 rounded-full bg-surface-light text-sm text-gray-700 hover:bg-accent hover:text-gray-900 transition-colors"
              >
                {kw}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Trending Analysis */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-gray-400" />
          <h3 className="font-bold text-gray-900">인기 분석 키워드 TOP 10</h3>
        </div>
        <KeywordTable
          keywords={trending.slice(0, 10).map(t => ({
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
