import { cn } from '@/lib/utils'
import { getScoreColor, getScoreLabel } from '@/lib/utils'

interface MoneyScoreBadgeProps {
  score: number
  grade: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export default function MoneyScoreBadge({ score, grade, size = 'md', showLabel = true }: MoneyScoreBadgeProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-20 h-20 text-xl',
  }

  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-bold',
          getScoreColor(grade),
          sizeClasses[size]
        )}
      >
        {grade}
      </div>
      {showLabel && (
        <div>
          <div className="font-bold text-gray-900">{score}점</div>
          <div className="text-xs text-gray-500">{getScoreLabel(grade)}</div>
        </div>
      )}
    </div>
  )
}
