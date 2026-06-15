'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui'
import {
  FileQuestion,
  Lightbulb,
  TrendingUp,
  Target,
  ChevronRight,
  Sparkles,
  X
} from 'lucide-react'
import Link from 'next/link'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { getUserStats, getKnowledgeStats, type UserStats, type KnowledgeStats } from '@/lib/database'
import {
  subjectLabels,
  masteryLabels,
  masteryColors,
} from '@/lib/supabase'

type StatType = 'total' | 'knowledge' | 'weekly' | 'unfamiliar'

export default function DashboardPage() {
  const { user, loading: userLoading } = useCurrentUser()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [weakPoints, setWeakPoints] = useState<KnowledgeStats[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStat, setSelectedStat] = useState<StatType | null>(null)

  useEffect(() => {
    if (userLoading) return
    loadData()
  }, [userLoading])

  async function loadData() {
    try {
      setLoading(true)
      const [s, kp] = await Promise.all([getUserStats(), getKnowledgeStats()])
      setStats(s)
      // 薄弱知识点：按陌生题数倒序
      setWeakPoints(
        kp
          .filter((p) => p.unfamiliarCount > 0)
          .sort((a, b) => b.unfamiliarCount - a.unfamiliarCount)
          .slice(0, 5)
      )
    } catch (err) {
      console.error('加载控制台数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 6) return '夜深了'
    if (h < 12) return '早上好'
    if (h < 18) return '下午好'
    return '晚上好'
  })()

  const total = stats?.total ?? 0
  const unfamiliar = stats?.byMastery.unfamiliar ?? 0
  const weeklyTotal = stats?.recent7Days.reduce((s, d) => s + d.count, 0) ?? 0
  const knowledgeCount = weakPoints.length

  const cards = [
    { id: 'total' as const, label: '总错题数', value: total, icon: FileQuestion, color: 'bg-blue-500' },
    { id: 'knowledge' as const, label: '知识点', value: knowledgeCount, icon: Lightbulb, color: 'bg-yellow-500' },
    { id: 'weekly' as const, label: '本周新增', value: weeklyTotal, icon: TrendingUp, color: 'bg-green-500' },
    { id: 'unfamiliar' as const, label: '待巩固', value: unfamiliar, icon: Target, color: 'bg-red-500' },
  ]

  const detailData: Record<StatType, { title: string; items: { label: string; value: string }[] }> = {
    total: {
      title: '各学科错题数',
      items: Object.entries(stats?.bySubject ?? {}).map(([k, v]) => ({
        label: subjectLabels[k as keyof typeof subjectLabels] ?? k,
        value: String(v),
      })),
    },
    knowledge: {
      title: '薄弱知识点 Top 5',
      items: weakPoints.map((p) => ({
        label: `${subjectLabels[p.subject as keyof typeof subjectLabels] ?? p.subject} · ${p.name}`,
        value: `${p.unfamiliarCount} 待巩固`,
      })),
    },
    weekly: {
      title: '本周每日新增',
      items: (stats?.recent7Days ?? []).map((d) => ({
        label: d.date,
        value: `${d.count} 道`,
      })),
    },
    unfamiliar: {
      title: '待巩固题目（按掌握程度）',
      items: Object.entries(stats?.byMastery ?? {}).map(([k, v]) => ({
        label: masteryLabels[k as keyof typeof masteryLabels] ?? k,
        value: `${v} 道`,
      })),
    },
  }

  if (loading || userLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-sky border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const recent = stats?.recent ?? []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-sky/20 via-sky-light to-sunset-warm/20 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          {greeting}，{user?.name ?? '同学'}
        </h1>
        <p className="text-text-secondary">
          今天也要认真巩固错题哦！
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((stat) => (
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
            {recent.length === 0 ? (
              <div className="py-8 text-center text-text-secondary">还没有错题，去添加第一道吧</div>
            ) : (
              recent.map((q) => {
                const subj = subjectLabels[q.subject]
                return (
                  <Link
                    key={q.id}
                    href={`/wrong-questions/${q.id}`}
                    className="flex items-center gap-4 py-3 hover:bg-sky-light/50 rounded-lg px-2 -mx-2 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky/80 to-sky-dark flex items-center justify-center text-white text-sm font-medium">
                      {subj[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary truncate">{q.content}</p>
                      <p className="text-xs mt-0.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${masteryColors[q.mastery_level]}`}>
                          {masteryLabels[q.mastery_level]}
                        </span>
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-text-light" />
                  </Link>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <div className="p-4 border-b border-border/50">
            <h2 className="font-semibold text-text-primary">薄弱知识点</h2>
          </div>
          <CardContent className="space-y-3">
            {weakPoints.length === 0 ? (
              <p className="text-sm text-text-secondary text-center py-6">暂无薄弱知识点</p>
            ) : (
              weakPoints.map((p, index) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-sky-light/50 transition-colors"
                >
                  <span className="w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-sm text-text-primary truncate">
                    {subjectLabels[p.subject as keyof typeof subjectLabels] ?? p.subject} · {p.name}
                  </span>
                  <span className="text-xs text-text-light">{p.unfamiliarCount} 题</span>
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
              <Target className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <span className="text-sm font-medium text-text-primary">开始评测</span>
            </Link>
          </div>
        </CardContent>
      </Card>

      {selectedStat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedStat(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-text-primary">{detailData[selectedStat].title}</h3>
              <button onClick={() => setSelectedStat(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto max-h-[60vh]">
              {detailData[selectedStat].items.length === 0 ? (
                <p className="text-center text-text-secondary py-4">暂无数据</p>
              ) : (
                detailData[selectedStat].items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
