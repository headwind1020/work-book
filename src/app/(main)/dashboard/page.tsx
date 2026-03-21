'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui'
import {
  FileQuestion,
  Lightbulb,
  TrendingUp,
  Target,
  Clock,
  ChevronRight,
  Sparkles,
  X
} from 'lucide-react'
import Link from 'next/link'

type StatType = 'total' | 'knowledge' | 'weekly' | 'mastered'

const stats = [
  {
    id: 'total' as StatType,
    label: '总错题数',
    value: '126',
    icon: FileQuestion,
    color: 'bg-blue-500',
    trend: '+12',
  },
  {
    id: 'knowledge' as StatType,
    label: '知识点',
    value: '45',
    icon: Lightbulb,
    color: 'bg-yellow-500',
    trend: '+5',
  },
  {
    id: 'weekly' as StatType,
    label: '本周新增',
    value: '23',
    icon: TrendingUp,
    color: 'bg-green-500',
    trend: '+8',
  },
  {
    id: 'mastered' as StatType,
    label: '已掌握',
    value: '34',
    icon: Target,
    color: 'bg-purple-500',
    trend: '+3',
  },
]

// 详细数据
const detailData: Record<StatType, { title: string; items: { label: string; value: string }[] }> = {
  total: {
    title: '总错题详情',
    items: [
      { label: '数学', value: '45' },
      { label: '物理', value: '32' },
      { label: '英语', value: '28' },
      { label: '化学', value: '15' },
      { label: '语文', value: '6' },
    ],
  },
  knowledge: {
    title: '知识点分布',
    items: [
      { label: '二次函数', value: '15' },
      { label: '动能定理', value: '12' },
      { label: '从句语法', value: '10' },
      { label: '化学方程式', value: '8' },
    ],
  },
  weekly: {
    title: '本周新增详情',
    items: [
      { label: '今天新增', value: '5' },
      { label: '昨天新增', value: '8' },
      { label: '前天新增', value: '4' },
      { label: '更早', value: '6' },
    ],
  },
  mastered: {
    title: '已掌握详情',
    items: [
      { label: '完全掌握', value: '20' },
      { label: '基本掌握', value: '14' },
    ],
  },
}

const recentQuestions = [
  {
    id: '1',
    subject: '数学',
    content: '已知二次函数 y = ax² + bx + c ...',
    mastery: 'unfamiliar',
  },
  {
    id: '2',
    subject: '物理',
    content: '一物体从高度 h 做自由落体...',
    mastery: 'normal',
  },
  {
    id: '3',
    subject: '英语',
    content: 'The weather ___ fine tomorrow...',
    mastery: 'mastered',
  },
]

const weakPoints = [
  { name: '二次函数', count: 12 },
  { name: '动能定理', count: 8 },
  { name: '从句语法', count: 7 },
  { name: '化学方程式', count: 6 },
]

export default function DashboardPage() {
  const [selectedStat, setSelectedStat] = useState<StatType | null>(null)

  const handleStatClick = (statId: StatType) => {
    setSelectedStat(statId)
  }

  const closeModal = () => {
    setSelectedStat(null)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 欢迎区域 */}
      <div className="bg-gradient-to-r from-sky/20 via-sky-light to-sunset-warm/20 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          你好，学生用户
        </h1>
        <p className="text-text-secondary">
          今天也要认真巩固错题哦！
        </p>
      </div>

      {/* 统计卡片 - 可点击 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card
            key={stat.id}
            hover
            className="p-4 cursor-pointer hover:shadow-md transition-all"
            onClick={() => handleStatClick(stat.id)}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-secondary">{stat.label}</p>
                <p className="text-2xl font-bold text-text-primary mt-1">{stat.value}</p>
                <p className="text-xs text-green-500 mt-1">{stat.trend} 本周</p>
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
        {/* 最近错题 */}
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
            {recentQuestions.map((q) => (
              <Link
                key={q.id}
                href={`/wrong-questions/${q.id}`}
                className="flex items-center gap-4 py-3 hover:bg-sky-light/50 rounded-lg px-2 -mx-2 transition-colors"
              >
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-medium
                  ${q.subject === '数学' ? 'bg-blue-500' : ''}
                  ${q.subject === '物理' ? 'bg-teal-500' : ''}
                  ${q.subject === '英语' ? 'bg-purple-500' : ''}
                  ${q.subject === '语文' ? 'bg-red-500' : ''}
                  ${q.subject === '化学' ? 'bg-yellow-500' : ''}
                `}>
                  {q.subject[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">{q.content}</p>
                  <p className="text-xs text-text-light mt-0.5">
                    {q.mastery === 'unfamiliar' && <span className="text-red-500">不熟悉</span>}
                    {q.mastery === 'normal' && <span className="text-yellow-500">一般</span>}
                    {q.mastery === 'mastered' && <span className="text-green-500">已掌握</span>}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-text-light" />
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* 薄弱知识点 */}
        <Card>
          <div className="p-4 border-b border-border/50">
            <h2 className="font-semibold text-text-primary">薄弱知识点</h2>
          </div>
          <CardContent className="space-y-3">
            {weakPoints.map((point, index) => (
              <div
                key={point.name}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-sky-light/50 transition-colors"
              >
                <span className="w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <span className="flex-1 text-sm text-text-primary">{point.name}</span>
                <span className="text-xs text-text-light">{point.count} 题</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 快捷操作 */}
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
              href="/wrong-questions"
              className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/20 rounded-xl text-center hover:from-purple-500/20 transition-all"
            >
              <Clock className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <span className="text-sm font-medium text-text-primary">复习提醒</span>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 详情弹窗 */}
      {selectedStat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-text-primary">{detailData[selectedStat].title}</h3>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto max-h-[60vh]">
              {detailData[selectedStat].items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-text-primary">{item.label}</span>
                  <span className="font-semibold text-sky">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-border">
              <button
                onClick={closeModal}
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
