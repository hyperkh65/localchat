'use client'

import { useState } from 'react'
import SearchBar from '@/components/SearchBar'
import MetricCard from '@/components/MetricCard'
import KeywordTable from '@/components/KeywordTable'
import TrendChart from '@/components/TrendChart'
import { generateDemoTrending, generateDemoAnalysis } from '@/lib/keyword-engine'
import { formatNumber } from '@/lib/utils'
import { BarChart3, TrendingUp, Zap, Eye, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const trending = generateDemoTrending()
  const sampleAnalysis = generateDemoAnalysis('부업 추천')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">대시보드</h1>
        <p className="text-gray-500 text-sm">키워드 분석 현황과 추천 수익 키워드를 확인하세요</p>
      </div>

      {/* Search */}
      <SearchBar placeholder="분석할 키워드를 입력하세요..." />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="오늘 분석"
          value="0 / 5"
          subtitle="무료 일일 분석 횟수"
          icon={BarChart3}
        />
        <MetricCard
          title="실시간 급상승"
          value={trending.length}
          subtitle="현재 트렌딩 키워드"
          change={12}
          icon={TrendingUp}
        />
        <MetricCard
          title="S등급 키워드"
          value={trending.filter(t => t.moneyGrade === 'S').length}
          subtitle="오늘의 최고 수익 키워드"
          icon={Zap}
        />
        <MetricCard
          title="분석 가능"
          value="5개 플랫폼"
          subtitle="네이버, 구글, 다음, 빙, 티스토리"
          icon={Eye}
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

        {/* Today's Recommended */}
        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">오늘의 추천</h2>
            <div className="space-y-3">
              {trending.filter(t => t.moneyGrade === 'S' || t.moneyGrade === 'A').slice(0, 5).map((t) => (
                <Link
                  key={t.keyword}
                  href={`/analyze/${encodeURIComponent(t.keyword)}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-light hover:bg-surface transition-colors"
                >
                  <div>
                    <span className="text-sm font-medium text-gray-900">{t.keyword}</span>
                    <span className="block text-xs text-gray-500">{t.category}</span>
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
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">검색 트렌드</h2>
            <TrendChart data={sampleAnalysis.trendData} height={200} showGrid={false} />
          </div>
        </div>
      </div>

      {/* Category Quick Links */}
      <div className="card p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">카테고리별 인기 키워드</h2>
        <div className="flex flex-wrap gap-2">
          {['IT/테크', '금융', '건강', '부동산', '교육', '패션', '여행', '재테크', '쇼핑', '엔터'].map((cat) => (
            <button
              key={cat}
              className="px-4 py-2 rounded-full bg-surface-light text-sm font-medium text-gray-700 hover:bg-accent hover:text-gray-900 transition-colors"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
