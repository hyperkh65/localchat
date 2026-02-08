'use client'

import { Settings, User, Key, Bell, Shield } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">설정</h1>
        <p className="text-gray-500 text-sm">계정 및 서비스 설정을 관리하세요</p>
      </div>

      {/* Profile */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="w-5 h-5 text-gray-500" />
          <h2 className="font-bold text-gray-900">프로필</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1">이름</label>
            <input
              type="text"
              defaultValue="사용자"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">이메일</label>
            <input
              type="email"
              defaultValue="user@example.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>
      </div>

      {/* API Keys */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Key className="w-5 h-5 text-gray-500" />
          <h2 className="font-bold text-gray-900">API 키 설정</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          외부 API 키를 등록하면 더 정확한 데이터를 제공받을 수 있습니다 (선택사항)
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1">네이버 검색광고 API Key</label>
            <input
              type="password"
              placeholder="API License Key"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">네이버 검색광고 Secret Key</label>
            <input
              type="password"
              placeholder="Secret Key"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">네이버 검색광고 Customer ID</label>
            <input
              type="text"
              placeholder="Customer ID"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>
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
            <span className="block text-xs text-gray-500">일 5회 분석 / 네이버만</span>
          </div>
          <a href="/pricing" className="btn-primary text-sm py-2">
            업그레이드
          </a>
        </div>
      </div>

      <button className="btn-primary">설정 저장</button>
    </div>
  )
}
