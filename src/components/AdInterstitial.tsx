'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X } from 'lucide-react'
import { AD_SLOTS } from './AdSense'

declare global {
  interface Window {
    adsbygoogle: Array<Record<string, unknown>>
  }
}

interface AdInterstitialProps {
  show: boolean
  onClose: () => void
  delay?: number // seconds before close button appears
}

export default function AdInterstitial({ show, onClose, delay = 5 }: AdInterstitialProps) {
  const [canClose, setCanClose] = useState(false)
  const [countdown, setCountdown] = useState(delay)
  const pushed = useRef(false)

  useEffect(() => {
    if (!show) {
      setCanClose(false)
      setCountdown(delay)
      pushed.current = false
      return
    }

    // Push ad when modal opens
    if (!pushed.current) {
      try {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
        pushed.current = true
      } catch {
        // AdSense not loaded
      }
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanClose(true)
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [show, delay])

  const handleClose = useCallback(() => {
    if (canClose) onClose()
  }, [canClose, onClose])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-[95%] mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
          <span className="text-xs text-gray-400">Sponsored</span>
          {canClose ? (
            <button
              onClick={handleClose}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
              닫기
            </button>
          ) : (
            <span className="text-xs text-gray-400">{countdown}초 후 닫기</span>
          )}
        </div>

        {/* Ad Content */}
        <div className="p-4" style={{ minHeight: 300 }}>
          <ins
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client="ca-pub-8940400388075870"
            data-ad-slot={AD_SLOTS.MODAL_1}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>

        {/* Bottom ad */}
        <div className="px-4 pb-4">
          <ins
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client="ca-pub-8940400388075870"
            data-ad-slot={AD_SLOTS.MODAL_2}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      </div>
    </div>
  )
}
