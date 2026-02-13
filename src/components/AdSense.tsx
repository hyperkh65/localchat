'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    adsbygoogle: Array<Record<string, unknown>>
  }
}

interface AdSenseProps {
  slot: string
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical'
  responsive?: boolean
  className?: string
  style?: React.CSSProperties
}

export default function AdSense({
  slot,
  format = 'auto',
  responsive = true,
  className = '',
  style,
}: AdSenseProps) {
  const adRef = useRef<HTMLDivElement>(null)
  const pushed = useRef(false)

  useEffect(() => {
    if (pushed.current) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      pushed.current = true
    } catch {
      // AdSense not loaded yet
    }
  }, [])

  return (
    <div ref={adRef} className={`ad-container ${className}`} style={{ minHeight: 90 }}>
      <ins
        className="adsbygoogle"
        style={style || { display: 'block' }}
        data-ad-client="ca-pub-8940400388075870"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  )
}

// Predefined ad placements with specific slots
export function AdBanner({ className = '' }: { className?: string }) {
  return <AdSense slot="4966757696" className={`my-4 ${className}`} />
}

export function AdInArticle({ className = '' }: { className?: string }) {
  return <AdSense slot="6103938601" format="fluid" className={`my-6 ${className}`} />
}

export function AdRectangle({ className = '' }: { className?: string }) {
  return (
    <AdSense
      slot="4318415347"
      className={className}
      style={{ display: 'inline-block', width: '100%', maxWidth: 336, height: 280 }}
      responsive={false}
    />
  )
}

export function AdHorizontal({ className = '' }: { className?: string }) {
  return <AdSense slot="1637908585" className={`my-4 ${className}`} />
}

// Slot mapping for different page positions
export const AD_SLOTS = {
  DASHBOARD_TOP: '4966757696',
  DASHBOARD_MID: '6103938601',
  DISCOVER_TOP: '4318415347',
  DISCOVER_MID: '2995216079',
  DISCOVER_BOTTOM: '6844019640',
  CONTENT_GUIDE_TOP: '3196905364',
  CONTENT_GUIDE_MID: '3388477058',
  CONTENT_GUIDE_BOTTOM: '1637908585',
  BLOG_RANK_TOP: '5158151469',
  BLOG_RANK_MID: '3106703198',
  BLOG_RANK_BOTTOM: '8394888625',
  TRENDING_TOP: '4238744126',
  TRENDING_MID: '1739739148',
  TRENDING_BOTTOM: '1277782099',
  PRICING_TOP: '9071434254',
  SIDEBAR: '7354479161',
  MODAL_1: '6232969180',
  MODAL_2: '3461510508',
  IN_FEED: '7261154719',
  PAGE_BOTTOM: '1230840128',
} as const
