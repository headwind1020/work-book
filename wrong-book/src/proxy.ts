import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/register']
const AUTH_COOKIE_KEYS = ['sb-access-token', 'supabase-auth-token']

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

function hasAuthCookie(request: NextRequest): boolean {
  return AUTH_COOKIE_KEYS.some((key) => request.cookies.has(key))
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 静态资源/Next 内部路由放行
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // 根路径重定向到 /dashboard（已登录）或 /login（未登录）
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = hasAuthCookie(request) ? '/dashboard' : '/login'
    return NextResponse.redirect(url)
  }

  // 公共路径放行
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // 受保护路径：未登录跳转 /login
  if (!hasAuthCookie(request)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * 匹配除 _next/static、_next/image、favicon.ico 之外的所有路径
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
