-- ============================================
-- KeywordPulse 전체 DB 스키마
-- Supabase SQL Editor에서 한 번에 실행
-- ============================================

-- 1. 트렌딩 키워드 스냅샷
CREATE TABLE IF NOT EXISTS trending_snapshots (
  id BIGSERIAL PRIMARY KEY,
  keyword TEXT NOT NULL,
  search_volume INTEGER DEFAULT 0,
  change_percent REAL DEFAULT 0,
  money_score INTEGER DEFAULT 0,
  money_grade TEXT DEFAULT 'C',
  category TEXT DEFAULT '기타',
  trend_score REAL DEFAULT 0,
  rank INTEGER,
  source TEXT DEFAULT 'news',
  captured_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trending_captured ON trending_snapshots(captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_trending_keyword ON trending_snapshots(keyword);

-- 2. 키워드 분석 캐시
CREATE TABLE IF NOT EXISTS keyword_cache (
  id BIGSERIAL PRIMARY KEY,
  keyword TEXT UNIQUE NOT NULL,
  analysis_data JSONB NOT NULL,
  is_real_data BOOLEAN DEFAULT false,
  data_sources JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cache_keyword ON keyword_cache(keyword);
CREATE INDEX IF NOT EXISTS idx_cache_updated ON keyword_cache(updated_at DESC);

-- 3. 검색 기록
CREATE TABLE IF NOT EXISTS search_history (
  id BIGSERIAL PRIMARY KEY,
  keyword TEXT NOT NULL,
  money_score INTEGER,
  money_grade TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  searched_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_history_searched ON search_history(searched_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_user ON search_history(user_id);

-- 4. 키워드 일별 통계
CREATE TABLE IF NOT EXISTS keyword_daily_stats (
  id BIGSERIAL PRIMARY KEY,
  keyword TEXT NOT NULL,
  search_volume INTEGER DEFAULT 0,
  money_score INTEGER DEFAULT 0,
  competition TEXT,
  cpc_estimate INTEGER DEFAULT 0,
  stat_date DATE DEFAULT CURRENT_DATE,
  UNIQUE(keyword, stat_date)
);
CREATE INDEX IF NOT EXISTS idx_daily_keyword_date ON keyword_daily_stats(keyword, stat_date DESC);

-- 5. 발굴 키워드
CREATE TABLE IF NOT EXISTS discovered_keywords (
  id BIGSERIAL PRIMARY KEY,
  keyword TEXT NOT NULL,
  category TEXT,
  monthly_volume INTEGER DEFAULT 0,
  competition TEXT,
  money_score INTEGER DEFAULT 0,
  money_grade TEXT,
  is_blue_ocean BOOLEAN DEFAULT false,
  discovered_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_discovered_category ON discovered_keywords(category);
CREATE INDEX IF NOT EXISTS idx_discovered_blue ON discovered_keywords(is_blue_ocean) WHERE is_blue_ocean = true;

-- 6. 유저 프로필 (Supabase Auth 연동)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  nickname TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'premium', 'admin')),
  daily_searches_used INTEGER DEFAULT 0,
  daily_searches_reset DATE DEFAULT CURRENT_DATE,
  ai_calls_used INTEGER DEFAULT 0,
  ai_calls_reset DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON user_profiles(plan);

-- 7. Google Trends 캐시
CREATE TABLE IF NOT EXISTS google_trends_cache (
  id BIGSERIAL PRIMARY KEY,
  trends_data JSONB NOT NULL,
  geo TEXT DEFAULT 'KR',
  captured_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gtrends_captured ON google_trends_cache(captured_at DESC);

-- 8. AI 분석 결과 캐시 (Gemini)
CREATE TABLE IF NOT EXISTS ai_analysis_cache (
  id BIGSERIAL PRIMARY KEY,
  keyword TEXT NOT NULL,
  analysis_type TEXT DEFAULT 'trend',
  result_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_cache_keyword ON ai_analysis_cache(keyword);
CREATE INDEX IF NOT EXISTS idx_ai_cache_created ON ai_analysis_cache(created_at DESC);

-- ============================================
-- RLS 정책
-- ============================================
ALTER TABLE trending_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovered_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_trends_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all" ON trending_snapshots FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON keyword_cache FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON search_history FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON keyword_daily_stats FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON discovered_keywords FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON user_profiles FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON google_trends_cache FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON ai_analysis_cache FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "auth_all" ON trending_snapshots FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON keyword_cache FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON search_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON keyword_daily_stats FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON discovered_keywords FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON user_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON google_trends_cache FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON ai_analysis_cache FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 자동 프로필 생성 트리거
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, plan)
  VALUES (
    NEW.id,
    NEW.email,
    CASE
      WHEN NEW.email = '2days.kr@gmail.com' THEN 'admin'
      ELSE 'free'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 일일 사용량 리셋 함수
-- ============================================
CREATE OR REPLACE FUNCTION reset_daily_usage()
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET daily_searches_used = 0,
      daily_searches_reset = CURRENT_DATE,
      ai_calls_used = 0,
      ai_calls_reset = CURRENT_DATE
  WHERE daily_searches_reset < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 끝 (END)
-- ============================================
