import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
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

    return NextResponse.json({
      user: data.user,
      session: data.session,
      needsEmailConfirmation: data.session === null,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '注册失败'
    console.error('Sign-up error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}