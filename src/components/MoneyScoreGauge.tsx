'use client'

import { cn } from '@/lib/utils'
import { getScoreGrade, getScoreColor, getScoreLabel } from '@/lib/utils'

interface MoneyScoreGaugeProps {
  score: number
  size?: 'sm' | 'lg'
}

export default function MoneyScoreGauge({ score, size = 'lg' }: MoneyScoreGaugeProps) {
  const grade = getScoreGrade(score)
  const gradeColor = getScoreColor(grade)

  const circumference = 2 * Math.PI * 45
  const offset = circumference - (score / 100) * circumference

  return (
    <div className={cn('flex flex-col items-center', size === 'lg' ? 'gap-3' : 'gap-1')}>
      <div className={cn('relative', size === 'lg' ? 'w-40 h-40' : 'w-24 h-24')}>
        <svg
          className="transform -rotate-90 w-full h-full"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn(
              'transition-all duration-1000 ease-out',
              grade === 'S' ? 'stroke-emerald-500' :
              grade === 'A' ? 'stroke-blue-500' :
              grade === 'B' ? 'stroke-yellow-500' :
              grade === 'C' ? 'stroke-orange-500' :
              'stroke-gray-400'
            )}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn(
            'font-bold',
            size === 'lg' ? 'text-3xl' : 'text-lg'
          )}>{score}</span>
          <span className={cn(
            'font-bold rounded-full px-2 py-0.5',
            gradeColor,
            size === 'lg' ? 'text-sm' : 'text-xs'
          )}>{grade}</span>
        </div>
      </div>
      <div className="text-center">
        <div className={cn('font-semibold text-gray-700', size === 'lg' ? 'text-base' : 'text-xs')}>
          Money Score
        </div>
        <div className={cn('text-gray-500', size === 'lg' ? 'text-sm' : 'text-xs')}>
          {getScoreLabel(grade)}
        </div>
      </div>
    </div>
  )
}
