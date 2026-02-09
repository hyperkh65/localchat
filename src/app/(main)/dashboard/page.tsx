'use client'

import { useState, useEffect } from 'react'
import SearchBar from '@/components/SearchBar'
import MetricCard from '@/components/MetricCard'
import KeywordTable from '@/components/KeywordTable'
import { formatNumber } from '@/lib/utils'
import { BarChart3, TrendingUp, Zap, Newspaper, ArrowRight, Loader2, Wifi, WifiOff, Clock, Globe, Brain } from 'lucide-react'
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

interface GoogleTrendItem {
  keyword: string
  traffic: string
  trafficNumber: number
}

interface SearchRecord {
  keyword: string
  money_score: number
  money_grade: string
  searched_at: string
}

interface UserProfile {
  plan: string
  usage: {
    dailySearches: number
    dailySearchLimit: number
    aiCalls: number
    aiCallLimit: number
  }
}

export default function DashboardPage() {
  const [trending, setTrending] = useState<TrendingKeyword[]>([])
  const [googleTrends, setGoogleTrends] = useState<GoogleTrendItem[]>([])
  const [recentSearches, setRecentSearches] = useState<SearchRecord[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [aiInsight, setAiInsight] = useState<{ hotTopics: string[]; analysis: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRealData, setIsRealData] = useState(false)
  const [newsCount, setNewsCount] = useState(0)
  const [dataSources, setDataSources] = useState<string[]>([])

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      const [trendingRes, googleRes, historyRes, profileRes] = await Promise.allSettled([
        fetch('/api/trending').then(r => r.json()),
        fetch('/api/google-trends').then(r => r.json()),
        fetch('/api/history').then(r => r.json()),
        fetch('/api/user/profile').then(r => r.json()),
      ])

      if (trendingRes.status === 'fulfilled' && trendingRes.value.success) {
        const d = trendingRes.value
        setTrending(d.data || [])
        setIsRealData(d.isRealData !== false)
        setNewsCount(d.meta?.newsCount || 0)
        setDataSources(d.sources || [])
      }

      if (googleRes.status === 'fulfilled' && googleRes.value.success) {
        const gt = googleRes.value.data
        setGoogleTrends([...(gt.daily || []), ...(gt.realtime || [])].slice(0, 10))
      }

      if (historyRes.status === 'fulfilled' && historyRes.value.success) {
        setRecentSearches(historyRes.value.data?.recentSearches || [])
      }

      if (profileRes.status === 'fulfilled' && profileRes.value.success) {
        setUserProfile(profileRes.value.data)
      }

      setLoading(false)

      // AI 인사이트 (비동기, 느려도 OK)
      if (trendingRes.status === 'fulfilled' && trendingRes.value.data?.length > 0) {
        const keywords = trendingRes.value.data.slice(0, 10).map((t: TrendingKeyword) => t.keyword).join(',')
        try {
          const aiRes = await fetch(`/api/ai-analysis?type=trending&keyword=${encodeURIComponent(keywords)}`)
          const aiData = await aiRes.json()
          if (aiData.success && aiData.data) {
            setAiInsight(aiData.data)
          }
        } catch { /* AI 실패해도 OK */ }
      }
    }
    fetchAll()
  }, [])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
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
              ? `뉴스 ${formatNumber(newsCount)}건 분석 | ${dataSources.join(', ')}`
              : '키워드 분석 현황과 추천 수익 키워드를 확인하세요'}
          </p>
        </div>
        {userProfile && (
          <div className="text-right text-xs text-gray-500">
            <span className={`inline-block px-2 py-1 rounded-full font-semibold ${
              userProfile.plan === 'admin' ? 'bg-purple-100 text-purple-700' :
              userProfile.plan === 'premium' ? 'bg-yellow-100 text-yellow-700' :
              userProfile.plan === 'pro' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {userProfile.plan === 'admin' ? '관리자' :
               userProfile.plan === 'premium' ? 'Premium' :
               userProfile.plan === 'pro' ? 'Pro' : 'Free'}
            </span>
            {userProfile.usage.dailySearchLimit !== -1 && (
              <p className="mt-1">검색 {userProfile.usage.dailySearches}/{userProfile.usage.dailySearchLimit}</p>
            )}
          </div>
        )}
      </div>

      {/* Search */}
      <SearchBar placeholder="분석할 키워드를 입력하세요..." />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="수집된 뉴스"
          value={loading ? '...' : isRealData ? formatNumber(newsCount) : '0'}
          subtitle="네이버 + 구글 + 카카오"
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
          title="데이터 소스"
          value={loading ? '...' : `${dataSources.length}개`}
          subtitle={dataSources.length > 0 ? dataSources.slice(0, 3).join(', ') : '연결 확인 중'}
          icon={BarChart3}
        />
      </div>

      {/* AI Insight (Gemini) */}
      {aiInsight && (
        <div className="card p-6 border-l-4 border-purple-400 bg-gradient-to-r from-purple-50 to-white">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-gray-900">AI 트렌드 인사이트</h2>
            <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">Gemini</span>
          </div>
          <p className="text-sm text-gray-700 mb-3">{aiInsight.analysis}</p>
          {aiInsight.hotTopics && (
            <div className="flex flex-wrap gap-2">
              {aiInsight.hotTopics.map((topic, i) => (
                <span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  {topic}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Three Column Layout */}
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
              <span className="ml-3 text-gray-500 text-sm">뉴스 + Google Trends 수집 중...</span>
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
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Google Trends */}
          {googleTrends.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4 text-blue-500" />
                <h2 className="text-sm font-bold text-gray-900">Google 인기 검색어</h2>
              </div>
              <div className="space-y-2">
                {googleTrends.slice(0, 8).map((gt, i) => (
                  <Link
                    key={`${gt.keyword}-${i}`}
                    href={`/analyze/${encodeURIComponent(gt.keyword)}`}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-5">{i + 1}</span>
                      <span className="text-sm text-gray-800">{gt.keyword}</span>
                    </div>
                    {gt.traffic && (
                      <span className="text-xs text-blue-500">{gt.traffic}</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recent Searches */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-bold text-gray-900">최근 검색</h2>
            </div>
            {recentSearches.length > 0 ? (
              <div className="space-y-2">
                {recentSearches.slice(0, 8).map((s, i) => (
                  <Link
                    key={`${s.keyword}-${i}`}
                    href={`/analyze/${encodeURIComponent(s.keyword)}`}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm text-gray-700">{s.keyword}</span>
                    {s.money_grade && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        s.money_grade === 'S' ? 'score-s' :
                        s.money_grade === 'A' ? 'score-a' :
                        s.money_grade === 'B' ? 'score-b' : 'score-c'
                      }`}>
                        {s.money_grade}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">아직 검색 기록이 없습니다</p>
            )}
          </div>

          {/* Today's Recommended */}
          <div className="card p-6">
            <h2 className="text-sm font-bold text-gray-900 mb-3">오늘의 추천</h2>
            <div className="space-y-2">
              {trending
                .filter(t => t.moneyGrade === 'S' || t.moneyGrade === 'A')
                .slice(0, 5)
                .map((t) => (
                  <Link
                    key={t.keyword}
                    href={`/analyze/${encodeURIComponent(t.keyword)}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <span className="text-sm font-medium text-gray-900">{t.keyword}</span>
                      <span className="block text-xs text-gray-500">{t.category}</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      t.moneyGrade === 'S' ? 'score-s' : 'score-a'
                    }`}>
                      {t.moneyGrade}
                    </span>
                  </Link>
                ))}
            </div>
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
