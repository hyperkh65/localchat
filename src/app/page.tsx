import Link from 'next/link'
import SearchBar from '@/components/SearchBar'
import { Zap, TrendingUp, Target, FileText, BarChart3, Shield } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
              <Zap className="w-5 h-5 text-gray-900" />
            </div>
            <span className="font-bold text-xl">KeywordPulse</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">대시보드</Link>
            <Link href="/analyze" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">키워드 분석</Link>
            <Link href="/trending" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">실시간 트렌드</Link>
            <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">요금제</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">로그인</Link>
            <Link href="/signup" className="btn-primary text-sm">
              무료로 시작하기
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-accent/10 text-gray-800 text-sm font-medium px-4 py-2 rounded-full mb-6">
            <Zap className="w-4 h-4" />
            돈이 되는 키워드를 찾아드립니다
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            키워드 하나로<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-accent-dark">
              수익의 방향
            </span>이 바뀝니다
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            네이버, 구글, 다음, 빙 멀티플랫폼 키워드를 분석하고<br />
            Money Score로 진짜 돈이 되는 키워드를 찾으세요
          </p>
          <div className="flex justify-center mb-6">
            <SearchBar large placeholder="돈이 되는 키워드를 검색하세요" />
          </div>
          <p className="text-sm text-gray-400">
            예시: 아이폰16 사전예약, 전세사기 예방, 다이어트 식단, 부업 추천
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-sidebar text-white py-12 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-accent">500만+</div>
            <div className="text-sm text-gray-400 mt-1">키워드 데이터</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-accent">5개</div>
            <div className="text-sm text-gray-400 mt-1">플랫폼 지원</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-accent">실시간</div>
            <div className="text-sm text-gray-400 mt-1">트렌드 분석</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-accent">Money Score</div>
            <div className="text-sm text-gray-400 mt-1">수익성 분석</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              왜 KeywordPulse인가?
            </h2>
            <p className="text-lg text-gray-500">
              단순 검색량이 아닌, 수익성 중심의 키워드 분석
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                title: 'Money Score',
                desc: '검색량, CPC, 경쟁도, 구매의도, 콘텐츠 포화도를 종합 분석한 수익성 점수. S등급 키워드를 찾으세요.',
              },
              {
                icon: BarChart3,
                title: '멀티플랫폼 분석',
                desc: '네이버, 구글, 다음, 빙, 티스토리 데이터를 한 번에 비교 분석. 플랫폼별 최적 전략을 수립하세요.',
              },
              {
                icon: TrendingUp,
                title: '실시간 트렌드',
                desc: '급상승 키워드를 실시간으로 감지하고, 수익성 높은 키워드가 뜨면 즉시 알려드립니다.',
              },
              {
                icon: FileText,
                title: '콘텐츠 가이드',
                desc: '키워드 기반 블로그 제목, 글 구조, 필수 키워드를 자동 추천. 바로 글쓰기 시작하세요.',
              },
              {
                icon: Shield,
                title: '블루오션 발굴',
                desc: '롱테일 키워드 분석으로 경쟁이 적고 수익성 높은 틈새 키워드를 자동으로 발굴합니다.',
              },
              {
                icon: Zap,
                title: '프리미엄 인사이트',
                desc: '경쟁사 분석, 대량 키워드 분석, API 연동 등 프로 수준의 키워드 전략 도구를 제공합니다.',
              },
            ].map((feature) => (
              <div key={feature.title} className="card-hover p-8">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-accent-dark" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Money Score Explanation */}
      <section className="py-20 px-6 bg-surface">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Money Score란?</h2>
            <p className="text-gray-500">5가지 핵심 지표를 가중 합산한 수익성 점수입니다</p>
          </div>
          <div className="grid md:grid-cols-5 gap-4">
            {[
              { label: '검색량', weight: '25%', desc: '적절한 검색량 (1K~10K 최적)' },
              { label: 'CPC', weight: '25%', desc: '클릭당 광고 단가' },
              { label: '광고 경쟁도', weight: '20%', desc: '광고주가 많을수록 높음' },
              { label: '구매 의도', weight: '20%', desc: '상업성 키워드 여부' },
              { label: '포화도', weight: '10%', desc: '콘텐츠 경쟁 정도' },
            ].map((item) => (
              <div key={item.label} className="card p-5 text-center">
                <div className="text-2xl font-bold text-accent-dark mb-1">{item.weight}</div>
                <div className="font-semibold text-gray-900 mb-1">{item.label}</div>
                <div className="text-xs text-gray-500">{item.desc}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-5 gap-3 max-w-xl mx-auto">
            {[
              { grade: 'S', range: '90-100', cls: 'score-s' },
              { grade: 'A', range: '70-89', cls: 'score-a' },
              { grade: 'B', range: '50-69', cls: 'score-b' },
              { grade: 'C', range: '30-49', cls: 'score-c' },
              { grade: 'D', range: '0-29', cls: 'score-d' },
            ].map((g) => (
              <div key={g.grade} className={`${g.cls} rounded-xl p-3 text-center`}>
                <div className="text-xl font-bold">{g.grade}</div>
                <div className="text-xs opacity-80">{g.range}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            지금 바로 수익 키워드를 찾아보세요
          </h2>
          <p className="text-gray-500 mb-8">무료로 시작하고, 프리미엄 기능으로 수익을 극대화하세요</p>
          <Link href="/signup" className="btn-primary text-lg px-10 py-4 inline-block">
            무료로 시작하기
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-sidebar text-gray-400 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                  <Zap className="w-4 h-4 text-gray-900" />
                </div>
                <span className="font-bold text-white">KeywordPulse</span>
              </div>
              <p className="text-sm">돈이 되는 키워드를 찾아주는 전문 분석 플랫폼</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">서비스</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/analyze" className="hover:text-white transition-colors">키워드 분석</Link></li>
                <li><Link href="/trending" className="hover:text-white transition-colors">실시간 트렌드</Link></li>
                <li><Link href="/discover" className="hover:text-white transition-colors">키워드 발굴</Link></li>
                <li><Link href="/content-guide" className="hover:text-white transition-colors">콘텐츠 가이드</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">지원</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/pricing" className="hover:text-white transition-colors">요금제</Link></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">이용약관</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">개인정보처리방침</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">데이터 소스</h4>
              <ul className="space-y-2 text-sm">
                <li>Naver Search Ads API</li>
                <li>Naver DataLab API</li>
                <li>Google Trends</li>
                <li>Kakao/Daum API</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-sm text-center">
            &copy; 2024 KeywordPulse. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
