'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpen,
  LayoutDashboard,
  FileQuestion,
  Lightbulb,
  BarChart3,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Brain,
  FolderOpen,
  Sparkles
} from 'lucide-react'

const navigation = [
  { name: '控制台', href: '/dashboard', icon: LayoutDashboard },
  { name: '错题管理', href: '/wrong-questions', icon: FileQuestion },
  { name: '知识点', href: '/knowledge', icon: Lightbulb },
  { name: '练习册', href: '/workbook', icon: FolderOpen },
  { name: '智能评测', href: '/assessment', icon: Brain },
  { name: 'AI 智能体', href: '/agent', icon: Sparkles },
  { name: '统计分析', href: '/statistics', icon: BarChart3 },
]

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen content-bg">
      {/* 顶部导航 */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-border z-[9999]">
        <div className="h-full px-4 lg:px-6 flex items-center justify-between">
          {/* 左侧 Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-sky-light"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-sky to-sunset-warm rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-text-primary hidden sm:block">智能错题簿</span>
            </Link>
          </div>

          {/* 右侧用户菜单 */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-light rounded-full">
              <div className="w-7 h-7 bg-gradient-to-br from-sky to-sky-dark rounded-full flex items-center justify-center text-white text-sm font-medium">
                学
              </div>
              <span className="text-sm font-medium text-text-primary hidden sm:block">学生用户</span>
              <ChevronDown className="w-4 h-4 text-text-secondary" />
            </div>
          </div>
        </div>
      </header>

      {/* 侧边栏 */}
      <aside
        className={`
          fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-border
          transform transition-transform duration-200 z-[9998]
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${isActive
                    ? 'bg-gradient-to-r from-sky/10 to-sunset-warm/10 text-sky-dark font-medium'
                    : 'text-text-secondary hover:bg-sky-light hover:text-text-primary'
                  }
                `}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-sky' : ''}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* 底部登出 */}
        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={() => {
              if (confirm('确定要退出登录吗？')) {
                // 清除本地存储的登录状态
                localStorage.removeItem('wrong-book-storage')
                // 跳转到登录页
                window.location.href = '/login'
              }
            }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-text-secondary hover:bg-error/10 hover:text-error transition-all"
          >
            <LogOut className="w-5 h-5" />
            退出登录
          </button>
        </div>
      </aside>

      {/* 遮罩层 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9997] lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 主内容区 */}
      <main className="pt-16 lg:pl-64">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
