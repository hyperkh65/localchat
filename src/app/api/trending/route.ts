/**
 * 실시간 트렌딩 키워드 API
 *
 * 전략 (우선순위):
 * 1) 네이버 뉴스 API (작동중!) → 최신 뉴스에서 실시간 키워드 추출
 * 2) 다음/카카오 웹 검색 (작동중!) → 추가 트렌딩 키워드 보강
 * 3) 네이버 DataLab (작동중!) → 추출된 키워드의 실제 트렌드 점수
 * 4) 네이버 검색광고 API (보너스) → 실제 검색량 보강
 * 5) 모두 실패 시에만 데모 폴백
 */

import { NextResponse } from 'next/server'
import { fetchKeywordData } from '@/lib/naver-ad-api'
import { searchNews, fetchSearchTrend } from '@/lib/naver-search-api'
import { searchDaumWeb } from '@/lib/kakao-api'
import { calculateMoneyScore, getMoneyGrade } from '@/lib/keyword-engine'
import { saveTrendingSnapshot, getLatestTrending, type TrendingRow } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// 뉴스에서 이슈 키워드를 추출하는 다양한 검색어
const NEWS_QUERIES = ['오늘 인기', '화제', '급상승', '이슈', '트렌드']

function classifyCategory(keyword: string): string {
  const categories: Record<string, string[]> = {
    'IT/테크': ['아이폰', '갤럭시', '삼성', '애플', 'AI', '인공지능', '노트북', '스마트폰', '반도체', '맥북', '태블릿', '모니터', '이어폰', '키보드', 'SSD', 'GPU', '챗봇', 'GPT', '클로드', '로봇'],
    '금융': ['주가', '코스피', '금리', '환율', '비트코인', '투자', '주식', 'ETF', '증시', '은행', '대출', '배당', '펀드', '코인', '나스닥'],
    '건강': ['건강', '다이어트', '운동', '병원', '치료', '식단', '영양', '비타민', '유산균', '단백질', '홈트', '의료', '백신'],
    '부동산': ['아파트', '전세', '월세', '청약', '부동산', '분양', '매매', '인테리어', '재건축'],
    '교육': ['수능', '입시', '대학', '교육', '자격증', '코딩', '영어', '토익', '학교', '교사'],
    '패션': ['패션', '브랜드', '명품', '코디', '의류', '뷰티', '화장품'],
    '여행': ['여행', '항공', '호텔', '관광', '맛집', '제주', '해외', '비행기'],
    '자동차': ['자동차', '전기차', '현대', '기아', 'SUV', '중고차', '테슬라', '충전'],
    '엔터': ['드라마', '영화', '넷플릭스', '아이돌', '콘서트', '게임', '웹툰', 'K팝', '예능'],
    '쇼핑': ['할인', '세일', '쿠폰', '최저가', '가성비', '리뷰', '후기'],
    '재테크': ['부업', '재테크', '적금', '연금', '절약', '소득', '수익'],
    '정치/사회': ['대통령', '국회', '정부', '선거', '정치', '법원', '경찰', '검찰', '사건', '사고'],
  }
  const lower = keyword.toLowerCase()
  for (const [cat, patterns] of Object.entries(categories)) {
    if (patterns.some(p => lower.includes(p.toLowerCase()))) return cat
  }
  return '일반'
}

