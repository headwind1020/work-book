'use client'

import { useState } from 'react'
import { Card, Button, Input, Select } from '@/components/ui'
import { Plus, Search, Filter, ChevronRight, Trash2, Edit } from 'lucide-react'
import Link from 'next/link'

const subjects = [
  { value: '', label: '全部学科' },
  { value: 'chinese', label: '语文' },
  { value: 'math', label: '数学' },
  { value: 'english', label: '英语' },
  { value: 'physics', label: '物理' },
  { value: 'chemistry', label: '化学' },
]

const masteryOptions = [
  { value: '', label: '全部掌握程度' },
  { value: 'unfamiliar', label: '不熟悉' },
  { value: 'normal', label: '一般' },
  { value: 'mastered', label: '已掌握' },
]

// 模拟数据
const questions = [
  {
    id: '1',
    subject: '数学',
    subjectKey: 'math',
    content: '已知二次函数 y = ax² + bx + c 的图像经过点 (1, 2)、(2, 3)、(3, 6)，求 a、b、c 的值。',
    chapter: '二次函数',
    mastery: 'unfamiliar',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    subject: '物理',
    subjectKey: 'physics',
    content: '一物体从高度 h = 20m 处自由下落，不计空气阻力，求落地时的速度。(g = 10m/s²)',
    chapter: '自由落体',
    mastery: 'normal',
    createdAt: '2024-01-14',
  },
  {
    id: '3',
    subject: '英语',
    subjectKey: 'english',
    content: 'The weather ___ fine tomorrow. (is / will be / was / are)',
    chapter: '时态',
    mastery: 'mastered',
    createdAt: '2024-01-13',
  },
  {
    id: '4',
    subject: '化学',
    subjectKey: 'chemistry',
    content: '写出实验室制取氧气的化学方程式。',
    chapter: '氧气',
    mastery: 'normal',
    createdAt: '2024-01-12',
  },
  {
    id: '5',
    subject: '语文',
    subjectKey: 'chinese',
    content: '解释下列加点字的含义：温故而知新',
    chapter: '论语',
    mastery: 'unfamiliar',
    createdAt: '2024-01-11',
  },
]

export default function WrongQuestionsPage() {
  const [search, setSearch] = useState('')
  const [subject, setSubject] = useState('')
  const [mastery, setMastery] = useState('')

  const getSubjectColor = (key: string) => {
    const colors: Record<string, string> = {
      chinese: 'bg-red-500',
      math: 'bg-blue-500',
      english: 'bg-purple-500',
      physics: 'bg-teal-500',
      chemistry: 'bg-yellow-500',
    }
    return colors[key] || 'bg-gray-500'
  }

  const getMasteryColor = (level: string) => {
    const colors: Record<string, string> = {
      unfamiliar: 'bg-red-100 text-red-600',
      normal: 'bg-yellow-100 text-yellow-600',
      mastered: 'bg-green-100 text-green-600',
    }
    return colors[level] || 'bg-gray-100 text-gray-600'
  }

  const getMasteryLabel = (level: string) => {
    const labels: Record<string, string> = {
      unfamiliar: '不熟悉',
      normal: '一般',
      mastered: '已掌握',
    }
    return labels[level] || level
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 页面头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">错题管理</h1>
          <p className="text-text-secondary mt-1">共 {questions.length} 道错题</p>
        </div>
        <Link href="/wrong-questions/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            新增错题
          </Button>
        </Link>
      </div>

      {/* 筛选区域 */}
      <Card>
        <div className="p-4 flex flex-col lg:flex-row gap-4">
          {/* 搜索 */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索错题内容..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-white text-text-primary placeholder:text-text-light focus:border-sky focus:ring-2 focus:ring-sky/20 transition-all"
            />
          </div>

          {/* 学科筛选 */}
          <Select
            options={subjects}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full lg:w-40"
          />

          {/* 掌握程度筛选 */}
          <Select
            options={masteryOptions}
            value={mastery}
            onChange={(e) => setMastery(e.target.value)}
            className="w-full lg:w-40"
          />
        </div>
      </Card>

      {/* 错题列表 */}
      <div className="space-y-3">
        {questions.map((question) => (
          <Card key={question.id} hover className="group">
            <Link href={`/wrong-questions/${question.id}`}>
              <div className="p-4 flex items-start gap-4">
                {/* 学科标签 */}
                <div className={`${getSubjectColor(question.subjectKey)} w-12 h-12 rounded-xl flex items-center justify-center text-white font-medium flex-shrink-0`}>
                  {question.subject}
                </div>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary line-clamp-2">{question.content}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-text-light">{question.chapter}</span>
                    <span className="text-xs text-text-light">•</span>
                    <span className="text-xs text-text-light">{question.createdAt}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getMasteryColor(question.mastery)}`}>
                      {getMasteryLabel(question.mastery)}
                    </span>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="p-2 rounded-lg hover:bg-sky-light text-text-secondary hover:text-sky transition-colors"
                    onClick={(e) => e.preventDefault()}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 rounded-lg hover:bg-red-50 text-text-secondary hover:text-error transition-colors"
                    onClick={(e) => e.preventDefault()}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <ChevronRight className="w-5 h-5 text-text-light flex-shrink-0" />
              </div>
            </Link>
          </Card>
        ))}
      </div>

      {/* 空状态 */}
      {questions.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-sky-light rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-sky" />
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-2">还没有错题</h3>
          <p className="text-text-secondary mb-4">点击下方按钮添加第一道错题</p>
          <Link href="/wrong-questions/new">
            <Button>添加错题</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
