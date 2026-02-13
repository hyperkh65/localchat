'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Trophy, Search, Crown, BarChart3, Target, AlertCircle,
  ExternalLink, Loader2, BookOpen, TrendingUp, Shield,
  Users, FileText, Star, Lightbulb
} from 'lucide-react'

interface BlogRankItem {
  rank: number
  title: string
  link: string
  blogName: string
  platform: 'naver' | 'tistory' | 'wordpress' | 'other'
  postDate: string
  titleLength: number
  hasKeywordInTitle: boolean
  description: string
}

interface TopPostAnalysis {
  avgTitleLength: number
  avgDescriptionLength: number
  platformDistribution: Record<string, number>
  keywordInTitleRate: number
  topKeywords: Array<{ word: string; count: number }>
  recentPostRate: number
  competitionLevel: string
  recommendations: string[]
}

interface KeywordInfo {
  monthlyVolume: number
  competition: string
  saturation: { index: number; level: string; label: string }
  difficulty: { score: number; grade: string; label: string; recommendedBlogLevel: string }
}

interface MyRankResult {
  keyword: string
  myRank: number | null
  totalResults: number
  topCompetitor: string
}

const platformLabel: Record<string, { name: string; color: string }> = {
  naver: { name: '네이버', color: 'bg-green-100 text-green-700' },
  tistory: { name: '티스토리', color: 'bg-orange-100 text-orange-700' },
  wordpress: { name: '워드프레스', color: 'bg-blue-100 text-blue-700' },
  other: { name: '기타', color: 'bg-gray-100 text-gray-600' },
}

const difficultyColor: Record<string, string> = {
  S: 'text-red-600 bg-red-50',
  A: 'text-orange-600 bg-orange-50',
  B: 'text-yellow-600 bg-yellow-50',
  C: 'text-emerald-600 bg-emerald-50',
  D: 'text-blue-600 bg-blue-50',
}

const competitionColor: Record<string, string> = {
  very_high: 'text-red-600',
  high: 'text-orange-500',
  medium: 'text-yellow-600',
  low: 'text-emerald-600',
}

const competitionLabel: Record<string, string> = {
  very_high: '매우 치열',
  high: '치열',
  medium: '보통',
  low: '낮음',
}

