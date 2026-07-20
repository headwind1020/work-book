import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Supabase 未配置' }, { status: 500 })
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
        },
      },
    })

    await supabase.auth.signOut()

    const response = NextResponse.json({ success: true })
    const setCookies = request.cookies.getAll()
    setCookies.forEach(({ name, value }) => {
      response.cookies.set(name, value)
    })

    return response
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '登出失败'
    console.error('Sign-out error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}