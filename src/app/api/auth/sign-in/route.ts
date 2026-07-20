import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body as { email?: string; password?: string }

    if (!email || !password) {
      return NextResponse.json({ error: '缺少邮箱或密码' }, { status: 400 })
    }

    // 服务端创建一次性 client，不持久化 cookie
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Supabase 未配置' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 401 })
    }

    return NextResponse.json({
      user: data.user,
      session: data.session,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '登录失败'
    console.error('Sign-in error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}