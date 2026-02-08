'use client'

import { useState, useEffect } from 'react'
import { Settings, Key, Bell, Shield, CheckCircle, XCircle, Loader2, RefreshCw, Zap } from 'lucide-react'

interface EnvStatus {
  naverAd: { customerId: boolean; apiLicense: boolean; secretKey: boolean; configured: boolean }
  naverDev: { clientId: boolean; clientSecret: boolean; configured: boolean }
  kakao: { restApiKey: boolean; adminKey: boolean; configured: boolean }
}

interface ApiTestResult {
  status: string
  httpStatus?: number
  keywordCount?: number
  sampleKeyword?: string
  totalResults?: number
  itemCount?: number
  resultCount?: number
  totalCount?: number
  docCount?: number
}

function StatusBadge({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
      <CheckCircle className="w-3.5 h-3.5" /> 설정됨
    </span>
  ) : (
    <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
      <XCircle className="w-3.5 h-3.5" /> 미설정
    </span>
  )
}

function LiveBadge({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
      <Zap className="w-3.5 h-3.5" /> 연결 성공
    </span>
  ) : (
    <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
      <XCircle className="w-3.5 h-3.5" /> 연결 실패
    </span>
  )
}

export default function SettingsPage() {
  const [envStatus, setEnvStatus] = useState<EnvStatus | null>(null)
  const [allConfigured, setAllConfigured] = useState(false)
  const [configuredCount, setConfiguredCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [liveResults, setLiveResults] = useState<Record<string, ApiTestResult> | null>(null)
  const [testingLive, setTestingLive] = useState(false)

  async function fetchStatus() {
    setLoading(true)
    try {
      const res = await fetch('/api/env-status')
      const json = await res.json()
      if (json.success) {
        setEnvStatus(json.envStatus)
        setAllConfigured(json.allConfigured)
        setConfiguredCount(json.summary.configured)
      }
    } catch (err) {
      console.error('Failed to fetch env status:', err)
    } finally {
      setLoading(false)
    }
  }

  async function testLiveConnections() {
    setTestingLive(true)
    try {
      const res = await fetch('/api/debug')
      const json = await res.json()
      if (json.results) {
        setLiveResults(json.results)
      }
    } catch (err) {
      console.error('Failed to test live connections:', err)
    } finally {
      setTestingLive(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">설정</h1>
        <p className="text-gray-500 text-sm">API 연결 상태 및 서비스 설정을 관리하세요</p>
      </div>

      {/* API Status Overview */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Key className="w-5 h-5 text-gray-500" />
            <h2 className="font-bold text-gray-900">API 환경변수 상태</h2>
          </div>
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-accent animate-spin" />
            <span className="ml-2 text-sm text-gray-500">환경변수 확인 중...</span>
          </div>
        ) : envStatus ? (
          <>
            {/* Summary */}
            <div className={`p-4 rounded-xl mb-6 ${allConfigured ? 'bg-emerald-50 border border-emerald-100' : 'bg-amber-50 border border-amber-100'}`}>
              <div className="flex items-center gap-2">
                {allConfigured ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Settings className="w-5 h-5 text-amber-600" />
                )}
                <span className={`text-sm font-semibold ${allConfigured ? 'text-emerald-800' : 'text-amber-800'}`}>
                  {allConfigured
                    ? '모든 API 키가 설정되었습니다'
                    : `7개 중 ${configuredCount}개 설정됨 — Vercel 환경변수를 확인해주세요`}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {/* Naver Search Ads */}
              <div className="p-4 rounded-xl bg-surface-light">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-900">네이버 검색광고 API</h3>
                  <StatusBadge ok={envStatus.naverAd.configured} />
                </div>
                <div className="space-y-2">
                  {(['NAVER_AD_CUSTOMER_ID', 'NAVER_AD_API_LICENSE', 'NAVER_AD_SECRET_KEY'] as const).map((key) => {
                    const isSet = key === 'NAVER_AD_CUSTOMER_ID' ? envStatus.naverAd.customerId
                      : key === 'NAVER_AD_API_LICENSE' ? envStatus.naverAd.apiLicense
                      : envStatus.naverAd.secretKey
                    return (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{key}</span>
                        <span className={`font-mono text-xs ${isSet ? 'text-emerald-600' : 'text-red-500'}`}>
                          {isSet ? '••••••••' : '미설정'}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-2">검색량, 경쟁도, CPC 데이터 제공</p>
              </div>

              {/* Naver Developer */}
              <div className="p-4 rounded-xl bg-surface-light">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-900">네이버 개발자 API (DataLab/검색)</h3>
                  <StatusBadge ok={envStatus.naverDev.configured} />
                </div>
                <div className="space-y-2">
                  {(['NAVER_CLIENT_ID', 'NAVER_CLIENT_SECRET'] as const).map((key) => {
                    const isSet = key === 'NAVER_CLIENT_ID' ? envStatus.naverDev.clientId : envStatus.naverDev.clientSecret
                    return (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{key}</span>
                        <span className={`font-mono text-xs ${isSet ? 'text-emerald-600' : 'text-red-500'}`}>
                          {isSet ? '••••••••' : '미설정'}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-2">검색 트렌드, 블로그/뉴스 검색 데이터 제공</p>
              </div>

              {/* Kakao */}
              <div className="p-4 rounded-xl bg-surface-light">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-900">카카오 API (다음 검색)</h3>
                  <StatusBadge ok={envStatus.kakao.configured} />
                </div>
                <div className="space-y-2">
                  {(['KAKAO_REST_API_KEY', 'KAKAO_ADMIN_KEY'] as const).map((key) => {
                    const isSet = key === 'KAKAO_REST_API_KEY' ? envStatus.kakao.restApiKey : envStatus.kakao.adminKey
                    return (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{key}</span>
                        <span className={`font-mono text-xs ${isSet ? 'text-emerald-600' : 'text-red-500'}`}>
                          {isSet ? '••••••••' : '미설정'}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-2">다음 블로그/웹/카페 검색 데이터 제공</p>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-100">
              <p className="text-xs text-blue-700">
                API 키는 <strong>Vercel 환경변수</strong>로 안전하게 관리됩니다. 키 값은 서버에서만 사용되며 클라이언트에 노출되지 않습니다.
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">상태를 확인할 수 없습니다</p>
        )}
      </div>

      {/* Live Connection Test */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-gray-500" />
            <h2 className="font-bold text-gray-900">실시간 연결 테스트</h2>
          </div>
          <button
            onClick={testLiveConnections}
            disabled={testingLive}
            className="flex items-center gap-1.5 text-xs font-medium text-white bg-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {testingLive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            {testingLive ? '테스트 중...' : 'API 연결 테스트'}
          </button>
        </div>

        {liveResults ? (
          <div className="space-y-3">
            {[
              { key: 'naverAd', label: '네이버 검색광고 API', desc: '키워드 검색량/경쟁도' },
              { key: 'naverSearch', label: '네이버 검색 API', desc: '뉴스/블로그 검색' },
              { key: 'naverDatalab', label: '네이버 DataLab', desc: '검색 트렌드' },
              { key: 'kakao', label: '카카오 API', desc: '다음 웹/블로그 검색' },
            ].map(({ key, label, desc }) => {
              const result = liveResults[key] as ApiTestResult | undefined
              const isOk = result?.status === 'ok'
              return (
                <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-surface-light">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{label}</span>
                    <span className="block text-xs text-gray-500">{desc}</span>
                  </div>
                  <LiveBadge ok={isOk} />
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">
            &lsquo;API 연결 테스트&rsquo; 버튼을 눌러 실제 연결 상태를 확인하세요
          </p>
        )}
      </div>

      {/* Notifications */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-gray-500" />
          <h2 className="font-bold text-gray-900">알림 설정</h2>
        </div>
        <div className="space-y-3">
          {[
            { label: '키워드 급상승 알림', desc: '관심 키워드가 급상승할 때 알림' },
            { label: '주간 리포트', desc: '매주 월요일 키워드 분석 리포트' },
            { label: '새 블루오션 키워드', desc: '새로운 블루오션 키워드 발굴 시 알림' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-surface-light">
              <div>
                <span className="text-sm font-medium text-gray-900">{item.label}</span>
                <span className="block text-xs text-gray-500">{item.desc}</span>
              </div>
              <div className="w-11 h-6 bg-accent rounded-full relative cursor-pointer">
                <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Plan */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-gray-500" />
          <h2 className="font-bold text-gray-900">현재 플랜</h2>
        </div>
        <div className="flex items-center justify-between p-4 rounded-xl bg-surface-light">
          <div>
            <span className="text-sm font-bold text-gray-900">무료 플랜</span>
            <span className="block text-xs text-gray-500">일 5회 분석 / 전체 API 연동</span>
          </div>
          <a href="/pricing" className="btn-primary text-sm py-2">
            업그레이드
          </a>
        </div>
      </div>
    </div>
  )
}
