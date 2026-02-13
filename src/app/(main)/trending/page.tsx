'use client'

import { useState, useEffect } from 'react'
import KeywordTable from '@/components/KeywordTable'
import { cn } from '@/lib/utils'
import { TrendingUp, Flame, Clock, Filter, Loader2, Wifi, WifiOff } from 'lucide-react'
import AdSense, { AD_SLOTS } from '@/components/AdSense'

interface TrendingKeyword {
  rank: number
  keyword: string
  searchVolume: number
  competition: 'high' | 'medium' | 'low'
  changePercent: number
  moneyScore: number
  moneyGrade: 'S' | 'A' | 'B' | 'C' | 'D'
  category: string
}

const categories = ['전체', 'IT/테크', '금융', '건강', '부동산', '교육', '패션', '여행', '재테크', '쇼핑', '엔터', '생활', '자동차', '일반']

export default function TrendingPage() {
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [trending, setTrending] = useState<TrendingKeyword[]>([])
  const [loading, setLoading] = useState(true)
  const [isRealData, setIsRealData] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTrending() {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch('/api/trending')
        const json = await res.json()

        if (json.success && json.data) {
          setTrending(json.data)
          setIsRealData(json.isRealData !== false)
          setLastUpdated(new Date().toLocaleTimeString('ko-KR'))
          if (json.errors?.length) {
            console.warn('Trending API partial errors:', json.errors)
          }
        } else {
          setError(json.error || '데이터를 불러올 수 없습니다')
        }
      } catch (err) {
        console.error('Trending fetch error:', err)
        setError('네트워크 오류: API 서버에 연결할 수 없습니다')
      } finally {
        setLoading(false)
      }
    }

    fetchTrending()
  }, [])

  const filtered = trending.filter((t) => {
    if (selectedCategory !== '전체' && t.category !== selectedCategory) return false
    return true
  })

  const activeCategories = Array.from(new Set(trending.map(t => t.category)))

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Flame className="w-7 h-7 text-orange-500" />
            <h1 className="text-2xl font-bold text-gray-900">실시간 트렌드</h1>
          </div>
          <p className="text-gray-500 text-sm">현재 급상승 중인 키워드를 실시간으로 확인하세요</p>
        </div>
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">실시간 트렌드 키워드 수집 중...</p>
          <p className="text-gray-400 text-sm mt-1">네이버 뉴스 + 검색광고 API + 다음 검색 데이터 분석 중</p>
        </div>
      </div>
    )
  }

  if (error && trending.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Flame className="w-7 h-7 text-orange-500" />
            <h1 className="text-2xl font-bold text-gray-900">실시간 트렌드</h1>
          </div>
        </div>
        <div className="card p-8 text-center">
          <WifiOff className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-red-500 font-medium mb-2">{error}</p>
          <p className="text-gray-400 text-sm">API 키 설정을 확인해주세요 (설정 &gt; API 키 관리)</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Flame className="w-7 h-7 text-orange-500" />
          <h1 className="text-2xl font-bold text-gray-900">실시간 트렌드</h1>
          {isRealData ? (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              <Wifi className="w-3 h-3" /> 실시간
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
              <WifiOff className="w-3 h-3" /> 데모
            </span>
          )}
        </div>
        <p className="text-gray-500 text-sm">
          {isRealData
            ? '네이버 검색광고 API 기반 실시간 인기 키워드'
            : 'API 연결 대기 중 - /api/debug 에서 연결 상태를 확인하세요'}
        </p>
      </div>

      {/* Ad - Top */}
      <AdSense slot={AD_SLOTS.TRENDING_TOP} className="my-2" />

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
          <div className="text-2xl font-bold text-gray-900">{lastUpdated || '-'}</div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Filter className="w-4 h-4" />
            카테고리
          </div>
          <div className="text-2xl font-bold text-gray-900">{activeCategories.length}개</div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-500 mr-2">카테고리:</span>
          {categories.filter(c => c === '전체' || activeCategories.includes(c)).map((c) => (
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

      {/* Ad - Mid */}
      <AdSense slot={AD_SLOTS.TRENDING_MID} format="fluid" className="my-2" />

      {/* Trending Table */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">
            급상승 키워드 TOP {filtered.length}
          </h2>
          <span className={`text-xs ${isRealData ? 'text-emerald-600' : 'text-amber-600'}`}>
            {isRealData ? '네이버 검색광고 API 실데이터' : '데모 데이터 (API 연결 확인 필요)'}
          </span>
        </div>
        <KeywordTable
          keywords={filtered.map(t => ({
            keyword: t.keyword,
            monthlyVolume: t.searchVolume,
            competition: t.competition,
            moneyScore: t.moneyScore,
            moneyGrade: t.moneyGrade,
          }))}
          showRank
        />
      </div>

      {/* Ad - Bottom */}
      <AdSense slot={AD_SLOTS.TRENDING_BOTTOM} className="my-2" />
    </div>
  )
}
