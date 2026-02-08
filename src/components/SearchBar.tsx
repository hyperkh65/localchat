'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

interface SearchBarProps {
  large?: boolean
  placeholder?: string
  defaultValue?: string
}

export default function SearchBar({ large = false, placeholder = '분석할 키워드를 입력하세요', defaultValue = '' }: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue)
  const router = useRouter()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed) {
      router.push(`/analyze/${encodeURIComponent(trimmed)}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className={`relative flex items-center ${large ? 'max-w-2xl' : 'max-w-xl'}`}>
        <Search className={`absolute left-4 text-gray-400 ${large ? 'w-6 h-6' : 'w-5 h-5'}`} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-28 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all ${
            large ? 'py-4 text-lg' : 'py-3 text-base'
          }`}
        />
        <button
          type="submit"
          className={`absolute right-2 btn-primary ${
            large ? 'px-6 py-2.5 text-base' : 'px-5 py-2 text-sm'
          } rounded-xl`}
        >
          분석하기
        </button>
      </div>
    </form>
  )
}
