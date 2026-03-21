'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CloudBackground, Button, Input } from '@/components/ui'
import { BookOpen, Mail, Lock, ArrowRight } from 'lucide-react'
import { signIn } from '@/lib/database'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn(email, password)
      router.push('/dashboard')
    } catch (err: any) {
      console.error('登录错误:', err)
      // 提供更友好的错误提示
      if (err.message?.includes('Invalid login credentials')) {
        setError('邮箱或密码错误，请检查后重试')
      } else if (err.message?.includes('Email not confirmed')) {
        setError('请先前往邮箱验证您的账号')
      } else if (err.message?.includes('Too many requests')) {
        setError('登录尝试过多，请稍后再试')
      } else {
        setError(err.message || '登录失败，请检查邮箱和密码')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <CloudBackground>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        {/* 登录卡片 */}
        <div className="w-full max-w-md animate-fade-in">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8 glow">
            {/* Logo 和标题 */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-sky to-sunset-warm rounded-2xl mb-4">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-text-primary">
                智能错题簿
              </h1>
              <p className="text-text-secondary mt-1">
                记录错题，巩固知识点
              </p>
            </div>

            {/* 登录表单 */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  邮箱
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="请输入邮箱"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-white text-text-primary placeholder:text-text-light focus:border-sky focus:ring-2 focus:ring-sky/20 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  密码
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-white text-text-primary placeholder:text-text-light focus:border-sky focus:ring-2 focus:ring-sky/20 transition-all"
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-error text-center">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full py-3.5 text-lg font-medium"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    登录中...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    登录
                    <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </Button>
            </form>

            {/* 注册链接 */}
            <p className="text-center mt-6 text-text-secondary">
              还没有账号？{' '}
              <Link
                href="/register"
                className="text-sky font-medium hover:underline"
              >
                立即注册
              </Link>
            </p>
          </div>
        </div>
      </div>
    </CloudBackground>
  )
}
