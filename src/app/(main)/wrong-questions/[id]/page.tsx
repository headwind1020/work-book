'use client'

import { useState } from 'react'
import { Card, CardContent, Button } from '@/components/ui'
import { ArrowLeft, CheckCircle, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

// 模拟错题数据库
const questionsDatabase: Record<string, {
  id: string
  subject: string
  subjectName: string
  subjectColor: string
  knowledgePoint: string
  type: string
  content: string
  options?: string[]
  correctAnswer: string
  explanation: string
  mastery: string
  createdAt: string
}> = {
  '1': {
    id: '1',
    subject: 'math',
    subjectName: '数学',
    subjectColor: 'bg-blue-500',
    knowledgePoint: '二次函数',
    type: 'choice',
    content: '已知二次函数 y = ax² + bx + c 的图像开口向下，且与 x 轴交于点 (1, 0) 和 (-1, 0)，则下列结论正确的是？',
    options: ['a > 0', 'a < 0', 'c = 0', 'b = 0'],
    correctAnswer: 'a < 0',
    explanation: '因为图像开口向下，所以 a < 0；又因为与 x 轴交于 (1, 0) 和 (-1, 0)，代入可得 a + b + c = 0 和 a - b + c = 0，两式相减得 b = 0，两式相加得 c = -a ≠ 0。所以正确答案是 a < 0。',
    mastery: 'unfamiliar',
    createdAt: '2024-01-15',
  },
  '2': {
    id: '2',
    subject: 'physics',
    subjectName: '物理',
    subjectColor: 'bg-teal-500',
    knowledgePoint: '自由落体',
    type: 'choice',
    content: '一物体从高度 h = 20m 处自由下落，不计空气阻力，求落地时的速度。(g = 10m/s²)',
    options: ['10m/s', '15m/s', '20m/s', '25m/s'],
    correctAnswer: '20m/s',
    explanation: '根据自由落体运动公式 v² = 2gh，代入 v² = 2 × 10 × 20 = 400，所以 v = 20m/s。',
    mastery: 'normal',
    createdAt: '2024-01-14',
  },
  '3': {
    id: '3',
    subject: 'english',
    subjectName: '英语',
    subjectColor: 'bg-purple-500',
    knowledgePoint: '时态',
    type: 'choice',
    content: 'The weather ___ fine tomorrow. (is / will be / was / are)',
    options: ['is', 'will be', 'was', 'are'],
    correctAnswer: 'will be',
    explanation: 'tomorrow 表示将来时间，需要用一般将来时 will be。',
    mastery: 'mastered',
    createdAt: '2024-01-13',
  },
  '4': {
    id: '4',
    subject: 'chemistry',
    subjectName: '化学',
    subjectColor: 'bg-yellow-500',
    knowledgePoint: '氧气',
    type: 'fill',
    content: '写出实验室制取氧气的化学方程式。',
    correctAnswer: '2KClO3 = 2KCl + 3O2↑ (加热)',
    explanation: '实验室常用氯酸钾加热制取氧气，反应需要二氧化锰作催化剂。',
    mastery: 'normal',
    createdAt: '2024-01-12',
  },
  '5': {
    id: '5',
    subject: 'chinese',
    subjectName: '语文',
    subjectColor: 'bg-red-500',
    knowledgePoint: '论语',
    type: 'fill',
    content: '解释下列加点字的含义：温故而知新',
    correctAnswer: '故：旧的知识；新：新的理解',
    explanation: '这句话出自《论语》，意思是：复习旧的知识，从而获得新的理解和体会。',
    mastery: 'unfamiliar',
    createdAt: '2024-01-11',
  },
}

export default function WrongQuestionDetailPage() {
  const params = useParams()
  const questionId = params.id as string
  const question = questionsDatabase[questionId]
  const [mastery, setMastery] = useState(question?.mastery || 'unfamiliar')

  if (!question) {
    return (
      <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href="/wrong-questions" className="p-2 hover:bg-sky-light rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-text-primary">错题不存在</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-text-secondary">未找到该错题，可能已被删除。</p>
            <Link href="/wrong-questions">
              <Button className="mt-4">返回错题列表</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const masteryOptions = [
    { value: 'unfamiliar', label: '不熟悉', color: 'text-red-500' },
    { value: 'normal', label: '一般', color: 'text-yellow-500' },
    { value: 'mastered', label: '已掌握', color: 'text-green-500' },
  ]

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/wrong-questions" className="p-2 hover:bg-sky-light rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-text-primary">错题详情</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className={`px-3 py-1 ${question.subjectColor} text-white text-sm rounded-full`}>
              {question.subjectName}
            </span>
            <span className="px-3 py-1 bg-gray-100 text-text-secondary text-sm rounded-full">
              {question.knowledgePoint}
            </span>
            <span className="text-xs text-text-light ml-auto">{question.createdAt}</span>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-medium text-text-primary mb-4">{question.content}</h2>

            {question.options && (
              <div className="space-y-3">
                {question.options.map((option, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border-2 ${
                      option === question.correctAnswer
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <span className="font-medium">{option}</span>
                    {option === question.correctAnswer && (
                      <CheckCircle className="inline-block w-5 h-5 text-green-500 ml-2" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {!question.options && (
              <div className="p-4 bg-green-50 border-2 border-green-500 rounded-xl">
                <span className="font-medium text-green-700">正确答案：{question.correctAnswer}</span>
              </div>
            )}
          </div>

          <div className="p-4 bg-sky-light rounded-xl mb-6">
            <h3 className="font-medium text-text-primary mb-2">解析</h3>
            <p className="text-text-secondary">{question.explanation}</p>
          </div>

          {/* 掌握程度修改 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-text-primary mb-2">掌握程度</label>
            <select
              value={mastery}
              onChange={(e) => setMastery(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm"
            >
              {masteryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 gap-2">
              <Edit className="w-4 h-4" />
              编辑
            </Button>
            <Button variant="outline" className="flex-1 gap-2 text-red-500 hover:text-red-500">
              <Trash2 className="w-4 h-4" />
              删除
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