// 뉴스/웹 제목에서 실시간 키워드 추출
function extractTrendingKeywords(titles: string[]): Map<string, number> {
  const stopwords = new Set([
    '있다', '없다', '되다', '하다', '이다', '것이다', '한다', '위해', '대한', '통해',
    '에서', '으로', '까지', '부터', '에는', '이는', '라고', '라며', '했다', '됐다',
    '밝혔다', '전했다', '보도', '기자', '뉴스', '속보', '종합', '단독', '영상',
    '포토', '사진', '관련', '관한', '대해', '따르면', '것으로', '이번', '지난',
    '올해', '오늘', '어제', '내일', '작년', '내년', '그리고', '하지만', '때문',
    'the', 'of', 'and', 'in', 'to', 'is', 'for',
  ])

  const keywordCount = new Map<string, number>()

  for (const title of titles) {
    const clean = title.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ').replace(/[""''「」『』\[\]()]/g, ' ')

    // 2-3어절 구문 추출 (핵심)
    const phrases = clean.match(/[가-힣]+\s[가-힣]+(?:\s[가-힣]+)?/g) || []
    for (const phrase of phrases) {
      const trimmed = phrase.trim()
      if (trimmed.length >= 4 && trimmed.length <= 20) {
        const words = trimmed.split(/\s+/)
        if (words.every(w => !stopwords.has(w) && w.length >= 2)) {
          keywordCount.set(trimmed, (keywordCount.get(trimmed) || 0) + 3)
        }
      }
    }

    // 단일 단어 추출 (2글자 이상 명사)
    const words = clean.match(/[가-힣]{2,6}/g) || []
    for (const word of words) {
      if (!stopwords.has(word) && word.length >= 2) {
        keywordCount.set(word, (keywordCount.get(word) || 0) + 1)
      }
    }

    // 영문 키워드 (AI, ETF 등)
    const engWords = clean.match(/[A-Za-z]{2,}/g) || []
    for (const w of engWords) {
      if (!stopwords.has(w.toLowerCase()) && w.length >= 2) {
        keywordCount.set(w.toUpperCase(), (keywordCount.get(w.toUpperCase()) || 0) + 1)
      }
    }
  }

  return keywordCount
}

// 데모 폴백
function generateFallbackTrending() {
  const year = new Date().getFullYear()
  const items = [
    { keyword: 'AI 에이전트', category: 'IT/테크', volume: 28500, comp: 'high' as const },
    { keyword: '비트코인 시세', category: '금융', volume: 45200, comp: 'high' as const },
    { keyword: '갤럭시 S25', category: 'IT/테크', volume: 38000, comp: 'high' as const },
    { keyword: '전세사기 예방', category: '부동산', volume: 12300, comp: 'medium' as const },
    { keyword: '다이어트 식단', category: '건강', volume: 21500, comp: 'high' as const },
    { keyword: `전기차 보조금 ${year}`, category: '자동차', volume: 15800, comp: 'medium' as const },
    { keyword: '코딩 부트캠프 추천', category: '교육', volume: 8700, comp: 'low' as const },
    { keyword: '부업 추천 재택', category: '재테크', volume: 16400, comp: 'medium' as const },
    { keyword: '건강기능식품 추천', category: '건강', volume: 11200, comp: 'high' as const },
    { keyword: `노트북 추천 ${year}`, category: 'IT/테크', volume: 25600, comp: 'high' as const },
    { keyword: '주식 초보 종목', category: '금융', volume: 9800, comp: 'medium' as const },
    { keyword: '여행지 추천 국내', category: '여행', volume: 18900, comp: 'medium' as const },
    { keyword: '무선이어폰 가성비', category: 'IT/테크', volume: 13200, comp: 'high' as const },
    { keyword: '영어 회화 앱 추천', category: '교육', volume: 7600, comp: 'low' as const },
    { keyword: '배당주 추천', category: '금융', volume: 8900, comp: 'medium' as const },
    { keyword: 'ETF 적립식 투자', category: '재테크', volume: 6500, comp: 'low' as const },
  ]
  return items.map((item, i) => {
    const cpc = item.comp === 'high' ? 2200 : item.comp === 'medium' ? 1100 : 450
    const posts = Math.round(item.volume * (item.comp === 'high' ? 2.0 : item.comp === 'medium' ? 1.0 : 0.4))
    const moneyScore = calculateMoneyScore({ volume: item.volume, competition: item.comp, cpcEstimate: cpc, keyword: item.keyword, monthlyPosts: posts })
    return { rank: i + 1, keyword: item.keyword, searchVolume: item.volume, competition: item.comp, changePercent: 10 + ((i * 17) % 80), moneyScore, moneyGrade: getMoneyGrade(moneyScore), category: item.category }
  }).sort((a, b) => b.searchVolume - a.searchVolume).map((item, i) => ({ ...item, rank: i + 1 }))
}

