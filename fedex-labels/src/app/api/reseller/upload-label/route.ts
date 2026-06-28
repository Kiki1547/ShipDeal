import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

async function verifyReseller(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const supabase = await createSupabaseServiceClient()
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'reseller' && profile?.role !== 'admin') return null
  return user
}

export async function POST(req: NextRequest) {
  const user = await verifyReseller(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { orderId, labelUrl } = await req.json()
  if (!orderId || !labelUrl) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const supabase = await createSupabaseServiceClient()

  // Verify order is assigned to this reseller
  const { data: order } = await supabase
    .from('orders')
    .select('assigned_to, status')
    .eq('id', orderId)
    .single()

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  if (order.assigned_to !== user.id) return NextResponse.json({ error: 'Not your order' }, { status: 403 })
  if (order.status !== 'paid') return NextResponse.json({ error: 'Order not in paid status' }, { status: 400 })

  const { error } = await supabase
    .from('orders')
    .update({ status: 'label_ready', label_url: labelUrl })
    .eq('id', orderId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
