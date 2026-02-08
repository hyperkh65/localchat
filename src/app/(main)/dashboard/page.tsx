'use client'

import { useState, useEffect } from 'react'
import SearchBar from '@/components/SearchBar'
import MetricCard from '@/components/MetricCard'
import KeywordTable from '@/components/KeywordTable'
import { formatNumber } from '@/lib/utils'
import { BarChart3, TrendingUp, Zap, Newspaper, ArrowRight, Loader2, Wifi, WifiOff } from 'lucide-react'
import Link from 'next/link'

interface TrendingKeyword {
  rank: number
  keyword: string
  searchVolume: number
  competition: 'high' | 'medium' | 'low'
  moneyScore: number
  moneyGrade: 'S' | 'A' | 'B' | 'C' | 'D'
  category: string
  changePercent?: number
}

export default function DashboardPage() {
  const [trending, setTrending] = useState<TrendingKeyword[]>([])
  const [loading, setLoading] = useState(true)
  const [isRealData, setIsRealData] = useState(false)
  const [newsCount, setNewsCount] = useState(0)
  const [dataSources, setDataSources] = useState<string[]>([])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const res = await fetch('/api/trending')
        const json = await res.json()
        if (json.success && json.data) {
          setTrending(json.data)
          setIsRealData(json.isRealData !== false)
          setNewsCount(json.meta?.newsCount || 0)
          setDataSources(json.sources || [])
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">대시보드</h1>
          {!loading && (
            isRealData ? (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                <Wifi className="w-3 h-3" /> 실시간
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                <WifiOff className="w-3 h-3" /> 데모
              </span>
            )
          )}
        </div>
        <p className="text-gray-500 text-sm">
          {isRealData
            ? `뉴스 ${formatNumber(newsCount)}건 분석 | 데이터 소스: ${dataSources.join(', ')}`
            : '키워드 분석 현황과 추천 수익 키워드를 확인하세요'}
        </p>
      </div>

      {/* Search */}
      <SearchBar placeholder="분석할 키워드를 입력하세요..." />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="수집된 뉴스"
          value={loading ? '...' : isRealData ? formatNumber(newsCount) : '0'}
          subtitle="실시간 뉴스 분석"
          icon={Newspaper}
        />
        <MetricCard
          title="트렌딩 키워드"
          value={loading ? '...' : trending.length}
          subtitle="현재 급상승 중"
          icon={TrendingUp}
        />
        <MetricCard
          title="S등급 키워드"
          value={loading ? '...' : trending.filter(t => t.moneyGrade === 'S').length}
          subtitle="최고 수익성 키워드"
          icon={Zap}
        />
        <MetricCard
          title="분석 가능"
          value={loading ? '...' : `${dataSources.length > 0 ? dataSources.length : 4}개 API`}
          subtitle={dataSources.length > 0 ? dataSources.slice(0, 2).join(' + ') : '네이버 + 카카오'}
          icon={BarChart3}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Trending Keywords */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">실시간 급상승 키워드</h2>
            <Link href="/trending" className="text-sm text-gray-500 hover:text-accent-dark flex items-center gap-1 transition-colors">
              전체보기 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
              <span className="ml-3 text-gray-500 text-sm">뉴스 + 검색 데이터 수집 중...</span>
            </div>
          ) : trending.length > 0 ? (
            <KeywordTable
              keywords={trending.slice(0, 10).map(t => ({
                keyword: t.keyword,
                monthlyVolume: t.searchVolume,
                competition: t.competition,
                moneyScore: t.moneyScore,
                moneyGrade: t.moneyGrade,
              }))}
              showRank
            />
          ) : (
            <div className="text-center py-16 text-gray-400">
              <p>트렌딩 데이터를 불러올 수 없습니다</p>
              <p className="text-sm mt-1">설정에서 API 연결 상태를 확인해주세요</p>
            </div>
          )}
        </div>

        {/* Today's Recommended */}
        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">오늘의 추천</h2>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-accent animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {trending
                  .filter(t => t.moneyGrade === 'S' || t.moneyGrade === 'A')
                  .slice(0, 5)
                  .map((t) => (
                    <Link
                      key={t.keyword}
                      href={`/analyze/${encodeURIComponent(t.keyword)}`}
                      className="flex items-center justify-between p-3 rounded-xl bg-surface-light hover:bg-surface transition-colors"
                    >
                      <div>
                        <span className="text-sm font-medium text-gray-900">{t.keyword}</span>
                        <span className="block text-xs text-gray-500">
                          {t.category} &middot; {formatNumber(t.searchVolume)}회
                          {t.changePercent ? ` &middot; +${t.changePercent}%` : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          t.moneyGrade === 'S' ? 'score-s' : 'score-a'
                        }`}>
                          {t.moneyGrade}
                        </span>
                      </div>
                    </Link>
                  ))}
                {trending.filter(t => t.moneyGrade === 'S' || t.moneyGrade === 'A').length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">S/A 등급 키워드 없음</p>
                )}
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">키워드 분석 시작</h2>
            <p className="text-sm text-gray-500 mb-4">관심 키워드를 검색하면 실시간으로 수익성을 분석합니다</p>
            <Link
              href="/analyze"
              className="block text-center py-3 px-4 bg-accent text-gray-900 font-semibold rounded-xl hover:bg-accent/80 transition-colors"
            >
              키워드 분석하기
            </Link>
          </div>
        </div>
      </div>

      {/* Category Quick Links */}
      <div className="card p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">카테고리별 키워드 발굴</h2>
        <div className="flex flex-wrap gap-2">
          {['재테크', '건강', 'IT/테크', '부동산', '교육', '패션', '여행', '생활'].map((cat) => (
            <Link
              key={cat}
              href={`/discover?category=${encodeURIComponent(cat)}`}
              className="px-4 py-2 rounded-full bg-surface-light text-sm font-medium text-gray-700 hover:bg-accent hover:text-gray-900 transition-colors"
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
