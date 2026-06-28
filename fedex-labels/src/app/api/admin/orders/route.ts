import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

async function verifyAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const supabase = await createSupabaseServiceClient()
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

export async function GET(req: NextRequest) {
  const user = await verifyAdmin(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const supabase = await createSupabaseServiceClient()
  let query = supabase.from('orders').select('*').order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ orders: data })
}

export async function PATCH(req: NextRequest) {
  const user = await verifyAdmin(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { orderId, assignedTo } = await req.json()
  if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })

  const supabase = await createSupabaseServiceClient()
  const { error } = await supabase
    .from('orders')
    .update({ assigned_to: assignedTo || null })
    .eq('id', orderId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
