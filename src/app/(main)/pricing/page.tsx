'use client'

import { cn } from '@/lib/utils'
import { Check, Zap, Crown, Building2 } from 'lucide-react'

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
    buttonText: '현재 플랜',
    popular: false,
    features: [
      '일 5회 키워드 분석',
      '기본 분석 (검색량, 경쟁도)',
      '네이버 데이터',
      '최근 7일 트렌드',
      '연관 키워드 10개',
      '기본 콘텐츠 가이드',
    ],
    disabled: [
      'Money Score 수익성 분석',
      '멀티 플랫폼 (구글, 다음, 빙)',
      '롱테일 키워드 분석',
      '대량 키워드 분석',
      'API 액세스',
      '실시간 알림',
    ],
  },
  {
    name: '프로',
    nameEn: 'Pro',
    price: '19,900',
    period: '월',
    icon: Crown,
    iconColor: 'text-accent-dark',
    bgColor: 'bg-white ring-2 ring-accent',
    buttonClass: 'btn-primary',
    buttonText: '프로 시작하기',
    popular: true,
    features: [
      '일 100회 키워드 분석',
      'Money Score 수익성 분석',
      '멀티 플랫폼 (네이버+구글+다음+빙)',
      '12개월 트렌드 분석',
      '연관 키워드 500개',
      '롱테일 키워드 분석',
      '콘텐츠 가이드 (제목, 구조, 전략)',
      '블루오션 키워드 발굴',
      '키워드 즐겨찾기',
      '엑셀 다운로드',
    ],
    disabled: [
      '대량 키워드 분석',
      'API 액세스',
      '팀 계정',
    ],
  },
  {
    name: '비즈니스',
    nameEn: 'Business',
    price: '49,900',
    period: '월',
    icon: Building2,
    iconColor: 'text-purple-500',
    bgColor: 'bg-white',
    buttonClass: 'btn-secondary',
    buttonText: '비즈니스 시작하기',
    popular: false,
    features: [
      '무제한 키워드 분석',
      'Money Score 수익성 분석',
      '멀티 플랫폼 (전체)',
      '24개월 트렌드 분석',
      '연관 키워드 무제한',
      '롱테일 + 블루오션 분석',
      '프리미엄 콘텐츠 가이드',
      '대량 키워드 분석 (CSV 업로드)',
      'API 액세스',
      '실시간 알림 (키워드 모니터링)',
      '경쟁사 분석',
      '팀 계정 (최대 5명)',
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
                <span className="text-4xl font-bold text-gray-900">₩{plan.price}</span>
                <span className="text-sm text-gray-500">/ {plan.period}</span>
              </div>
            </div>

            <button className={cn('w-full mb-6 text-center', plan.buttonClass)}>
              {plan.buttonText}
            </button>

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

      {/* FAQ */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-xl font-bold text-gray-900 text-center mb-6">자주 묻는 질문</h2>
        <div className="space-y-4">
          {[
            {
              q: '무료 플랜으로도 키워드 분석이 가능한가요?',
              a: '네, 무료 플랜에서도 일 5회까지 기본 키워드 분석(검색량, 경쟁도)이 가능합니다. Money Score 수익성 분석과 멀티 플랫폼 분석은 프로 플랜부터 이용 가능합니다.',
            },
            {
              q: '플랜 변경은 언제든 가능한가요?',
              a: '네, 언제든지 업그레이드 또는 다운그레이드가 가능합니다. 업그레이드 시 즉시 적용되며, 다운그레이드는 다음 결제일부터 적용됩니다.',
            },
            {
              q: '환불 정책은 어떻게 되나요?',
              a: '결제 후 7일 이내에 환불 요청 시 전액 환불됩니다. 7일 이후에는 잔여 기간에 대한 일할 환불이 적용됩니다.',
            },
            {
              q: 'API 액세스는 어떻게 사용하나요?',
              a: '비즈니스 플랜에서 제공되는 API를 통해 키워드 분석 데이터를 프로그래밍 방식으로 가져올 수 있습니다. 자세한 API 문서는 설정 페이지에서 확인하세요.',
            },
            {
              q: '팀 계정은 어떻게 관리하나요?',
              a: '비즈니스 플랜에서 최대 5명의 팀원을 초대할 수 있습니다. 각 팀원은 독립적인 분석 히스토리와 즐겨찾기를 가집니다.',
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

      {/* CTA */}
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">어떤 플랜이 맞는지 모르겠다면?</p>
        <button className="btn-secondary">문의하기</button>
      </div>
    </div>
  )
}
