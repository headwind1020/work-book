import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Supabase 未配置' }, { status: 500 })
    }

    // 解析 cookie 中的 access_token / refresh_token
    const cookieHeader = request.headers.get('cookie') || ''
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c) => {
        const [k, ...rest] = c.trim().split('=')
        return [k, decodeURIComponent(rest.join('='))]
      })
    )

    const accessToken = cookies['sb-access-token'] || cookies['access_token']
    const refreshToken = cookies['sb-refresh-token'] || cookies['refresh_token']

    if (!accessToken) {
      return NextResponse.json({ success: true })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    })

    // 设会话以清除 cookie
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || '',
    })

    await supabase.auth.signOut()

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '登出失败'
    console.error('Sign-out error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}