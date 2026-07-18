'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, Button } from '@/components/ui'
import { ArrowLeft, Trash2, Save } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  getWrongQuestionById,
  updateWrongQuestion,
  deleteWrongQuestion,
  DbWrongQuestion,
} from '@/lib/database'

const subjectColors: Record<string, string> = {
  chinese: 'bg-red-500',
  math: 'bg-blue-500',
  english: 'bg-purple-500',
  physics: 'bg-teal-500',
  chemistry: 'bg-yellow-500',
}

const subjectLabels: Record<string, string> = {
  chinese: '语文',
  math: '数学',
  english: '英语',
  physics: '物理',
  chemistry: '化学',
}

const masteryOptions = [
  { value: 'unfamiliar', label: '不熟悉' },
  { value: 'normal', label: '一般' },
  { value: 'mastered', label: '已掌握' },
]

export default function WrongQuestionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const questionId = params.id as string

  const [question, setQuestion] = useState<DbWrongQuestion | null>(null)
  const [mastery, setMastery] = useState<string>('unfamiliar')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    if (questionId) {
      loadQuestion()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId])

  const loadQuestion = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getWrongQuestionById(questionId)
      setQuestion(data)
      setMastery(data.mastery_level || 'unfamiliar')
    } catch (err: unknown) {
      console.error('加载错题失败:', err)
      setError('加载失败，该错题可能已被删除')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveMastery = async () => {
    if (!question) return
    try {
      setSaving(true)
      setSaveMessage('')
      await updateWrongQuestion(question.id, { mastery_level: mastery })
      setSaveMessage('已保存')
      setTimeout(() => setSaveMessage(''), 2000)
    } catch (err: unknown) {
      console.error('保存失败:', err)
      setSaveMessage('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!question) return
    if (!confirm('确定要删除这道错题吗？')) return
    try {
      setDeleting(true)
      await deleteWrongQuestion(question.id)
      router.push('/wrong-questions')
    } catch (err: unknown) {
      console.error('删除失败:', err)
      alert('删除失败')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-sky border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">加载中...</p>
        </div>
      </div>
    )
  }

  if (error || !question) {
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
            <p className="text-text-secondary mb-4">{error || '未找到该错题'}</p>
            <Link href="/wrong-questions">
              <Button>返回错题列表</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const subjectColor = subjectColors[question.subject] || 'bg-gray-500'
  const subjectName = subjectLabels[question.subject] || question.subject

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
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <span className={`px-3 py-1 ${subjectColor} text-white text-sm rounded-full`}>
              {subjectName}
            </span>
            {question.chapter && (
              <span className="px-3 py-1 bg-gray-100 text-text-secondary text-sm rounded-full">
                {question.chapter}
              </span>
            )}
            {question.difficulty && (
              <span className="px-3 py-1 bg-gray-100 text-text-secondary text-sm rounded-full">
                难度：{question.difficulty === 'easy' ? '简单' : question.difficulty === 'hard' ? '困难' : '中等'}
              </span>
            )}
            <span className="text-xs text-text-light ml-auto">
              {new Date(question.created_at).toLocaleDateString('zh-CN')}
            </span>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-medium text-text-primary mb-4 whitespace-pre-wrap">
              {question.content}
            </h2>

            <div className="p-4 bg-green-50 border-2 border-green-500 rounded-xl mb-4">
              <span className="font-medium text-green-700">
                正确答案：{question.correct_answer}
              </span>
            </div>
          </div>

          {question.wrong_answer && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-text-primary mb-2">你的错误答案</h3>
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <span className="text-red-700">{question.wrong_answer}</span>
              </div>
            </div>
          )}

          {question.error_reason && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-text-primary mb-2">错误原因</h3>
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                <p className="text-text-secondary">{question.error_reason}</p>
              </div>
            </div>
          )}

          {question.analysis && (
            <div className="p-4 bg-sky-light rounded-xl mb-6">
              <h3 className="font-medium text-text-primary mb-2">解析</h3>
              <p className="text-text-secondary whitespace-pre-wrap">{question.analysis}</p>
            </div>
          )}

          {/* 掌握程度修改 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-text-primary mb-2">
              掌握程度
            </label>
            <div className="flex gap-2">
              <select
                value={mastery}
                onChange={(e) => setMastery(e.target.value)}
                className="flex-1 px-3 py-2 border border-border rounded-lg text-sm"
                disabled={saving}
              >
                {masteryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button
                onClick={handleSaveMastery}
                disabled={saving || mastery === question.mastery_level}
                className="gap-2"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                保存
              </Button>
            </div>
            {saveMessage && (
              <p className={`text-sm mt-2 ${saveMessage.includes('失败') ? 'text-error' : 'text-green-600'}`}>
                {saveMessage}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 gap-2 text-red-500 hover:text-red-500"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <span className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              删除
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}