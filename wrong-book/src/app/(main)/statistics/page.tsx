'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui'
import { BarChart3, TrendingUp, Target, Clock } from 'lucide-react'
import { getUserStats, getAssessmentRecords, type UserStats } from '@/lib/database'
import { subjectLabels, masteryLabels } from '@/lib/supabase'

const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export default function StatisticsPage() {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [pendingReview, setPendingReview] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [s, records] = await Promise.all([getUserStats(), getAssessmentRecords()])
      setStats(s)
      // 待复习：7 天内未评测的陌生知识点题
      const sevenDaysAgo = Date.now() - 7 * 24 * 3600 * 1000
      const recent = records.filter((r) => new Date(r.answered_at).getTime() > sevenDaysAgo)
      const reviewedIds = new Set(recent.map((r) => r.question_id).filter(Boolean))
      const allUnknown = (s.total) - (s.byMastery.mastered ?? 0)
      setPendingReview(Math.max(allUnknown - reviewedIds.size, 0))
    } catch (err) {
      console.error('加载统计失败:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-sky border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const total = stats.total || 1
  const subjectStats = (['math', 'physics', 'english', 'chemistry', 'chinese'] as const)
    .map((k) => ({
      key: k,
      name: subjectLabels[k],
      count: stats.bySubject[k] ?? 0,
      percentage: Math.round(((stats.bySubject[k] ?? 0) / total) * 100),
      color: 'bg-blue-500',
    }))
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count)

  const subjectColorMap: Record<string, string> = {
    math: 'bg-blue-500',
    physics: 'bg-teal-500',
    english: 'bg-purple-500',
    chemistry: 'bg-yellow-500',
    chinese: 'bg-red-500',
  }
  subjectStats.forEach((s) => {
    s.color = subjectColorMap[s.key] ?? 'bg-gray-500'
  })

  const masteryOrder: Array<'unfamiliar' | 'normal' | 'mastered'> = ['unfamiliar', 'normal', 'mastered']
  const masteryColorMap: Record<string, string> = {
    unfamiliar: 'bg-red-500',
    normal: 'bg-yellow-500',
    mastered: 'bg-green-500',
  }
  const masteryStats = masteryOrder
    .map((k) => ({
      key: k,
      label: masteryLabels[k],
      count: stats.byMastery[k] ?? 0,
      percentage: Math.round(((stats.byMastery[k] ?? 0) / total) * 100),
      color: masteryColorMap[k],
    }))
    .filter((m) => m.count > 0)

  const weeklyData = stats.recent7Days
  const maxCount = Math.max(...weeklyData.map((d) => d.count), 1)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">统计分析</h1>
        <p className="text-text-secondary mt-1">了解你的错题分布和学习进度</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">总错题数</p>
                <p className="text-xl font-bold text-text-primary">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">本周新增</p>
                <p className="text-xl font-bold text-text-primary">
                  {weeklyData.reduce((s, d) => s + d.count, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">已掌握</p>
                <p className="text-xl font-bold text-text-primary">{stats.byMastery.mastered ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">待复习</p>
                <p className="text-xl font-bold text-text-primary">{pendingReview}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-text-primary">学科分布</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {subjectStats.length === 0 ? (
              <p className="text-sm text-text-secondary text-center py-6">暂无数据</p>
            ) : (
              subjectStats.map((subject) => (
                <div key={subject.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-text-primary">{subject.name}</span>
                    <span className="text-sm text-text-secondary">{subject.count} 题</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${subject.color} rounded-full transition-all duration-500`}
                      style={{ width: `${subject.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-text-primary">掌握程度</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {masteryStats.length === 0 ? (
              <p className="text-sm text-text-secondary text-center py-6">暂无数据</p>
            ) : (
              masteryStats.map((stat) => (
                <div key={stat.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-text-primary">{stat.label}</span>
                    <span className="text-sm text-text-secondary">{stat.count} 题</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${stat.color} rounded-full transition-all duration-500`}
                      style={{ width: `${stat.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="font-semibold text-text-primary">本周错题趋势</h2>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between h-48 gap-2">
              {weeklyData.map((data, idx) => {
                const d = new Date()
                d.setDate(d.getDate() - (6 - idx))
                const dayLabel = WEEKDAY_LABELS[d.getDay()]
                return (
                  <div key={data.date} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-gradient-to-t from-sky to-sky-light rounded-t-lg transition-all duration-500"
                      style={{ height: `${(data.count / maxCount) * 100}%`, minHeight: '4px' }}
                    />
                    <span className="text-xs text-text-secondary">{dayLabel}</span>
                    <span className="text-xs font-medium text-text-primary">{data.count}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
