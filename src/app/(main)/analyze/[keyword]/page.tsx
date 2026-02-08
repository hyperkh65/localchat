'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import SearchBar from '@/components/SearchBar'
import MetricCard from '@/components/MetricCard'
import MoneyScoreGauge from '@/components/MoneyScoreGauge'
import KeywordTable from '@/components/KeywordTable'
import TrendChart from '@/components/TrendChart'
import { generateDemoAnalysis, generateDemoContentGuide } from '@/lib/keyword-engine'
import { formatNumber, cn } from '@/lib/utils'
import {
  BarChart3, TrendingUp, Users, MousePointerClick, FileText,
  DollarSign, Target, Layers, ArrowRight, Copy, CheckCircle,
  Monitor, Smartphone, Globe, BookOpen
} from 'lucide-react'

const tabs = [
  { id: 'overview', label: '기본 분석', icon: BarChart3 },
  { id: 'money', label: '수익성 분석', icon: DollarSign },
  { id: 'trend', label: '트렌드', icon: TrendingUp },
  { id: 'related', label: '연관 키워드', icon: Layers },
  { id: 'content', label: '콘텐츠 가이드', icon: FileText },
  { id: 'platform', label: '플랫폼 비교', icon: Globe },
]

export default function KeywordAnalysisPage() {
  const params = useParams()
  const keyword = decodeURIComponent(params.keyword as string)
  const [activeTab, setActiveTab] = useState('overview')
  const [copied, setCopied] = useState(false)

  const analysis = generateDemoAnalysis(keyword)
  const contentGuide = generateDemoContentGuide(keyword)

  const copyKeywords = () => {
    const text = analysis.relatedKeywords.map(rk => rk.keyword).join(', ')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header + Search */}
      <div>
        <SearchBar defaultValue={keyword} />
      </div>

      {/* Keyword Title */}
      <div className="flex items-start gap-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">&ldquo;{keyword}&rdquo;</h1>
          <p className="text-gray-500 text-sm">키워드 종합 분석 결과</p>
        </div>
        <MoneyScoreGauge score={analysis.moneyScore} />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard title="월간 검색량" value={formatNumber(analysis.monthlySearchVolume)} icon={Users} />
        <MetricCard title="PC 검색량" value={formatNumber(analysis.monthlyPcVolume)} icon={Monitor} />
        <MetricCard title="모바일 검색량" value={formatNumber(analysis.monthlyMobileVolume)} icon={Smartphone} />
        <MetricCard
          title="경쟁도"
          value={analysis.competition === 'high' ? '높음' : analysis.competition === 'medium' ? '중간' : '낮음'}
          icon={Target}
        />
        <MetricCard title="CPC 추정" value={`₩${formatNumber(analysis.cpcEstimate)}`} icon={MousePointerClick} />
        <MetricCard title="Money Score" value={`${analysis.moneyScore}점`} icon={DollarSign} />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
                activeTab === tab.id ? 'tab-active' : 'tab-inactive border-transparent'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="card p-6">
                <h3 className="font-bold text-gray-900 mb-4">검색량 분포</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">PC</span>
                      <span className="font-medium">{formatNumber(analysis.monthlyPcVolume)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div
                        className="bg-blue-500 rounded-full h-3 transition-all"
                        style={{ width: `${(analysis.monthlyPcVolume / analysis.monthlySearchVolume) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">모바일</span>
                      <span className="font-medium">{formatNumber(analysis.monthlyMobileVolume)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div
                        className="bg-emerald-500 rounded-full h-3 transition-all"
                        style={{ width: `${(analysis.monthlyMobileVolume / analysis.monthlySearchVolume) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="font-bold text-gray-900 mb-4">핵심 지표</h3>
                <div className="space-y-3">
                  {[
                    { label: '콘텐츠 포화도', value: analysis.contentSaturation.toFixed(2), status: analysis.contentSaturation < 0.5 ? '블루오션' : analysis.contentSaturation < 2 ? '보통' : '레드오션' },
                    { label: '구매 의도', value: `${analysis.purchaseIntent}점`, status: analysis.purchaseIntent >= 70 ? '상업성 높음' : analysis.purchaseIntent >= 50 ? '보통' : '정보성' },
                    { label: '광고 경쟁도', value: analysis.competition === 'high' ? '높음' : analysis.competition === 'medium' ? '중간' : '낮음', status: analysis.competition === 'high' ? '광고주 다수' : '' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-surface-light">
                      <span className="text-sm text-gray-600">{item.label}</span>
                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-900">{item.value}</span>
                        {item.status && <span className="block text-xs text-gray-500">{item.status}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-gray-900 mb-4">12개월 검색 트렌드</h3>
              <TrendChart data={analysis.trendData} />
            </div>
          </div>
        )}

        {/* Money Score Tab */}
        {activeTab === 'money' && (
          <div className="space-y-6">
            <div className="card p-8 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Money Score 상세 분석</h3>
              <div className="flex justify-center mb-8">
                <MoneyScoreGauge score={analysis.moneyScore} size="lg" />
              </div>
              <div className="max-w-2xl mx-auto">
                <div className="space-y-4">
                  {[
                    { label: '검색량 점수', weight: '25%', score: Math.round((analysis.monthlySearchVolume < 10000 ? 80 : 60)), color: 'bg-blue-500' },
                    { label: 'CPC 점수', weight: '25%', score: Math.round(Math.min(100, analysis.cpcEstimate / 50)), color: 'bg-emerald-500' },
                    { label: '광고 경쟁도', weight: '20%', score: analysis.competitionScore, color: 'bg-purple-500' },
                    { label: '구매 의도', weight: '20%', score: analysis.purchaseIntent, color: 'bg-orange-500' },
                    { label: '포화도 역수', weight: '10%', score: analysis.contentSaturation < 0.5 ? 90 : analysis.contentSaturation < 2 ? 60 : 30, color: 'bg-pink-500' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-4">
                      <span className="text-sm text-gray-600 w-28 text-left">{item.label}</span>
                      <span className="text-xs text-gray-400 w-10">{item.weight}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-4">
                        <div
                          className={`${item.color} rounded-full h-4 transition-all duration-1000`}
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-900 w-12 text-right">{item.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-gray-900 mb-3">수익성 인사이트</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                  <h4 className="font-semibold text-emerald-800 mb-2">강점</h4>
                  <ul className="text-sm text-emerald-700 space-y-1">
                    {analysis.moneyScore >= 70 && <li>- 높은 수익성 점수 ({analysis.moneyScore}점)</li>}
                    {analysis.cpcEstimate >= 1000 && <li>- CPC 추정치가 높음 (₩{formatNumber(analysis.cpcEstimate)})</li>}
                    {analysis.contentSaturation < 1 && <li>- 콘텐츠 포화도 낮음 (진입 기회)</li>}
                    {analysis.purchaseIntent >= 60 && <li>- 상업적 구매 의도 키워드</li>}
                    <li>- 월간 {formatNumber(analysis.monthlySearchVolume)} 검색</li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                  <h4 className="font-semibold text-amber-800 mb-2">주의사항</h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    {analysis.competition === 'high' && <li>- 광고 경쟁이 치열함</li>}
                    {analysis.contentSaturation >= 2 && <li>- 콘텐츠 포화 상태 (차별화 필요)</li>}
                    {analysis.monthlySearchVolume > 50000 && <li>- 검색량 과다 (상위노출 어려움)</li>}
                    <li>- 지속적인 콘텐츠 업데이트 필요</li>
                    <li>- 롱테일 키워드 병행 추천</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trend Tab */}
        {activeTab === 'trend' && (
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="font-bold text-gray-900 mb-4">12개월 검색 트렌드</h3>
              <TrendChart data={analysis.trendData} height={350} />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="card p-6">
                <h3 className="font-bold text-gray-900 mb-4">요일별 검색 패턴</h3>
                <div className="space-y-2">
                  {['월', '화', '수', '목', '금', '토', '일'].map((day, i) => {
                    const val = 40 + Math.abs(Math.sin((i + keyword.length) * 1.5)) * 60
                    return (
                      <div key={day} className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 w-6">{day}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-5">
                          <div
                            className="bg-accent rounded-full h-5 flex items-center justify-end pr-2"
                            style={{ width: `${val}%` }}
                          >
                            <span className="text-xs font-medium text-gray-900">{Math.round(val)}%</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="card p-6">
                <h3 className="font-bold text-gray-900 mb-4">시간대별 검색 패턴</h3>
                <div className="space-y-2">
                  {['00-06시', '06-09시', '09-12시', '12-15시', '15-18시', '18-21시', '21-24시'].map((time, i) => {
                    const val = 20 + Math.abs(Math.cos((i + keyword.length) * 2)) * 80
                    return (
                      <div key={time} className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 w-16">{time}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-5">
                          <div
                            className="bg-blue-400 rounded-full h-5 flex items-center justify-end pr-2"
                            style={{ width: `${val}%` }}
                          >
                            <span className="text-xs font-medium text-white">{Math.round(val)}%</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Related Keywords Tab */}
        {activeTab === 'related' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">연관 키워드 ({analysis.relatedKeywords.length}개)</h3>
              <button
                onClick={copyKeywords}
                className="flex items-center gap-2 btn-secondary text-sm py-2"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? '복사됨!' : '키워드 태그 복사'}
              </button>
            </div>
            <div className="card">
              <KeywordTable keywords={analysis.relatedKeywords} />
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-gray-900 mb-4">롱테일 키워드 제안</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  `${keyword} 추천 2024`,
                  `${keyword} 가성비`,
                  `${keyword} 초보자`,
                  `${keyword} 비교 분석`,
                  `${keyword} 실제 후기`,
                  `${keyword} 장단점 정리`,
                  `${keyword} 선택 방법`,
                  `${keyword} 가격 비교`,
                  `${keyword} 인기 순위`,
                  `${keyword} 전문가 추천`,
                ].map((lk) => (
                  <a
                    key={lk}
                    href={`/analyze/${encodeURIComponent(lk)}`}
                    className="px-3 py-2 rounded-lg bg-surface-light text-sm text-gray-700 hover:bg-accent hover:text-gray-900 transition-colors"
                  >
                    {lk}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Content Guide Tab */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-accent-dark" />
                <h3 className="font-bold text-gray-900">추천 블로그 제목</h3>
              </div>
              <div className="space-y-2">
                {contentGuide.suggestedTitles.map((title, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-surface-light hover:bg-surface transition-colors">
                    <span className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-gray-900">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-800">{title}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="card p-6">
                <h3 className="font-bold text-gray-900 mb-4">추천 글 구조</h3>
                <div className="space-y-2">
                  {contentGuide.headingStructure.map((h, i) => (
                    <div key={i} className={cn(
                      'p-2 rounded-lg text-sm',
                      h.startsWith('H1') ? 'bg-accent/20 font-bold pl-3' :
                      h.startsWith('H2') ? 'bg-blue-50 font-medium pl-6' :
                      'bg-gray-50 pl-10'
                    )}>
                      {h}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="card p-6">
                  <h3 className="font-bold text-gray-900 mb-4">필수 포함 키워드</h3>
                  <div className="flex flex-wrap gap-2">
                    {contentGuide.requiredKeywords.map((kw) => (
                      <span key={kw} className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="card p-6">
                  <h3 className="font-bold text-gray-900 mb-4">발행 전략</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 rounded-xl bg-surface-light">
                      <span className="text-sm text-gray-500">추천 글 길이</span>
                      <span className="text-sm font-bold">{formatNumber(contentGuide.recommendedLength)}자</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-xl bg-surface-light">
                      <span className="text-sm text-gray-500">최적 발행 시간</span>
                      <span className="text-sm font-bold">{contentGuide.bestPublishTime}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-gray-900 mb-4">경쟁 콘텐츠 인사이트</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {contentGuide.competitorInsights.map((insight, i) => (
                  <div key={i} className="p-3 rounded-xl bg-surface-light text-sm text-gray-700">
                    {insight}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Platform Comparison Tab */}
        {activeTab === 'platform' && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {analysis.platforms.map((p) => (
                <div key={p.platform} className="card p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-gray-900">{p.platform}</span>
                    <span className={cn(
                      'text-xs font-medium px-2 py-1 rounded-full',
                      p.trendDirection === 'up' ? 'bg-emerald-50 text-emerald-600' :
                      p.trendDirection === 'down' ? 'bg-red-50 text-red-500' :
                      'bg-gray-50 text-gray-500'
                    )}>
                      {p.trendDirection === 'up' ? '상승' : p.trendDirection === 'down' ? '하락' : '유지'}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {formatNumber(p.searchVolume)}
                  </div>
                  <div className="text-sm text-gray-500">월간 검색량</div>
                  <div className={cn(
                    'text-sm font-medium mt-2',
                    p.trendDirection === 'up' ? 'text-emerald-600' : p.trendDirection === 'down' ? 'text-red-500' : 'text-gray-500'
                  )}>
                    {p.trendDirection === 'up' ? '+' : p.trendDirection === 'down' ? '-' : ''}{p.changePercent}%
                  </div>
                </div>
              ))}
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-gray-900 mb-4">플랫폼별 전략 추천</h3>
              <div className="space-y-3">
                {[
                  { platform: 'Naver', strategy: '블로그 포스팅 + 스마트블록 최적화. 네이버 검색에서 가장 많은 트래픽을 기대할 수 있습니다.' },
                  { platform: 'Google', strategy: 'SEO 최적화 블로그/웹사이트. 구글 검색 상위노출로 장기적 트래픽을 확보하세요.' },
                  { platform: 'Daum', strategy: '티스토리 블로그 운영. 다음 검색에서 티스토리 글이 우선 노출됩니다.' },
                  { platform: 'Bing', strategy: '영문 콘텐츠 병행 시 글로벌 트래픽 추가 확보가 가능합니다.' },
                ].map((item) => (
                  <div key={item.platform} className="flex items-start gap-4 p-4 rounded-xl bg-surface-light">
                    <span className="text-sm font-bold text-gray-900 w-16">{item.platform}</span>
                    <span className="text-sm text-gray-600">{item.strategy}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