export default function BlogRankPage() {
  const [keyword, setKeyword] = useState('')
  const [blogUrl, setBlogUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [rankings, setRankings] = useState<BlogRankItem[]>([])
  const [analysis, setAnalysis] = useState<TopPostAnalysis | null>(null)
  const [keywordInfo, setKeywordInfo] = useState<KeywordInfo | null>(null)
  const [myRank, setMyRank] = useState<MyRankResult | null>(null)
  const [searched, setSearched] = useState(false)

  const handleSearch = async () => {
    const kw = keyword.trim()
    if (!kw) return

    setLoading(true)
    setSearched(true)

    try {
      const params = new URLSearchParams({ keyword: kw })
      if (blogUrl.trim()) params.set('blogUrl', blogUrl.trim())

      const res = await fetch(`/api/blog-rank?${params}`)
      const json = await res.json()

      if (json.success && json.data) {
        setRankings(json.data.rankings || [])
        setAnalysis(json.data.analysis || null)
        setKeywordInfo(json.data.keywordInfo || null)
        setMyRank(json.data.myRank || null)
      }
    } catch (err) {
      console.error('Blog rank fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Trophy className="w-7 h-7 text-yellow-500" />
          <h1 className="text-2xl font-bold text-gray-900">블로그 랭킹</h1>
        </div>
        <p className="text-gray-500 text-sm">키워드별 블로그 순위 분석 & 내 블로그 순위 추적 (판다랭크 + 키자드 벤치마킹)</p>
      </div>

      {/* Search */}
      <div className="card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Search className="w-4 h-4 inline mr-1" />
            분석할 키워드
          </label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="예: 다이어트 식단, 노트북 추천, 부업 추천"
            className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-3 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Star className="w-4 h-4 inline mr-1" />
            내 블로그 URL (선택)
          </label>
          <input
            type="text"
            value={blogUrl}
            onChange={(e) => setBlogUrl(e.target.value)}
            placeholder="예: blog.naver.com/myblog 또는 myblog.tistory.com"
            className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-3 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
          />
        </div>
        <button onClick={handleSearch} disabled={loading || !keyword.trim()} className="btn-primary w-full py-3 disabled:opacity-50">
          {loading ? '분석 중...' : '블로그 랭킹 분석'}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="card p-12 text-center">
          <Loader2 className="w-10 h-10 text-yellow-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">블로그 순위를 분석하고 있습니다...</p>
          <p className="text-xs text-gray-400 mt-1">네이버 + 다음 블로그 데이터 수집 중</p>
        </div>
      )}

      {/* Results */}
      {!loading && searched && (
        <div className="space-y-6">
          {/* Keyword Info Cards */}
          {keywordInfo && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card p-4 text-center">
                <div className="text-xs text-gray-400 mb-1">월간 검색량</div>
                <div className="text-xl font-bold text-gray-900">
                  {keywordInfo.monthlyVolume > 0 ? keywordInfo.monthlyVolume.toLocaleString() : '추정 중'}
                </div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-xs text-gray-400 mb-1">콘텐츠 포화도</div>
                <div className={cn('text-xl font-bold', {
                  'text-emerald-600': keywordInfo.saturation.level === 'very_low' || keywordInfo.saturation.level === 'low',
                  'text-yellow-600': keywordInfo.saturation.level === 'medium',
                  'text-red-600': keywordInfo.saturation.level === 'high' || keywordInfo.saturation.level === 'very_high',
                })}>
                  {keywordInfo.saturation.label}
                </div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-xs text-gray-400 mb-1">키워드 난이도</div>
                <div className="flex items-center justify-center gap-2">
                  <span className={cn('text-lg font-bold px-2 py-0.5 rounded', difficultyColor[keywordInfo.difficulty.grade] || '')}>
                    {keywordInfo.difficulty.grade}
                  </span>
                  <span className="text-sm text-gray-600">{keywordInfo.difficulty.label}</span>
                </div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-xs text-gray-400 mb-1">추천 블로그 수준</div>
                <div className="text-sm font-medium text-gray-700">{keywordInfo.difficulty.recommendedBlogLevel}</div>
              </div>
            </div>
          )}

          {/* My Blog Rank */}
          {myRank && (
            <div className={cn('card p-6', myRank.myRank ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : 'bg-gradient-to-r from-gray-50 to-gray-100')}>
              <div className="flex items-center gap-3 mb-3">
                <Crown className="w-6 h-6 text-yellow-500" />
                <h2 className="font-bold text-gray-900">내 블로그 순위</h2>
              </div>
              {myRank.myRank ? (
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-black text-yellow-600">{myRank.myRank}위</div>
                  <div className="text-sm text-gray-600">
                    <p>전체 {myRank.totalResults}개 결과 중</p>
                    <p>1위 블로거: <strong>{myRank.topCompetitor}</strong></p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-gray-500">
                  <AlertCircle className="w-5 h-5" />
                  <span>상위 30위 안에 내 블로그가 없습니다. 콘텐츠 전략을 수립하세요!</span>
                </div>
              )}
            </div>
          )}

          {/* Top Post Analysis */}
          {analysis && (
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                <h2 className="font-bold text-gray-900">상위 포스트 역분석</h2>
                <span className="text-xs text-gray-400 ml-auto">상위 10개 포스트 기준</span>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="p-3 rounded-xl bg-surface-light text-center">
                  <div className="text-xs text-gray-400 mb-1">평균 제목 길이</div>
                  <div className="text-lg font-bold text-gray-900">{analysis.avgTitleLength}자</div>
                </div>
                <div className="p-3 rounded-xl bg-surface-light text-center">
                  <div className="text-xs text-gray-400 mb-1">키워드 포함 비율</div>
                  <div className="text-lg font-bold text-accent-dark">{analysis.keywordInTitleRate}%</div>
                </div>
                <div className="p-3 rounded-xl bg-surface-light text-center">
                  <div className="text-xs text-gray-400 mb-1">최근 30일 포스트</div>
                  <div className="text-lg font-bold text-blue-600">{analysis.recentPostRate}%</div>
                </div>
                <div className="p-3 rounded-xl bg-surface-light text-center">
                  <div className="text-xs text-gray-400 mb-1">경쟁 수준</div>
                  <div className={cn('text-lg font-bold', competitionColor[analysis.competitionLevel] || 'text-gray-600')}>
                    {competitionLabel[analysis.competitionLevel] || analysis.competitionLevel}
                  </div>
                </div>
              </div>

              {/* Platform Distribution */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" /> 플랫폼 분포 (상위 10)
                </h3>
                <div className="flex gap-2">
                  {Object.entries(analysis.platformDistribution).filter(([, v]) => v > 0).map(([platform, count]) => (
                    <div key={platform} className={cn('px-3 py-2 rounded-xl text-sm font-medium', platformLabel[platform]?.color || 'bg-gray-100')}>
                      {platformLabel[platform]?.name || platform} {count}개
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Keywords in Titles */}
              {analysis.topKeywords.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> 상위 포스트에 자주 등장하는 단어
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.topKeywords.map((kw) => (
                      <span key={kw.word} className="px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 text-sm">
                        {kw.word}
                        <span className="ml-1 text-purple-400 text-xs">x{kw.count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500" /> AI 추천
                </h3>
                <div className="space-y-2">
                  {analysis.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-yellow-50 text-sm text-gray-700">
                      <Target className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Blog Rankings Table */}
          {rankings.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <h2 className="font-bold text-gray-900">블로그 순위 TOP {rankings.length}</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-3 px-2 text-left text-gray-400 font-medium w-12">#</th>
                      <th className="py-3 px-2 text-left text-gray-400 font-medium">제목</th>
                      <th className="py-3 px-2 text-left text-gray-400 font-medium w-20">플랫폼</th>
                      <th className="py-3 px-2 text-left text-gray-400 font-medium w-28">블로그명</th>
                      <th className="py-3 px-2 text-left text-gray-400 font-medium w-24">날짜</th>
                      <th className="py-3 px-2 text-center text-gray-400 font-medium w-16">키워드</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankings.map((item) => (
                      <tr key={item.rank} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-2">
                          <span className={cn('font-bold', {
                            'text-yellow-500': item.rank <= 3,
                            'text-gray-400': item.rank > 3,
                          })}>
                            {item.rank <= 3 ? <Crown className="w-4 h-4 inline" /> : item.rank}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <a href={item.link} target="_blank" rel="noopener noreferrer"
                            className="text-gray-800 hover:text-accent-dark font-medium flex items-center gap-1 max-w-md truncate">
                            {item.title}
                            <ExternalLink className="w-3 h-3 text-gray-300 flex-shrink-0" />
                          </a>
                        </td>
                        <td className="py-3 px-2">
                          <span className={cn('text-xs px-2 py-1 rounded-full font-medium', platformLabel[item.platform]?.color)}>
                            {platformLabel[item.platform]?.name}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-gray-500 truncate max-w-[120px]">{item.blogName}</td>
                        <td className="py-3 px-2 text-gray-400 text-xs">{item.postDate}</td>
                        <td className="py-3 px-2 text-center">
                          {item.hasKeywordInTitle
                            ? <Shield className="w-4 h-4 text-emerald-500 mx-auto" />
                            : <span className="text-gray-300">-</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty state */}
          {rankings.length === 0 && !loading && searched && (
            <div className="card p-12 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">검색 결과가 없습니다</p>
              <p className="text-gray-400 text-sm mt-1">다른 키워드를 시도해보세요</p>
            </div>
          )}
        </div>
      )}

      {/* Guide when not searched */}
      {!searched && (
        <div className="card p-6 bg-gradient-to-r from-yellow-50 to-orange-50">
          <div className="flex items-start gap-3">
            <BookOpen className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-gray-900 mb-2">블로그 랭킹 분석 기능</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>- <strong>키워드별 TOP 30 블로그 순위</strong>: 네이버/티스토리 블로그를 실시간으로 랭킹합니다.</li>
                <li>- <strong>상위 포스트 역분석</strong>: 1위~10위 포스트의 제목 길이, 키워드 밀도, 플랫폼 분포를 분석합니다.</li>
                <li>- <strong>내 블로그 순위 추적</strong>: 내 블로그 URL을 입력하면 해당 키워드에서의 순위를 확인합니다.</li>
                <li>- <strong>콘텐츠 포화도</strong>: 경쟁이 적은 블루오션 키워드를 식별합니다.</li>
                <li>- <strong>키워드 난이도</strong>: 내 블로그 수준에 맞는 키워드인지 알려줍니다.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
