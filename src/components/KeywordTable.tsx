'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { formatNumber, getScoreColor } from '@/lib/utils'
import { ArrowUpDown } from 'lucide-react'

interface KeywordRow {
  keyword: string
  monthlyVolume: number
  competition: 'high' | 'medium' | 'low'
  moneyScore: number
  moneyGrade: string
}

interface KeywordTableProps {
  keywords: KeywordRow[]
  showRank?: boolean
}

const competitionLabel: Record<string, string> = {
  high: '높음',
  medium: '중간',
  low: '낮음',
}
const competitionColor: Record<string, string> = {
  high: 'text-red-500 bg-red-50',
  medium: 'text-yellow-600 bg-yellow-50',
  low: 'text-green-600 bg-green-50',
}

export default function KeywordTable({ keywords, showRank = false }: KeywordTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {showRank && <th className="text-left py-3 px-4 text-gray-500 font-medium w-12">#</th>}
            <th className="text-left py-3 px-4 text-gray-500 font-medium">키워드</th>
            <th className="text-left py-3 px-4 text-gray-500 font-medium">
              <span className="flex items-center gap-1">
                월간 검색량 <ArrowUpDown className="w-3 h-3" />
              </span>
            </th>
            <th className="text-left py-3 px-4 text-gray-500 font-medium">경쟁도</th>
            <th className="text-left py-3 px-4 text-gray-500 font-medium">
              <span className="flex items-center gap-1">
                Money Score <ArrowUpDown className="w-3 h-3" />
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {keywords.map((kw, i) => (
            <tr key={kw.keyword} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
              {showRank && (
                <td className="py-3 px-4 font-bold text-gray-400">{i + 1}</td>
              )}
              <td className="py-3 px-4">
                <Link
                  href={`/analyze/${encodeURIComponent(kw.keyword)}`}
                  className="font-medium text-gray-900 hover:text-accent-dark transition-colors"
                >
                  {kw.keyword}
                </Link>
              </td>
              <td className="py-3 px-4 text-gray-700 font-medium">
                {formatNumber(kw.monthlyVolume)}
              </td>
              <td className="py-3 px-4">
                <span className={cn(
                  'px-2 py-1 rounded-lg text-xs font-medium',
                  competitionColor[kw.competition]
                )}>
                  {competitionLabel[kw.competition]}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                    getScoreColor(kw.moneyGrade)
                  )}>
                    {kw.moneyGrade}
                  </div>
                  <span className="font-semibold text-gray-700">{kw.moneyScore}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
