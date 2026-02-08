'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import SearchBar from '@/components/SearchBar'
import KeywordTable from '@/components/KeywordTable'
import { cn } from '@/lib/utils'
import { Compass, Gem, Target, Lightbulb, Loader2, Wifi, WifiOff } from 'lucide-react'

interface DiscoverKeyword {
  keyword: string
  monthlyVolume: number
  competition: 'high' | 'medium' | 'low'
  moneyScore: number
  moneyGrade: 'S' | 'A' | 'B' | 'C' | 'D'
  isBlueOcean: boolean
}

const categoryList = ['재테크', '건강', 'IT/테크', '부동산', '교육', '패션', '여행', '생활']

function DiscoverContent() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category') || '재테크'

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory)
  const [blueOcean, setBlueOcean] = useState<DiscoverKeyword[]>([])
  const [allKeywords, setAllKeywords] = useState<DiscoverKeyword[]>([])
  const [loading, setLoading] = useState(true)
  const [isRealData, setIsRealData] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDiscover() {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`/api/discover?category=${encodeURIComponent(selectedCategory)}`)
        const json = await res.json()

        if (json.success && json.data) {
          setBlueOcean(json.data.blueOcean || [])
          setAllKeywords(json.data.all || [])
          setIsRealData(true)
        } else {
          setError(json.error || '데이터를 불러올 수 없습니다')
        }
      } catch (err) {
        console.error('Discover fetch error:', err)
        setError('네트워크 오류: API 서버에 연결할 수 없습니다')
      } finally {
        setLoading(false)
      }
    }

    fetchDiscover()
  }, [selectedCategory])

  return (
    <div className="space-y-8">
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
        <p className="text-gray-500 text-sm">경쟁이 적고 수익성 높은 블루오션 키워드를 발굴하세요</p>
      </div>

      {/* Search for seed keyword */}
      <div className="card p-6">
        <h3 className="font-bold text-gray-900 mb-3">시드 키워드로 확장하기</h3>
        <p className="text-sm text-gray-500 mb-4">키워드를 입력하면 관련 롱테일 키워드를 자동으로 발굴합니다</p>
        <SearchBar placeholder="시드 키워드를 입력하세요 (예: 다이어트, 부업, 투자)" />
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 flex-wrap">
        {categoryList.map((cat) => (
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

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">&ldquo;{selectedCategory}&rdquo; 카테고리 키워드 발굴 중...</p>
          <p className="text-gray-400 text-sm mt-1">네이버 검색광고 API에서 실제 데이터 수집 중</p>
        </div>
      ) : error ? (
        <div className="card p-8 text-center">
          <WifiOff className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-red-500 font-medium mb-2">{error}</p>
          <p className="text-gray-400 text-sm">API 키 설정을 확인해주세요</p>
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
              <p className="text-sm text-gray-500 mb-4">
                경쟁도 낮음 + Money Score 60점 이상 + 월간 검색 500회 이상
              </p>
              <KeywordTable keywords={blueOcean} />
            </div>
          )}

          {/* All Keywords */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-orange-500" />
              <h2 className="font-bold text-gray-900">{selectedCategory} 카테고리 키워드</h2>
              <span className="ml-auto text-xs text-gray-400">
                {allKeywords.length}개 &middot; Money Score 순 정렬
              </span>
            </div>
            <KeywordTable keywords={allKeywords} />
          </div>
        </>
      )}

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
