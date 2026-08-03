import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * 服务端组件使用的 Supabase 客户端
 * 必须在 RSC 或 Server Action 中调用
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // RSC 中 set 会被忽略，middleware 会处理
          }
        },
      },
    }
  )
}