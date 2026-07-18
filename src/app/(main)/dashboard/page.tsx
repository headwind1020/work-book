'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui'
import {
  FileQuestion,
  Lightbulb,
  TrendingUp,
  Target,
  Clock,
  ChevronRight,
  Sparkles,
  X,
} from 'lucide-react'
import Link from 'next/link'
import {
  getUserStats,
  getRecentQuestions,
  getWeakPoints,
  getWeeklyNewCount,
  UserStats,
  WeakPoint,
} from '@/lib/database'
import type { DbWrongQuestion } from '@/lib/database'

type StatType = 'total' | 'knowledge' | 'weekly' | 'mastered'

const subjectLabels: Record<string, string> = {
  chinese: '语文',
  math: '数学',
  english: '英语',
  physics: '物理',
  chemistry: '化学',
}

const subjectColorsText: Record<string, string> = {
  chinese: 'bg-red-500',
  math: 'bg-blue-500',
  english: 'bg-purple-500',
  physics: 'bg-teal-500',
  chemistry: 'bg-yellow-500',
}

export default function DashboardPage() {
  const [selectedStat, setSelectedStat] = useState<StatType | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [recentQuestions, setRecentQuestions] = useState<DbWrongQuestion[]>([])
  const [weakPoints, setWeakPoints] = useState<WeakPoint[]>([])
  const [weeklyCount, setWeeklyCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [userStats, recent, weak, weekly] = await Promise.all([
        getUserStats(),
        getRecentQuestions(5),
        getWeakPoints(5),
        getWeeklyNewCount(),
      ])
      setStats(userStats)
      setRecentQuestions(recent)
      setWeakPoints(weak)
      setWeeklyCount(weekly)
    } catch (error) {
      console.error('加载仪表盘数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const total = stats?.totalQuestions ?? 0
  const mastered = stats?.masteryStats?.mastered ?? 0
  const totalKnowledge = Object.keys(stats?.subjectStats || {}).length

  const statCards = [
    {
      id: 'total' as StatType,
      label: '总错题数',
      value: String(total),
      icon: FileQuestion,
      color: 'bg-blue-500',
    },
    {
      id: 'knowledge' as StatType,
      label: '学科数',
      value: String(totalKnowledge),
      icon: Lightbulb,
      color: 'bg-yellow-500',
    },
    {
      id: 'weekly' as StatType,
      label: '本周新增',
      value: String(weeklyCount),
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      id: 'mastered' as StatType,
      label: '已掌握',
      value: String(mastered),
      icon: Target,
      color: 'bg-purple-500',
    },
  ]

  const detailData = (): { title: string; items: { label: string; value: string }[] } => {
    if (!stats) return { title: '', items: [] }
    if (selectedStat === 'total') {
      const subjects = Object.entries(stats.subjectStats).sort((a, b) => b[1] - a[1])
      return {
        title: '总错题详情',
        items: subjects.map(([k, v]) => ({ label: subjectLabels[k] || k, value: String(v) })),
      }
    }
    if (selectedStat === 'knowledge') {
      const subjects = Object.entries(stats.subjectStats).sort((a, b) => b[1] - a[1])
      return {
        title: '学科分布',
        items: subjects.map(([k, v]) => ({ label: subjectLabels[k] || k, value: `${v} 题` })),
      }
    }
    if (selectedStat === 'weekly') {
      return {
        title: '本周新增',
        items: [{ label: '本周新增错题', value: String(weeklyCount) }],
      }
    }
    if (selectedStat === 'mastered') {
      const items: { label: string; value: string }[] = []
      if (stats.masteryStats.mastered) items.push({ label: '已掌握', value: String(stats.masteryStats.mastered) })
      if (stats.masteryStats.normal) items.push({ label: '一般', value: String(stats.masteryStats.normal) })
      if (stats.masteryStats.unfamiliar) items.push({ label: '不熟悉', value: String(stats.masteryStats.unfamiliar) })
      return { title: '掌握程度', items }
    }
    return { title: '', items: [] }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-sky border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-sky/20 via-sky-light to-sunset-warm/20 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          你好，欢迎回来！
        </h1>
        <p className="text-text-secondary">
          今天也要认真巩固错题哦！
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card
            key={stat.id}
            hover
            className="p-4 cursor-pointer hover:shadow-md transition-all"
            onClick={() => setSelectedStat(stat.id)}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-secondary">{stat.label}</p>
                <p className="text-2xl font-bold text-text-primary mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-2.5 rounded-xl`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="mt-2 text-xs text-text-light text-center pt-2 border-t border-border/50">
              点击查看详情
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="p-4 border-b border-border/50 flex items-center justify-between">
            <h2 className="font-semibold text-text-primary">最近错题</h2>
            <Link
              href="/wrong-questions"
              className="text-sm text-sky hover:underline flex items-center gap-1"
            >
              查看全部 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <CardContent className="divide-y divide-border/50">
            {recentQuestions.length === 0 ? (
              <p className="py-8 text-center text-text-secondary">还没有错题记录</p>
            ) : (
              recentQuestions.map((q) => (
                <Link
                  key={q.id}
                  href={`/wrong-questions/${q.id}`}
                  className="flex items-center gap-4 py-3 hover:bg-sky-light/50 rounded-lg px-2 -mx-2 transition-colors"
                >
                  <div
                    className={`${subjectColorsText[q.subject] || 'bg-gray-500'} w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-medium`}
                  >
                    {(subjectLabels[q.subject] || q.subject)[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{q.content}</p>
                    <p className="text-xs text-text-light mt-0.5">
                      {q.mastery_level === 'unfamiliar' && <span className="text-red-500">不熟悉</span>}
                      {q.mastery_level === 'normal' && <span className="text-yellow-500">一般</span>}
                      {q.mastery_level === 'mastered' && <span className="text-green-500">已掌握</span>}
                      <span className="ml-2">{new Date(q.created_at).toLocaleDateString('zh-CN')}</span>
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-light" />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <div className="p-4 border-b border-border/50">
            <h2 className="font-semibold text-text-primary">薄弱知识点</h2>
          </div>
          <CardContent className="space-y-3">
            {weakPoints.length === 0 ? (
              <p className="py-8 text-center text-text-secondary text-sm">
                还没有薄弱知识点
              </p>
            ) : (
              weakPoints.map((point, index) => (
                <div
                  key={point.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-sky-light/50 transition-colors"
                >
                  <span className="w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-sm text-text-primary truncate">
                    {point.name}
                  </span>
                  <span className="text-xs text-text-light">{point.count} 题</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-sunset" />
            <h2 className="font-semibold text-text-primary">快捷操作</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href="/wrong-questions/new"
              className="p-4 bg-gradient-to-br from-sky/10 to-sky-light rounded-xl text-center hover:from-sky/20 hover:to-sky-light/50 transition-all"
            >
              <FileQuestion className="w-6 h-6 text-sky mx-auto mb-2" />
              <span className="text-sm font-medium text-text-primary">新增错题</span>
            </Link>
            <Link
              href="/knowledge"
              className="p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-500/20 rounded-xl text-center hover:from-yellow-500/20 transition-all"
            >
              <Lightbulb className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
              <span className="text-sm font-medium text-text-primary">知识点</span>
            </Link>
            <Link
              href="/statistics"
              className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/20 rounded-xl text-center hover:from-green-500/20 transition-all"
            >
              <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <span className="text-sm font-medium text-text-primary">学习统计</span>
            </Link>
            <Link
              href="/assessment"
              className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/20 rounded-xl text-center hover:from-purple-500/20 transition-all"
            >
              <Clock className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <span className="text-sm font-medium text-text-primary">智能评测</span>
            </Link>
          </div>
        </CardContent>
      </Card>

      {selectedStat && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedStat(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-text-primary">{detailData().title}</h3>
              <button
                onClick={() => setSelectedStat(null)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto max-h-[60vh]">
              {detailData().items.length === 0 ? (
                <p className="text-text-secondary text-center py-4">暂无数据</p>
              ) : (
                detailData().items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-text-primary">{item.label}</span>
                    <span className="font-semibold text-sky">{item.value}</span>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-border">
              <button
                onClick={() => setSelectedStat(null)}
                className="w-full py-2 px-4 bg-sky text-white rounded-lg hover:bg-sky-dark transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}