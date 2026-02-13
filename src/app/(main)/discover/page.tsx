'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Compass, Gem, Target, Lightbulb, Loader2, Wifi, WifiOff, FileText, Trophy, BarChart3, Zap } from 'lucide-react'
import AdSense, { AD_SLOTS } from '@/components/AdSense'
import AdInterstitial from '@/components/AdInterstitial'

interface Saturation { index: number; level: string; label: string }
interface Difficulty { score: number; grade: string; label: string; recommendedBlogLevel: string }

interface DiscoverKeyword {
  keyword: string
  monthlyVolume: number
  competition: 'high' | 'medium' | 'low'
  moneyScore: number
  moneyGrade: 'S' | 'A' | 'B' | 'C' | 'D'
  isBlueOcean: boolean
  saturation?: Saturation
  difficulty?: Difficulty
}

const categoryList = ['재테크', '건강', 'IT/테크', '부동산', '교육', '패션', '여행', '생활']

const saturationColor: Record<string, string> = {
  very_low: 'text-blue-600 bg-blue-50',
  low: 'text-emerald-600 bg-emerald-50',
  medium: 'text-yellow-600 bg-yellow-50',
  high: 'text-orange-600 bg-orange-50',
  very_high: 'text-red-600 bg-red-50',
}

const difficultyColor: Record<string, string> = {
  S: 'text-red-600 bg-red-50',
  A: 'text-orange-600 bg-orange-50',
  B: 'text-yellow-600 bg-yellow-50',
  C: 'text-emerald-600 bg-emerald-50',
  D: 'text-blue-600 bg-blue-50',
}

function DiscoverContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialCategory = searchParams.get('category') || '재테크'

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory)
  const [blueOcean, setBlueOcean] = useState<DiscoverKeyword[]>([])
  const [allKeywords, setAllKeywords] = useState<DiscoverKeyword[]>([])
  const [combinations, setCombinations] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [isRealData, setIsRealData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [seedKeyword, setSeedKeyword] = useState('')
  const [showInterstitial, setShowInterstitial] = useState(false)
  const [searchCount, setSearchCount] = useState(0)

  const fetchDiscover = async (category: string, seed?: string) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (seed) {
        params.set('seed', seed)
      } else {
        params.set('category', category)
      }
      const res = await fetch(`/api/discover?${params}`)
      const json = await res.json()

      if (json.success && json.data) {
        setBlueOcean(json.data.blueOcean || [])
        setAllKeywords(json.data.all || [])
        setCombinations(json.data.combinations || [])
        setIsRealData(json.isRealData !== false)
      } else {
        setError(json.error || '데이터를 불러올 수 없습니다')
      }
    } catch (err) {
      console.error('Discover fetch error:', err)
      setError('네트워크 오류')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDiscover(selectedCategory)
  }, [selectedCategory])

  const handleSeedSearch = () => {
    const kw = seedKeyword.trim()
    if (!kw) return
    const newCount = searchCount + 1
    setSearchCount(newCount)
    // Show interstitial ad every 2 searches
    if (newCount % 2 === 0) {
      setShowInterstitial(true)
    }
    fetchDiscover(selectedCategory, kw)
  }

  return (
    <div className="space-y-8">
      {/* Interstitial Ad Modal */}
      <AdInterstitial show={showInterstitial} onClose={() => setShowInterstitial(false)} delay={5} />

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Compass className="w-7 h-7 text-purple-500" />
          <h1 className="text-2xl font-bold text-gray-900">키워드 발굴</h1>
          {isRealData && (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              <Wifi className="w-3 h-3" /> 실데이터
            </span>
          )}
        </div>
        <p className="text-gray-500 text-sm">블랙키위 포화도 + 키워드마스터 조합 + 판다랭크 난이도 분석</p>
      </div>

      {/* Ad - Top */}
      <AdSense slot={AD_SLOTS.DISCOVER_TOP} className="my-2" />

      {/* Seed Keyword Search */}
      <div className="card p-6">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent-dark" />
          시드 키워드로 확장하기
        </h3>
        <p className="text-sm text-gray-500 mb-4">키워드를 입력하면 자동 조합 + 관련 롱테일 키워드를 발굴합니다</p>
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={seedKeyword}
              onChange={(e) => setSeedKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSeedSearch()}
              placeholder="시드 키워드 입력 (예: 다이어트, 부업, 투자)"
              className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-3 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
            />
          </div>
          <button onClick={handleSeedSearch} disabled={loading} className="btn-primary whitespace-nowrap disabled:opacity-50">
            {loading ? '발굴 중...' : '키워드 발굴'}
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 flex-wrap">
        {categoryList.map((cat) => (
          <button
            key={cat}
            onClick={() => { setSelectedCategory(cat); setSeedKeyword('') }}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-colors',
              selectedCategory === cat && !seedKeyword
                ? 'bg-accent text-gray-900'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Keyword Combinations */}
      {combinations.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            <h2 className="font-bold text-gray-900">키워드 자동 조합</h2>
            <span className="text-xs text-gray-400 ml-auto">{combinations.length}개 생성</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {combinations.map((combo) => (
              <button
                key={combo}
                onClick={() => { setSeedKeyword(combo); fetchDiscover(selectedCategory, combo) }}
                className="px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-sm hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                {combo}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">키워드 발굴 중...</p>
          <p className="text-gray-400 text-sm mt-1">포화도 & 난이도 분석 포함</p>
        </div>
      ) : error ? (
        <div className="card p-8 text-center">
          <WifiOff className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-red-500 font-medium mb-2">{error}</p>
        </div>
      ) : (
        <>
          {/* Blue Ocean Keywords */}
          {blueOcean.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Gem className="w-5 h-5 text-blue-500" />
                <h2 className="font-bold text-gray-900">블루오션 키워드</h2>
                <span className="ml-auto text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  {blueOcean.length}개 발견
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-2 px-2 text-left text-gray-400 font-medium">키워드</th>
                      <th className="py-2 px-2 text-right text-gray-400 font-medium">검색량</th>
                      <th className="py-2 px-2 text-center text-gray-400 font-medium">Money</th>
                      <th className="py-2 px-2 text-center text-gray-400 font-medium">포화도</th>
                      <th className="py-2 px-2 text-center text-gray-400 font-medium">난이도</th>
                      <th className="py-2 px-2 text-center text-gray-400 font-medium">액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blueOcean.map((kw) => (
                      <tr key={kw.keyword} className="border-b border-gray-50 hover:bg-blue-50/50 transition-colors">
                        <td className="py-3 px-2 font-medium text-gray-800">{kw.keyword}</td>
                        <td className="py-3 px-2 text-right text-gray-600">{kw.monthlyVolume.toLocaleString()}</td>
                        <td className="py-3 px-2 text-center">
                          <span className={cn('px-2 py-0.5 rounded text-xs font-bold', {
                            'score-s': kw.moneyGrade === 'S', 'score-a': kw.moneyGrade === 'A',
                            'score-b': kw.moneyGrade === 'B', 'score-c': kw.moneyGrade === 'C', 'score-d': kw.moneyGrade === 'D',
                          })}>{kw.moneyGrade} ({kw.moneyScore})</span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          {kw.saturation && (
                            <span className={cn('px-2 py-0.5 rounded text-xs font-medium', saturationColor[kw.saturation.level] || '')}>
                              {kw.saturation.label.split('(')[0].trim()}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {kw.difficulty && (
                            <span className={cn('px-2 py-0.5 rounded text-xs font-bold', difficultyColor[kw.difficulty.grade] || '')}>
                              {kw.difficulty.grade}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex gap-1 justify-center">
                            <button onClick={() => router.push(`/content-guide?keyword=${encodeURIComponent(kw.keyword)}`)}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100" title="콘텐츠 가이드">
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => router.push(`/blog-rank?keyword=${encodeURIComponent(kw.keyword)}`)}
                              className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100" title="블로그 랭킹">
                              <Trophy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Ad - Mid (between Blue Ocean and All Keywords) */}
          <AdSense slot={AD_SLOTS.DISCOVER_MID} format="fluid" className="my-2" />

          {/* All Keywords */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-orange-500" />
              <h2 className="font-bold text-gray-900">전체 키워드</h2>
              <span className="ml-auto text-xs text-gray-400">{allKeywords.length}개 · Money Score 순</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-2 px-2 text-left text-gray-400 font-medium">키워드</th>
                    <th className="py-2 px-2 text-right text-gray-400 font-medium">검색량</th>
                    <th className="py-2 px-2 text-center text-gray-400 font-medium">경쟁도</th>
                    <th className="py-2 px-2 text-center text-gray-400 font-medium">Money</th>
                    <th className="py-2 px-2 text-center text-gray-400 font-medium">포화도</th>
                    <th className="py-2 px-2 text-center text-gray-400 font-medium">난이도</th>
                    <th className="py-2 px-2 text-center text-gray-400 font-medium">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {allKeywords.map((kw) => (
                    <tr key={kw.keyword} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-2">
                        <span className="font-medium text-gray-800">{kw.keyword}</span>
                        {kw.isBlueOcean && <span className="ml-1 text-xs text-blue-500">&#x1F48E;</span>}
                      </td>
                      <td className="py-3 px-2 text-right text-gray-600">{kw.monthlyVolume.toLocaleString()}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={cn('text-xs px-2 py-0.5 rounded-full', {
                          'bg-red-50 text-red-600': kw.competition === 'high',
                          'bg-yellow-50 text-yellow-600': kw.competition === 'medium',
                          'bg-emerald-50 text-emerald-600': kw.competition === 'low',
                        })}>{kw.competition === 'high' ? '높음' : kw.competition === 'medium' ? '보통' : '낮음'}</span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={cn('px-2 py-0.5 rounded text-xs font-bold', {
                          'score-s': kw.moneyGrade === 'S', 'score-a': kw.moneyGrade === 'A',
                          'score-b': kw.moneyGrade === 'B', 'score-c': kw.moneyGrade === 'C', 'score-d': kw.moneyGrade === 'D',
                        })}>{kw.moneyGrade}</span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        {kw.saturation && (
                          <span className={cn('px-1.5 py-0.5 rounded text-xs', saturationColor[kw.saturation.level] || '')}>
                            {kw.saturation.index.toFixed(1)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {kw.difficulty && (
                          <span className={cn('px-2 py-0.5 rounded text-xs font-bold', difficultyColor[kw.difficulty.grade] || '')}>
                            {kw.difficulty.grade}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => router.push(`/content-guide?keyword=${encodeURIComponent(kw.keyword)}`)}
                            className="p-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100" title="콘텐츠 가이드">
                            <FileText className="w-3 h-3" />
                          </button>
                          <button onClick={() => router.push(`/blog-rank?keyword=${encodeURIComponent(kw.keyword)}`)}
                            className="p-1 rounded bg-yellow-50 text-yellow-600 hover:bg-yellow-100" title="블로그 랭킹">
                            <Trophy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Ad - Bottom */}
      <AdSense slot={AD_SLOTS.DISCOVER_BOTTOM} className="my-2" />

      {/* Tips */}
      <div className="card p-6 bg-gradient-to-r from-accent/5 to-emerald-50">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-6 h-6 text-accent-dark flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-gray-900 mb-2">키워드 발굴 전략 (벤치마킹)</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>- <strong>포화도 &lt; 0.5</strong>인 키워드가 블루오션입니다 (블랙키위 기준)</li>
              <li>- <strong>난이도 C~D등급</strong>이면 초보 블로그도 상위 진입 가능합니다</li>
              <li>- <strong>Money Score A등급 이상</strong> + <strong>낮은 포화도</strong> = 최고의 키워드</li>
              <li>- 발견한 키워드의 <strong>콘텐츠 가이드</strong>를 바로 생성해서 글을 작성하세요</li>
              <li>- <strong>블로그 랭킹</strong>에서 상위 포스트를 역분석하면 성공 확률이 높아집니다</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
        <p className="text-gray-500">로딩 중...</p>
      </div>
    }>
      <DiscoverContent />
    </Suspense>
  )
}
