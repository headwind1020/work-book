'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui'
import { BarChart3, TrendingUp, Target, Clock } from 'lucide-react'
import { getUserStats, getWeeklyStats, UserStats, WeeklyStat } from '@/lib/database'

const subjectLabels: Record<string, string> = {
  chinese: '语文',
  math: '数学',
  english: '英语',
  physics: '物理',
  chemistry: '化学',
}

const subjectColors: Record<string, string> = {
  chinese: 'bg-red-500',
  math: 'bg-blue-500',
  english: 'bg-purple-500',
  physics: 'bg-teal-500',
  chemistry: 'bg-yellow-500',
}

const masteryLabels: Record<string, string> = {
  unfamiliar: '不熟悉',
  normal: '一般',
  mastered: '已掌握',
}

const masteryColors: Record<string, string> = {
  unfamiliar: 'bg-red-500',
  normal: 'bg-yellow-500',
  mastered: 'bg-green-500',
}

export default function StatisticsPage() {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [weekly, setWeekly] = useState<WeeklyStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [userStats, weeklyData] = await Promise.all([
        getUserStats(),
        getWeeklyStats(7),
      ])
      setStats(userStats)
      setWeekly(weeklyData)
    } catch (error) {
      console.error('加载统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !stats) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-sky border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">加载中...</p>
        </div>
      </div>
    )
  }

  const subjectEntries = Object.entries(stats.subjectStats).sort((a, b) => b[1] - a[1])
  const subjectTotal = subjectEntries.reduce((sum, [, v]) => sum + v, 0)
  const masteryEntries = Object.entries(stats.masteryStats)
  const masteryTotal = masteryEntries.reduce((sum, [, v]) => sum + v, 0)

  const weeklyTotal = weekly.reduce((sum, d) => sum + d.count, 0)
  const maxCount = Math.max(1, ...weekly.map((d) => d.count))
  const unfamiliarCount = stats.masteryStats.unfamiliar || 0
  const masteredCount = stats.masteryStats.mastered || 0

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
                <p className="text-xl font-bold text-text-primary">{stats.totalQuestions}</p>
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
                <p className="text-xl font-bold text-text-primary">{weeklyTotal}</p>
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
                <p className="text-xl font-bold text-text-primary">{masteredCount}</p>
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
                <p className="text-xl font-bold text-text-primary">{unfamiliarCount}</p>
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
            {subjectEntries.length === 0 ? (
              <p className="text-text-secondary text-center py-4">暂无数据</p>
            ) : (
              subjectEntries.map(([subject, count]) => (
                <div key={subject}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-text-primary">
                      {subjectLabels[subject] || subject}
                    </span>
                    <span className="text-sm text-text-secondary">{count} 题</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${subjectColors[subject] || 'bg-gray-500'} rounded-full transition-all duration-500`}
                      style={{ width: `${subjectTotal ? (count / subjectTotal) * 100 : 0}%` }}
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
            {masteryEntries.length === 0 ? (
              <p className="text-text-secondary text-center py-4">暂无数据</p>
            ) : (
              masteryEntries.map(([level, count]) => (
                <div key={level}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-text-primary">
                      {masteryLabels[level] || level}
                    </span>
                    <span className="text-sm text-text-secondary">{count} 题</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${masteryColors[level] || 'bg-gray-500'} rounded-full transition-all duration-500`}
                      style={{ width: `${masteryTotal ? (count / masteryTotal) * 100 : 0}%` }}
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
              {weekly.map((data) => (
                <div
                  key={data.date}
                  className="flex-1 flex flex-col items-center gap-2"
                  title={`${data.date}: ${data.count} 题`}
                >
                  <div
                    className="w-full bg-gradient-to-t from-sky to-sky-light rounded-t-lg transition-all duration-500"
                    style={{
                      height: `${(data.count / maxCount) * 100}%`,
                      minHeight: data.count > 0 ? '8px' : '2px',
                    }}
                  />
                  <span className="text-xs text-text-secondary">{data.day}</span>
                  <span className="text-xs font-medium text-text-primary">{data.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}