export async function GET() {
  const errors: string[] = []
  const sources: string[] = []

  try {
    // ===== 0단계: DB 캐시 확인 (30분 이내 데이터 있으면 재사용) =====
    const cached = await getLatestTrending(30)
    if (cached && cached.length > 0) {
      return NextResponse.json({
        success: true,
        data: cached.map((row, i) => ({
          rank: row.rank || i + 1,
          keyword: row.keyword,
          searchVolume: row.search_volume,
          changePercent: row.change_percent,
          moneyScore: row.money_score,
          moneyGrade: row.money_grade,
          category: row.category,
          hasAdData: row.source === 'ad',
        })),
        isRealData: true,
        sources: ['db-cache'],
        meta: { total: cached.length, source: 'db-cache', timestamp: new Date().toISOString() },
      })
    }

    // ===== 1단계: 뉴스 + 다음 웹에서 실시간 키워드 추출 =====
    const newsPromises = NEWS_QUERIES.map(q => searchNews(q, 100, 'date'))
    const [daumResult, ...newsResults] = await Promise.allSettled([
      searchDaumWeb('실시간 인기 트렌드 이슈', 1, 50, 'recency'),
      ...newsPromises,
    ])

    const allTitles: string[] = []

    // 뉴스 제목 수집
    for (const result of newsResults) {
      if (result.status === 'fulfilled' && result.value.items?.length > 0) {
        allTitles.push(...result.value.items.map(item => item.title))
        if (!sources.includes('naver-news')) sources.push('naver-news')
      }
    }

    // 다음 웹 검색 제목 수집
    if (daumResult.status === 'fulfilled' && daumResult.value.documents?.length > 0) {
      allTitles.push(...daumResult.value.documents.map(doc => doc.title))
      sources.push('kakao-web')
    }

    if (allTitles.length === 0) {
      errors.push('뉴스/웹 데이터 수집 실패')
      return NextResponse.json({
        success: true, data: generateFallbackTrending(), isRealData: false, errors, sources,
        meta: { total: 16, source: 'fallback', timestamp: new Date().toISOString() },
      })
    }

    // ===== 2단계: 키워드 추출 + 빈도 순 정렬 =====
    const keywordMap = extractTrendingKeywords(allTitles)
    const topKeywords = Array.from(keywordMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 40)
      .map(([kw]) => kw)

    if (topKeywords.length === 0) {
      return NextResponse.json({
        success: true, data: generateFallbackTrending(), isRealData: false, errors: ['키워드 추출 실패'],
        meta: { total: 16, source: 'fallback', timestamp: new Date().toISOString() },
      })
    }

    // ===== 3단계: DataLab 트렌드 + 검색광고 데이터 보강 (병렬) =====
    // DataLab은 최대 5개 키워드 그룹
    const top5Keywords = topKeywords.slice(0, 5)
    const trendScores = new Map<string, number>()

    // 검색광고 API로 실제 검색량 (보너스 - 실패해도 OK)
    const adVolumeMap = new Map<string, { volume: number; comp: 'high' | 'medium' | 'low'; adDepth: number }>()

    const [datalabResult, adBatch1, adBatch2] = await Promise.allSettled([
      fetchSearchTrend(top5Keywords),
      fetchKeywordData(topKeywords.slice(0, 5).join(',')),
      fetchKeywordData(topKeywords.slice(5, 10).join(',')),
    ])

    if (datalabResult.status === 'fulfilled' && datalabResult.value.length > 0) {
      sources.push('naver-datalab')
      for (const trend of datalabResult.value) {
        if (trend.data.length > 0) {
          const recentAvg = trend.data.slice(-3).reduce((s, d) => s + d.ratio, 0) / Math.max(1, trend.data.slice(-3).length)
          trendScores.set(trend.title, recentAvg)
        }
      }
    } else if (datalabResult.status === 'rejected') {
      errors.push(`datalab: ${datalabResult.reason?.message || 'failed'}`)
    }

    const adResults = [
      ...(adBatch1.status === 'fulfilled' ? adBatch1.value : []),
      ...(adBatch2.status === 'fulfilled' ? adBatch2.value : []),
    ]
    if (adResults.length > 0) {
      sources.push('naver-ad')
      for (const kw of adResults) {
        adVolumeMap.set(kw.keyword, { volume: kw.monthlyTotalVolume, comp: kw.competition, adDepth: kw.adDepth })
      }
    }
    if (adBatch1.status === 'rejected') errors.push(`ad1: ${adBatch1.reason?.message?.slice(0, 80) || 'failed'}`)
    if (adBatch2.status === 'rejected') errors.push(`ad2: ${adBatch2.reason?.message?.slice(0, 80) || 'failed'}`)

    // ===== 4단계: 트렌딩 키워드 조합 =====
    const seen = new Set<string>()
    const trendingKeywords = topKeywords
      .filter(kw => {
        const lower = kw.toLowerCase()
        if (seen.has(lower)) return false
        seen.add(lower)
        return true
      })
      .map(kw => {
        const freq = keywordMap.get(kw) || 1
        const adData = adVolumeMap.get(kw)
        const trendScore = trendScores.get(kw)

        // 검색량: 검색광고 데이터 있으면 사용, 없으면 뉴스 빈도 기반 추정
        const searchVolume = adData ? adData.volume : Math.round(freq * 800 + Math.random() * 2000)
        const competition = adData ? adData.comp : (freq > 8 ? 'high' as const : freq > 4 ? 'medium' as const : 'low' as const)
        const adDepth = adData ? adData.adDepth : (competition === 'high' ? 8 : competition === 'medium' ? 4 : 1)

        const cpcEstimate = competition === 'high' ? 1500 + adDepth * 200
          : competition === 'medium' ? 800 + adDepth * 200
          : 300 + adDepth * 200
        const monthlyPosts = Math.round(searchVolume * (competition === 'high' ? 2.5 : competition === 'medium' ? 1.2 : 0.4))

        const moneyScore = calculateMoneyScore({
          volume: searchVolume, competition, cpcEstimate, keyword: kw, monthlyPosts,
        })

        // 변동률: DataLab 데이터 있으면 사용, 없으면 빈도 기반 추정
        const changePercent = trendScore
          ? Math.round(trendScore)
          : Math.min(99, Math.round(freq * 8 + Math.random() * 20))

        return {
          rank: 0,
          keyword: kw,
          searchVolume,
          competition,
          changePercent,
          moneyScore,
          moneyGrade: getMoneyGrade(moneyScore),
          category: classifyCategory(kw),
          hasAdData: !!adData,
        }
      })
      .sort((a, b) => b.searchVolume - a.searchVolume)
      .slice(0, 50)
      .map((item, i) => ({ ...item, rank: i + 1 }))

    // ===== 5단계: DB에 저장 (비동기, 실패해도 OK) =====
    const dbRows: TrendingRow[] = trendingKeywords.map(kw => ({
      keyword: kw.keyword,
      search_volume: kw.searchVolume,
      change_percent: kw.changePercent,
      money_score: kw.moneyScore,
      money_grade: kw.moneyGrade,
      category: kw.category,
      trend_score: kw.changePercent,
      rank: kw.rank,
      source: kw.hasAdData ? 'ad' : 'news',
    }))
    saveTrendingSnapshot(dbRows).catch(() => {})

    return NextResponse.json({
      success: true,
      data: trendingKeywords,
      isRealData: true,
      sources,
      errors: errors.length > 0 ? errors : undefined,
      meta: {
        total: trendingKeywords.length,
        newsCount: allTitles.length,
        extractedKeywords: topKeywords.length,
        adEnriched: adResults.length,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error: unknown) {
    console.error('Trending API critical error:', error instanceof Error ? error.message : error)
    return NextResponse.json({
      success: true, data: generateFallbackTrending(), isRealData: false,
      errors: [...errors, error instanceof Error ? error.message : 'unknown'],
      meta: { total: 16, source: 'fallback', timestamp: new Date().toISOString() },
    })
  }
}
