export type Role = 'customer' | 'reseller' | 'admin'

export interface Profile {
  id: string
  email: string
  role: Role
  created_at: string
}

export async function getUserProfile(userId: string): Promise<Profile | null> {
  const { createSupabaseServiceClient } = await import('./supabase-server')
  const supabase = await createSupabaseServiceClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return data
}
