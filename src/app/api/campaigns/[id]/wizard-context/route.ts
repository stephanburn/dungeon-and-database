import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth, jsonError } from '@/lib/api-helpers'
import { loadCampaignWizardContext } from '@/lib/characters/wizard-context'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { supabase } = auth

  const context = await loadCampaignWizardContext(supabase, params.id)
  if (!context) {
    return jsonError('Campaign not found', 404)
  }

  return NextResponse.json(context)
}
