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

export async function GET(req: NextRequest) {
  const user = await verifyReseller(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createSupabaseServiceClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('assigned_to', user.id)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ orders: data })
}
