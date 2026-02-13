'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Search,
  TrendingUp,
  Compass,
  FileText,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Trophy,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/analyze', label: '키워드 분석', icon: Search },
  { href: '/trending', label: '실시간 트렌드', icon: TrendingUp },
  { href: '/discover', label: '키워드 발굴', icon: Compass },
  { href: '/blog-rank', label: '블로그 랭킹', icon: Trophy },
  { href: '/content-guide', label: '콘텐츠 가이드', icon: FileText },
  { href: '/pricing', label: '요금제', icon: CreditCard },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-sidebar text-white z-50 flex flex-col transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-gray-900" />
        </div>
        {!collapsed && (
          <span className="font-bold text-lg tracking-tight">KeywordPulse</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-accent text-gray-900'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Collapse Button */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all w-full"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {!collapsed && <span>접기</span>}
        </button>
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all mt-1"
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>설정</span>}
        </Link>
      </div>
    </aside>
  )
}
