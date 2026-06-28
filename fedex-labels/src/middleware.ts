import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  if (!pathname.startsWith('/admin') && !pathname.startsWith('/reseller')) {
    return NextResponse.next()
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: () => {},
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  
  console.log('Middleware - pathname:', pathname)
  console.log('Middleware - user:', user?.id, 'error:', error?.message)

  if (!user) {
    console.log('Middleware - no user, redirecting to /')
    return NextResponse.redirect(new URL('/', req.url))
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  console.log('Middleware - profile:', profile, 'error:', profileError?.message)

  const role = profile?.role

  if (pathname.startsWith('/admin') && role !== 'admin') {
    console.log('Middleware - not admin, role is:', role)
    return NextResponse.redirect(new URL('/', req.url))
  }

  if (pathname.startsWith('/reseller') && role !== 'reseller' && role !== 'admin') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/reseller/:path*'],
}