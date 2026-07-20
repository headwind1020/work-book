import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * 匹配除以下路径外的所有请求：
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico
     * - 公共认证页面 /login /register
     * - API 路由 /api/*
     * - 公开静态资源（图片等）
     */
    '/((?!_next/static|_next/image|favicon.ico|login|register|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}