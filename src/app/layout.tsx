import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'KeywordPulse - 돈이 되는 키워드 분석',
  description: '블로그, 뉴스, SEO를 위한 전문 키워드 수익성 분석 플랫폼. 네이버, 구글, 다음 멀티플랫폼 키워드 분석.',
  keywords: '키워드 분석, SEO, 블로그 키워드, 네이버 키워드, 수익 키워드, Money Score',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
