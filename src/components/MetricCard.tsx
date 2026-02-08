import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  change?: number
  icon?: LucideIcon
  className?: string
}

export default function MetricCard({ title, value, subtitle, change, icon: Icon, className }: MetricCardProps) {
  return (
    <div className={cn('metric-card', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 font-medium">{title}</span>
        {Icon && <Icon className="w-5 h-5 text-gray-400" />}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {change !== undefined && (
          <span className={cn(
            'flex items-center text-sm font-medium pb-0.5',
            change > 0 ? 'text-emerald-600' : change < 0 ? 'text-red-500' : 'text-gray-400'
          )}>
            {change > 0 ? <TrendingUp className="w-4 h-4 mr-0.5" /> :
             change < 0 ? <TrendingDown className="w-4 h-4 mr-0.5" /> :
             <Minus className="w-4 h-4 mr-0.5" />}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      {subtitle && <span className="text-xs text-gray-400">{subtitle}</span>}
    </div>
  )
}
