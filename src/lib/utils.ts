import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toLocaleString()
}

export function getScoreGrade(score: number): 'S' | 'A' | 'B' | 'C' | 'D' {
  if (score >= 90) return 'S'
  if (score >= 70) return 'A'
  if (score >= 50) return 'B'
  if (score >= 30) return 'C'
  return 'D'
}

export function getScoreColor(grade: string): string {
  switch (grade) {
    case 'S': return 'score-s'
    case 'A': return 'score-a'
    case 'B': return 'score-b'
    case 'C': return 'score-c'
    default: return 'score-d'
  }
}

export function getScoreLabel(grade: string): string {
  switch (grade) {
    case 'S': return '최고 수익'
    case 'A': return '우수 수익'
    case 'B': return '보통'
    case 'C': return '낮음'
    default: return '수익성 낮음'
  }
}
