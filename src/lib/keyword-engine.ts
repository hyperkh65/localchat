/**
 * KeywordPulse - 키워드 수익성 분석 엔진
 * Money Score 계산 로직 및 키워드 분석 핵심 로직
 */

export interface KeywordAnalysis {
  keyword: string
  monthlySearchVolume: number
  monthlyPcVolume: number
  monthlyMobileVolume: number
  competition: 'high' | 'medium' | 'low'
  competitionScore: number
  cpcEstimate: number
  contentSaturation: number
  purchaseIntent: number
  moneyScore: number
  moneyGrade: 'S' | 'A' | 'B' | 'C' | 'D'
  trendData: TrendPoint[]
  relatedKeywords: RelatedKeyword[]
  platforms: PlatformData[]
}

export interface TrendPoint {
  date: string
  value: number
}

export interface RelatedKeyword {
  keyword: string
  monthlyVolume: number
  competition: 'high' | 'medium' | 'low'
  moneyScore: number
  moneyGrade: 'S' | 'A' | 'B' | 'C' | 'D'
}

export interface PlatformData {
  platform: string
  searchVolume: number
  trendDirection: 'up' | 'down' | 'stable'
  changePercent: number
}

export interface ContentGuide {
  suggestedTitles: string[]
  headingStructure: string[]
  requiredKeywords: string[]
  recommendedLength: number
  bestPublishTime: string
  competitorInsights: string[]
}

// --- 수익성 점수 계산 로직 ---

/**
 * 검색량 가중치 계산
 * 1,000~10,000 구간이 최적 (적당한 검색량 + 진입 가능)
 */
export function calculateVolumeScore(volume: number): number {
  if (volume < 100) return 10
  if (volume < 1000) return 40 + ((volume - 100) / 900) * 30
  if (volume < 10000) return 70 + ((volume - 1000) / 9000) * 25
  if (volume < 50000) return 95 - ((volume - 10000) / 40000) * 15
  return Math.max(30, 60 - ((volume - 50000) / 50000) * 30)
}

/**
 * 광고 경쟁도 점수
 * 광고주가 많다 = 돈이 되는 키워드
 */
export function calculateAdCompetitionScore(competition: 'high' | 'medium' | 'low'): number {
  switch (competition) {
    case 'high': return 90
    case 'medium': return 60
    case 'low': return 30
  }
}

/**
 * CPC 추정 점수 (0~100)
 */
export function calculateCpcScore(cpcEstimate: number, maxCpc: number = 5000): number {
  return Math.min(100, (cpcEstimate / maxCpc) * 100)
}

/**
 * 구매 의도 분석
 * 키워드에 포함된 상업성 패턴 분석
 */
export function calculatePurchaseIntent(keyword: string): number {
  const commercialHighPatterns = ['가격', '구매', '추천', '비교', '후기', '할인', '최저가', '쿠폰', '이벤트', '세일', '무료배송', '리뷰']
  const commercialMidPatterns = ['방법', '효과', '사용법', '장단점', '순위', '인기', '베스트', '랭킹', 'TOP', '선택']
  const informationalPatterns = ['뜻', '의미', '이유', '원인', '역사', '종류', '차이', '무엇', '어떻게', '왜']

  const lowerKeyword = keyword.toLowerCase()

  let score = 50 // 기본 점수

  for (const p of commercialHighPatterns) {
    if (lowerKeyword.includes(p)) { score = Math.max(score, 85); break }
  }
  for (const p of commercialMidPatterns) {
    if (lowerKeyword.includes(p)) { score = Math.max(score, 65); break }
  }
  for (const p of informationalPatterns) {
    if (lowerKeyword.includes(p)) { score = Math.min(score, 35); break }
  }

  return score
}

/**
 * 콘텐츠 포화도 역수 점수
 * 포화도가 낮을수록 블루오션
 */
export function calculateSaturationInverse(monthlyPosts: number, monthlySearches: number): number {
  if (monthlySearches === 0) return 50
  const saturation = monthlyPosts / monthlySearches
  if (saturation < 0.5) return 90
  if (saturation < 2.0) return 60
  return 30
}

