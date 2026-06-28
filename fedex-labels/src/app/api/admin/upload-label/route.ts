import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

// Simple admin token auth — set ADMIN_TOKEN in env
const ADMIN_TOKEN = process.env.ADMIN_TOKEN

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!ADMIN_TOKEN || authHeader !== `Bearer ${ADMIN_TOKEN}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { orderId, labelUrl } = await req.json()
  if (!orderId || !labelUrl) {
    return NextResponse.json({ error: 'Missing orderId or labelUrl' }, { status: 400 })
  }

  const supabase = await createSupabaseServiceClient()
  const { error } = await supabase
    .from('orders')
    .update({ status: 'label_ready', label_url: labelUrl })
    .eq('id', orderId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
