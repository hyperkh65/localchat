import { NextResponse } from 'next/server'
import { getRecentSearches, getBlueOceanKeywords } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [searches, blueOceans] = await Promise.all([
      getRecentSearches(30),
      getBlueOceanKeywords(20),
    ])

    return NextResponse.json({
      success: true,
      data: {
        recentSearches: searches,
        blueOceanKeywords: blueOceans,
      },
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'unknown'
    return NextResponse.json({ success: false, error: msg, data: { recentSearches: [], blueOceanKeywords: [] } })
  }
}