/**
 * Money Score 종합 계산
 *
 * = 검색량(25%) + 광고경쟁도(20%) + CPC(25%) + 구매의도(20%) + 포화도역수(10%)
 */
export function calculateMoneyScore(params: {
  volume: number
  competition: 'high' | 'medium' | 'low'
  cpcEstimate: number
  keyword: string
  monthlyPosts: number
}): number {
  const volumeScore = calculateVolumeScore(params.volume)
  const adScore = calculateAdCompetitionScore(params.competition)
  const cpcScore = calculateCpcScore(params.cpcEstimate)
  const intentScore = calculatePurchaseIntent(params.keyword)
  const saturationScore = calculateSaturationInverse(params.monthlyPosts, params.volume)

  const moneyScore = (
    volumeScore * 0.25 +
    adScore * 0.20 +
    cpcScore * 0.25 +
    intentScore * 0.20 +
    saturationScore * 0.10
  )

  return Math.round(Math.min(100, Math.max(0, moneyScore)))
}

export function getMoneyGrade(score: number): 'S' | 'A' | 'B' | 'C' | 'D' {
  if (score >= 90) return 'S'
  if (score >= 70) return 'A'
  if (score >= 50) return 'B'
  if (score >= 30) return 'C'
  return 'D'
}

// --- 데모 데이터 생성 (API 연동 전 프로토타입용) ---

