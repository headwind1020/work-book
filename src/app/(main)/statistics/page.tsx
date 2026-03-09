'use client'

import { Card, CardContent, CardHeader } from '@/components/ui'
import { BarChart3, TrendingUp, Target, Clock } from 'lucide-react'

const subjectStats = [
  { name: '数学', count: 45, percentage: 35, color: 'bg-blue-500' },
  { name: '物理', count: 28, percentage: 22, color: 'bg-teal-500' },
  { name: '英语', count: 24, percentage: 19, color: 'bg-purple-500' },
  { name: '化学', count: 18, percentage: 14, color: 'bg-yellow-500' },
  { name: '语文', count: 13, percentage: 10, color: 'bg-red-500' },
]

const weeklyData = [
  { day: '周一', count: 5 },
  { day: '周二', count: 8 },
  { day: '周三', count: 3 },
  { day: '周四', count: 12 },
  { day: '周五', count: 6 },
  { day: '周六', count: 15 },
  { day: '周日', count: 9 },
]

const masteryStats = [
  { label: '不熟悉', count: 32, percentage: 25, color: 'bg-red-500' },
  { label: '一般', count: 58, percentage: 46, color: 'bg-yellow-500' },
  { label: '已掌握', count: 36, percentage: 29, color: 'bg-green-500' },
]

export default function StatisticsPage() {
  const maxCount = Math.max(...weeklyData.map((d) => d.count))

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 页面头部 */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">统计分析</h1>
        <p className="text-text-secondary mt-1">了解你的错题分布和学习进度</p>
      </div>

      {/* 顶部统计 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">总错题数</p>
                <p className="text-xl font-bold text-text-primary">126</p>
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
                <p className="text-xl font-bold text-text-primary">23</p>
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
                <p className="text-xl font-bold text-text-primary">34</p>
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
                <p className="text-xl font-bold text-text-primary">18</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* 学科分布 */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-text-primary">学科分布</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {subjectStats.map((subject) => (
              <div key={subject.name}>
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
            ))}
          </CardContent>
        </Card>

        {/* 掌握程度 */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-text-primary">掌握程度</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {masteryStats.map((stat) => (
              <div key={stat.label}>
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
            ))}
          </CardContent>
        </Card>

        {/* 本周趋势 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="font-semibold text-text-primary">本周错题趋势</h2>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between h-48 gap-2">
              {weeklyData.map((data) => (
                <div key={data.day} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-gradient-to-t from-sky to-sky-light rounded-t-lg transition-all duration-500"
                    style={{ height: `${(data.count / maxCount) * 100}%` }}
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
