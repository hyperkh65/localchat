'use client'

import { cn } from '@/lib/utils'
import { Check, Zap, Crown, Building2 } from 'lucide-react'
import Link from 'next/link'
import AdSense, { AD_SLOTS } from '@/components/AdSense'

const plans = [
  {
    name: '무료',
    nameEn: 'Free',
    price: '0',
    period: '영구 무료',
    icon: Zap,
    iconColor: 'text-gray-500',
    bgColor: 'bg-white',
    buttonClass: 'btn-secondary',
    buttonText: '무료로 시작하기',
    buttonLink: '/signup',
    popular: false,
    features: [
      '일 10회 키워드 분석',
      '기본 Money Score 분석',
      '네이버 + 카카오 데이터',
      '실시간 트렌딩 키워드',
      '키워드 발굴 (기본)',
      '기본 콘텐츠 가이드',
      'Google Trends 한국',
      'AI 분석 일 3회',
    ],
    disabled: [
      'AI 콘텐츠 가이드 (Gemini)',
      '블루오션 키워드 필터',
      '대량 키워드 분석',
      'API 액세스',
    ],
  },
  {
    name: '프로',
    nameEn: 'Pro',
    price: '9,900',
    period: '월',
    icon: Crown,
    iconColor: 'text-accent-dark',
    bgColor: 'bg-white ring-2 ring-accent',
    buttonClass: 'btn-primary',
    buttonText: '프로 시작하기',
    buttonLink: '/signup',
    popular: true,
    features: [
      '일 100회 키워드 분석',
      'Money Score 수익성 분석',
      '네이버 + 카카오 + Google 데이터',
      '실시간 트렌딩 + Google Trends',
      'AI 콘텐츠 가이드 (Gemini)',
      'AI 분석 일 50회',
      '블루오션 키워드 발굴',
      '12개월 트렌드 분석',
      '연관 키워드 500개',
      '검색 기록 + 일별 통계',
    ],
    disabled: [
      '대량 키워드 분석 (CSV)',
      'API 액세스',
      '팀 계정',
    ],
  },
  {
    name: '프리미엄',
    nameEn: 'Premium',
    price: '29,900',
    period: '월',
    icon: Building2,
    iconColor: 'text-purple-500',
    bgColor: 'bg-white',
    buttonClass: 'btn-secondary',
    buttonText: '프리미엄 시작하기',
    buttonLink: '/signup',
    popular: false,
    features: [
      '무제한 키워드 분석',
      '무제한 AI 분석 (Gemini)',
      '전체 플랫폼 데이터',
      '실시간 트렌딩 + Google Trends',
      'AI 콘텐츠 가이드 (무제한)',
      '블루오션 키워드 발굴',
      '24개월 트렌드 분석',
      '대량 키워드 분석 (CSV)',
      'API 액세스',
      '키워드 모니터링 알림',
      '경쟁사 분석',
      '우선 고객 지원',
    ],
    disabled: [],
  },
]

export default function PricingPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">요금제</h1>
        <p className="text-gray-500">목적에 맞는 플랜을 선택하세요. 언제든 업그레이드/다운그레이드 가능합니다.</p>
      </div>

      {/* Plans */}
      <div className="grid lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <div key={plan.name} className={cn('card p-8 relative flex flex-col', plan.bgColor)}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-gray-900 text-xs font-bold px-4 py-1 rounded-full">
                가장 인기
              </div>
            )}
            <div className="flex items-center gap-3 mb-4">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', plan.popular ? 'bg-accent/20' : 'bg-gray-100')}>
                <plan.icon className={cn('w-5 h-5', plan.iconColor)} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{plan.name}</h3>
                <span className="text-xs text-gray-400">{plan.nameEn}</span>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-gray-900">{plan.price === '0' ? '무료' : `₩${plan.price}`}</span>
                {plan.price !== '0' && <span className="text-sm text-gray-500">/ {plan.period}</span>}
              </div>
            </div>

            <Link href={plan.buttonLink} className={cn('w-full mb-6 text-center block', plan.buttonClass)}>
              {plan.buttonText}
            </Link>

            <div className="space-y-3 flex-1">
              {plan.features.map((feature) => (
                <div key={feature} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
              {plan.disabled.map((feature) => (
                <div key={feature} className="flex items-start gap-2 opacity-40">
                  <Check className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-500 line-through">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Ad */}
      <AdSense slot={AD_SLOTS.PRICING_TOP} className="my-4 max-w-5xl mx-auto" />

      {/* Comparison Table */}
      <div className="max-w-4xl mx-auto card p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 text-center">플랜 비교</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 text-gray-500 font-medium">기능</th>
                <th className="text-center py-3 px-2 text-gray-900 font-bold">무료</th>
                <th className="text-center py-3 px-2 text-accent-dark font-bold">프로</th>
                <th className="text-center py-3 px-2 text-purple-600 font-bold">프리미엄</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[
                ['일일 검색', '10회', '100회', '무제한'],
                ['AI 분석 (Gemini)', '3회/일', '50회/일', '무제한'],
                ['Money Score', 'O', 'O', 'O'],
                ['Google Trends', 'O', 'O', 'O'],
                ['콘텐츠 가이드', '기본', 'AI (Gemini)', 'AI (무제한)'],
                ['블루오션 필터', '-', 'O', 'O'],
                ['검색 기록', '최근 10개', '전체', '전체'],
                ['API 액세스', '-', '-', 'O'],
              ].map(([feature, free, pro, premium]) => (
                <tr key={feature}>
                  <td className="py-3 px-2 text-gray-700">{feature}</td>
                  <td className="py-3 px-2 text-center text-gray-500">{free}</td>
                  <td className="py-3 px-2 text-center text-gray-900 font-medium">{pro}</td>
                  <td className="py-3 px-2 text-center text-purple-700 font-medium">{premium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ad - Bottom */}
      <AdSense slot={AD_SLOTS.PAGE_BOTTOM} className="my-4 max-w-4xl mx-auto" />

      {/* FAQ */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-xl font-bold text-gray-900 text-center mb-6">자주 묻는 질문</h2>
        <div className="space-y-4">
          {[
            {
              q: '무료 플랜으로도 키워드 분석이 가능한가요?',
              a: '네, 무료 플랜에서도 일 10회까지 키워드 분석이 가능합니다. Money Score, 실시간 트렌딩, Google Trends 모두 무료로 이용 가능합니다.',
            },
            {
              q: 'AI 분석은 어떻게 동작하나요?',
              a: 'Google Gemini AI를 활용하여 키워드 트렌드 분석, 콘텐츠 전략 추천, 수익화 방법 등을 자동으로 분석합니다. 무료 플랜은 일 3회, 프로는 50회 이용 가능합니다.',
            },
            {
              q: '결제는 어떻게 하나요?',
              a: '현재 무료 버전을 운영 중입니다. 유료 플랜은 카드/계좌이체로 결제 예정이며, 결제 시스템 준비 중입니다.',
            },
            {
              q: '환불 정책은 어떻게 되나요?',
              a: '결제 후 7일 이내에 환불 요청 시 전액 환불됩니다.',
            },
          ].map((faq) => (
            <details key={faq.q} className="card p-5 group cursor-pointer">
              <summary className="font-medium text-gray-900 list-none flex items-center justify-between">
                {faq.q}
                <span className="text-gray-400 group-open:rotate-45 transition-transform text-xl">+</span>
              </summary>
              <p className="text-sm text-gray-600 mt-3 leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  )
}