export function generateDemoAnalysis(keyword: string): KeywordAnalysis {
  const seed = keyword.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const random = (min: number, max: number) => {
    const x = Math.sin(seed * 9301 + 49297) % 233280
    const val = Math.abs(x / 233280)
    return Math.floor(min + val * (max - min))
  }

  const monthlyPcVolume = random(500, 30000)
  const monthlyMobileVolume = Math.floor(monthlyPcVolume * (1.5 + Math.abs(Math.sin(seed)) * 2))
  const totalVolume = monthlyPcVolume + monthlyMobileVolume
  const competitions: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low']
  const competition = competitions[seed % 3]
  const cpcEstimate = random(100, 4000)
  const monthlyPosts = random(100, totalVolume * 2)

  const moneyScore = calculateMoneyScore({
    volume: totalVolume,
    competition,
    cpcEstimate,
    keyword,
    monthlyPosts,
  })

  const trendData: TrendPoint[] = Array.from({ length: 12 }, (_, i) => {
    const month = new Date()
    month.setMonth(month.getMonth() - (11 - i))
    return {
      date: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`,
      value: random(30, 100),
    }
  })

  const relatedSuffixes = ['추천', '비교', '후기', '가격', '순위', '방법', '효과', '2024', '인기', '장단점', '사용법', '종류']
  const relatedKeywords: RelatedKeyword[] = relatedSuffixes.slice(0, 8).map((suffix) => {
    const rk = `${keyword} ${suffix}`
    const vol = random(100, totalVolume)
    const comp = competitions[(seed + suffix.length) % 3]
    const ms = calculateMoneyScore({
      volume: vol,
      competition: comp,
      cpcEstimate: random(100, 3000),
      keyword: rk,
      monthlyPosts: random(50, vol),
    })
    return {
      keyword: rk,
      monthlyVolume: vol,
      competition: comp,
      moneyScore: ms,
      moneyGrade: getMoneyGrade(ms),
    }
  })

  const platforms: PlatformData[] = [
    { platform: 'Naver', searchVolume: totalVolume, trendDirection: 'up', changePercent: random(5, 30) },
    { platform: 'Google', searchVolume: random(1000, 20000), trendDirection: 'stable', changePercent: random(1, 10) },
    { platform: 'Daum', searchVolume: random(200, 5000), trendDirection: 'down', changePercent: random(2, 15) },
    { platform: 'Bing', searchVolume: random(50, 2000), trendDirection: 'up', changePercent: random(3, 20) },
  ]

  return {
    keyword,
    monthlySearchVolume: totalVolume,
    monthlyPcVolume,
    monthlyMobileVolume,
    competition,
    competitionScore: calculateAdCompetitionScore(competition),
    cpcEstimate,
    contentSaturation: monthlyPosts / totalVolume,
    purchaseIntent: calculatePurchaseIntent(keyword),
    moneyScore,
    moneyGrade: getMoneyGrade(moneyScore),
    trendData,
    relatedKeywords,
    platforms,
  }
}

export function generateDemoContentGuide(keyword: string): ContentGuide {
  return {
    suggestedTitles: [
      `${keyword} 완벽 가이드 - 2024년 최신 정보 총정리`,
      `${keyword} 추천 TOP 10 - 전문가가 알려주는 선택법`,
      `${keyword} 비교 분석 - 장단점부터 가격까지 한눈에`,
      `${keyword} 후기 - 실제 사용자가 말하는 진짜 후기`,
      `${keyword} 초보자 가이드 - 처음부터 끝까지 A to Z`,
    ],
    headingStructure: [
      `H1: ${keyword} - 알아야 할 모든 것`,
      `H2: ${keyword}이란?`,
      `H2: ${keyword} 선택 시 고려사항`,
      `H3: 가격 비교`,
      `H3: 기능 비교`,
      `H2: ${keyword} 추천 TOP 5`,
      `H2: ${keyword} 사용 후기`,
      `H2: 자주 묻는 질문 (FAQ)`,
    ],
    requiredKeywords: [
      keyword,
      `${keyword} 추천`,
      `${keyword} 비교`,
      `${keyword} 가격`,
      `${keyword} 후기`,
      `${keyword} 장단점`,
    ],
    recommendedLength: 3000,
    bestPublishTime: '화요일 오전 9:00 - 11:00',
    competitorInsights: [
      '상위 10개 글 평균 길이: 2,800자',
      '이미지 평균 사용: 8-12장',
      '목차(H2) 평균 개수: 5-7개',
      '외부 링크 평균: 3-5개',
      '발행 후 24시간 내 댓글 평균: 5-10개',
    ],
  }
}

// 실시간 트렌드 데모 데이터
export function generateDemoTrending(): Array<{
  rank: number
  keyword: string
  searchVolume: number
  changePercent: number
  moneyScore: number
  moneyGrade: 'S' | 'A' | 'B' | 'C' | 'D'
  category: string
}> {
  const trendingKeywords = [
    { keyword: '아이폰16 사전예약', category: 'IT/테크' },
    { keyword: '연말정산 환급', category: '금융' },
    { keyword: '겨울 패딩 추천', category: '패션' },
    { keyword: '삼성전자 주가', category: '금융' },
    { keyword: '크리스마스 선물', category: '쇼핑' },
    { keyword: '넷플릭스 신작', category: '엔터' },
    { keyword: '전세사기 예방', category: '부동산' },
    { keyword: '건강검진 병원', category: '건강' },
    { keyword: '코딩 부트캠프', category: '교육' },
    { keyword: '전기차 보조금', category: '자동차' },
    { keyword: '비트코인 전망', category: '금융' },
    { keyword: '다이어트 식단', category: '건강' },
    { keyword: '부업 추천', category: '재테크' },
    { keyword: '여행 보험 비교', category: '여행' },
    { keyword: '청약 자격', category: '부동산' },
    { keyword: '맥북 프로 M4', category: 'IT/테크' },
    { keyword: '영어 회화 앱', category: '교육' },
    { keyword: '무선 이어폰 추천', category: 'IT/테크' },
    { keyword: '연금저축 세액공제', category: '금융' },
    { keyword: '인테리어 비용', category: '생활' },
  ]

  return trendingKeywords.map((item, i) => {
    const seed = item.keyword.length * (i + 1)
    const volume = 5000 + (seed * 137) % 45000
    const change = 10 + (seed * 31) % 190
    const ms = calculateMoneyScore({
      volume,
      competition: i < 7 ? 'high' : i < 14 ? 'medium' : 'low',
      cpcEstimate: 500 + (seed * 73) % 3500,
      keyword: item.keyword,
      monthlyPosts: Math.floor(volume * (0.3 + (seed % 20) / 10)),
    })
    return {
      rank: i + 1,
      keyword: item.keyword,
      searchVolume: volume,
      changePercent: change,
      moneyScore: ms,
      moneyGrade: getMoneyGrade(ms),
      category: item.category,
    }
  })
}
