'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CloudBackground, Button, Input, Select } from '@/components/ui'
import { BookOpen, Mail, Lock, User, ArrowRight, GraduationCap } from 'lucide-react'
import { signUp } from '@/lib/database'

const roleOptions = [
  { value: 'student', label: '学生' },
  { value: 'teacher', label: '老师' },
  { value: 'parent', label: '家长' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('student')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (password.length < 6) {
      setError('密码长度至少6位')
      return
    }

    if (!name.trim()) {
      setError('请输入姓名')
      return
    }

    setLoading(true)

    try {
      const result = await signUp(email, password, name, role)

      if (result.needsEmailConfirmation) {
        alert('注册成功！请前往邮箱点击验证链接完成注册。')
      } else {
        alert('注册成功！正在跳转...')
      }
      router.push('/login')
    } catch (err: any) {
      console.error('注册错误:', err)
      // 提供更友好的错误提示
      if (err.message?.includes('already registered')) {
        setError('该邮箱已被注册，请直接登录或使用其他邮箱')
      } else if (err.message?.includes('Invalid email')) {
        setError('请输入有效的邮箱地址')
      } else if (err.message?.includes('Password')) {
        setError('密码强度不够，请使用更复杂的密码')
      } else {
        setError(err.message || '注册失败，请稍后重试')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <CloudBackground>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        {/* 注册卡片 */}
        <div className="w-full max-w-md animate-fade-in">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8 glow">
            {/* Logo 和标题 */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-sky to-sunset-warm rounded-2xl mb-4">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-text-primary">
                欢迎注册
              </h1>
              <p className="text-text-secondary mt-1">
                开始你的错题管理之旅
              </p>
            </div>

            {/* 注册表单 */}
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  姓名
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="请输入姓名"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-white text-text-primary placeholder:text-text-light focus:border-sky focus:ring-2 focus:ring-sky/20 transition-all"
                    required
                  />
                </div>
              </div>

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
                  角色
                </label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-white text-text-primary focus:border-sky focus:ring-2 focus:ring-sky/20 transition-all cursor-pointer"
                  >
                    {roleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
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
                    placeholder="请输入密码（至少6位）"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-white text-text-primary placeholder:text-text-light focus:border-sky focus:ring-2 focus:ring-sky/20 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  确认密码
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="请再次输入密码"
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
                    注册中...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    注册
                    <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </Button>
            </form>

            {/* 登录链接 */}
            <p className="text-center mt-6 text-text-secondary">
              已有账号？{' '}
              <Link
                href="/login"
                className="text-sky font-medium hover:underline"
              >
                立即登录
              </Link>
            </p>
          </div>
        </div>
      </div>
    </CloudBackground>
  )
}
