import { NextResponse } from 'next/server'
import { checkDatabaseHealth } from '@/lib/server/health'

export const dynamic = 'force-dynamic'

export async function GET() {
  const health = await checkDatabaseHealth()
  if (!health.ok) return NextResponse.json(health, { status: 503 })
  return NextResponse.json(health)
}
