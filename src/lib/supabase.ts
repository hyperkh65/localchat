import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || ''

// 키가 없으면 더미 클라이언트 (에러 방지)
export const supabase: SupabaseClient = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key')

// --- 트렌딩 키워드 저장/조회 ---

export interface TrendingRow {
  keyword: string
  search_volume: number
  change_percent: number
  money_score: number
  money_grade: string
  category: string
  trend_score: number
  rank: number
  source: string
}

export async function saveTrendingSnapshot(keywords: TrendingRow[]) {
  if (!supabaseUrl || keywords.length === 0) return
  const rows = keywords.map(k => ({
    ...k,
    captured_at: new Date().toISOString(),
  }))
  const { error } = await supabase.from('trending_snapshots').insert(rows)
  if (error) console.error('[Supabase] saveTrending error:', error.message)
}

export async function getLatestTrending(maxAgeMinutes = 30): Promise<TrendingRow[] | null> {
  if (!supabaseUrl) return null
  const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('trending_snapshots')
    .select('*')
    .gte('captured_at', cutoff)
    .order('captured_at', { ascending: false })
    .order('rank', { ascending: true })
    .limit(30)

  if (error || !data || data.length === 0) return null
  return data as TrendingRow[]
}

// --- 키워드 분석 캐시 ---

export async function getCachedAnalysis(keyword: string, maxAgeHours = 6) {
  if (!supabaseUrl) return null
  const cutoff = new Date(Date.now() - maxAgeHours * 3600 * 1000).toISOString()
  const { data, error } = await supabase
    .from('keyword_cache')
    .select('*')
    .eq('keyword', keyword)
    .gte('updated_at', cutoff)
    .single()

  if (error || !data) return null
  return data
}

export async function saveAnalysisCache(keyword: string, analysisData: unknown, isRealData: boolean, dataSources?: unknown) {
  if (!supabaseUrl) return
  const { error } = await supabase
    .from('keyword_cache')
    .upsert({
      keyword,
      analysis_data: analysisData,
      is_real_data: isRealData,
      data_sources: dataSources,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'keyword' })

  if (error) console.error('[Supabase] saveCache error:', error.message)
}

// --- 검색 기록 ---

export async function saveSearchHistory(keyword: string, moneyScore?: number, moneyGrade?: string) {
  if (!supabaseUrl) return
  const { error } = await supabase
    .from('search_history')
    .insert({ keyword, money_score: moneyScore, money_grade: moneyGrade })

  if (error) console.error('[Supabase] saveHistory error:', error.message)
}

export async function getRecentSearches(limit = 20) {
  if (!supabaseUrl) return []
  const { data, error } = await supabase
    .from('search_history')
    .select('*')
    .order('searched_at', { ascending: false })
    .limit(limit)

  if (error) return []
  return data || []
}

// --- 일별 키워드 통계 ---

export async function saveDailyStats(keyword: string, stats: {
  search_volume: number
  money_score: number
  competition?: string
  cpc_estimate?: number
}) {
  if (!supabaseUrl) return
  const { error } = await supabase
    .from('keyword_daily_stats')
    .upsert({
      keyword,
      ...stats,
      stat_date: new Date().toISOString().split('T')[0],
    }, { onConflict: 'keyword,stat_date' })

  if (error) console.error('[Supabase] saveDailyStats error:', error.message)
}

export async function getKeywordHistory(keyword: string, days = 30) {
  if (!supabaseUrl) return []
  const cutoff = new Date(Date.now() - days * 86400 * 1000).toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('keyword_daily_stats')
    .select('*')
    .eq('keyword', keyword)
    .gte('stat_date', cutoff)
    .order('stat_date', { ascending: true })

  if (error) return []
  return data || []
}

// --- 발굴 키워드 저장 ---

export async function saveDiscoveredKeywords(keywords: Array<{
  keyword: string
  category: string
  monthly_volume: number
  competition: string
  money_score: number
  money_grade: string
  is_blue_ocean: boolean
}>) {
  if (!supabaseUrl || keywords.length === 0) return
  const { error } = await supabase
    .from('discovered_keywords')
    .insert(keywords.map(k => ({ ...k, discovered_at: new Date().toISOString() })))

  if (error) console.error('[Supabase] saveDiscovered error:', error.message)
}

export async function getBlueOceanKeywords(limit = 50) {
  if (!supabaseUrl) return []
  const { data, error } = await supabase
    .from('discovered_keywords')
    .select('*')
    .eq('is_blue_ocean', true)
    .order('money_score', { ascending: false })
    .limit(limit)

  if (error) return []
  return data || []
}
