import { NextResponse } from 'next/server'
import { requireAdmin, jsonError } from '@/lib/api-helpers'
import { summarizeStaleContentImpact } from '@/lib/content/content-impact'

export async function GET() {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const { summary, error } = await summarizeStaleContentImpact(supabase)
  if (error) return jsonError(error.message, 500)

  return NextResponse.json(summary)
}
