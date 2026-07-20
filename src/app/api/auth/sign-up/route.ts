import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, role } = body as {
      email?: string
      password?: string
      name?: string
      role?: string
    }

    if (!email || !password || !name) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }

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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role: role || 'student' },
        emailRedirectTo: `${new URL(request.url).origin}/dashboard`,
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 })
    }

    const response = NextResponse.json({
      user: data.user,
      session: data.session,
      needsEmailConfirmation: data.session === null,
    })

    const setCookies = request.cookies.getAll()
    setCookies.forEach(({ name, value }) => {
      response.cookies.set(name, value)
    })

    return response
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '注册失败'
    console.error('Sign-up error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}