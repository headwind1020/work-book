'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, Button } from '@/components/ui'
import { ArrowLeft, Trash2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  getWrongQuestionById,
  updateWrongQuestion,
  deleteWrongQuestion,
  type WrongQuestion,
} from '@/lib/database'
import {
  subjectLabels,
  masteryLabels,
  masteryColors,
  type MasteryLevel,
} from '@/lib/supabase'

const masteryOptions: { value: MasteryLevel; label: string; color: string }[] = [
  { value: 'unfamiliar', label: '不熟悉', color: 'text-red-500' },
  { value: 'normal', label: '一般', color: 'text-yellow-500' },
  { value: 'mastered', label: '已掌握', color: 'text-green-500' },
]

export default function WrongQuestionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [question, setQuestion] = useState<WrongQuestion | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mastery, setMastery] = useState<MasteryLevel>('unfamiliar')

  useEffect(() => {
    if (!id) return
    loadQuestion()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function loadQuestion() {
    try {
      setLoading(true)
      const data = await getWrongQuestionById(id)
      setQuestion(data)
      if (data) setMastery(data.mastery_level)
    } catch (err) {
      console.error('加载错题失败:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleMasteryChange(level: MasteryLevel) {
    setMastery(level)
    try {
      setSaving(true)
      await updateWrongQuestion(id, { mastery_level: level })
    } catch (err) {
      console.error('更新掌握程度失败:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('确定要删除这道错题吗？')) return
    try {
      await deleteWrongQuestion(id)
      router.push('/wrong-questions')
    } catch (err) {
      console.error('删除失败:', err)
      alert('删除失败')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-sky animate-spin" />
      </div>
    )
  }

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

  const subjectName = subjectLabels[question.subject] ?? question.subject

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
            <span className="px-3 py-1 bg-sky text-white text-sm rounded-full">
              {subjectName}
            </span>
            {question.chapter && (
              <span className="px-3 py-1 bg-gray-100 text-text-secondary text-sm rounded-full">
                {question.chapter}
              </span>
            )}
            <span className={`px-3 py-1 text-sm rounded-full ${masteryColors[question.mastery_level]}`}>
              {masteryLabels[question.mastery_level]}
            </span>
            <span className="text-xs text-text-light ml-auto">
              {new Date(question.created_at).toLocaleString('zh-CN')}
            </span>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-medium text-text-primary mb-4 whitespace-pre-wrap">
              {question.content}
            </h2>

            {question.content_image_url && (
              <div className="mb-4">
                <img
                  src={question.content_image_url}
                  alt="题目配图"
                  className="max-h-96 rounded-lg border border-border"
                />
              </div>
            )}

            {question.wrong_answer && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-3">
                <p className="text-sm text-red-600 font-medium mb-1">我的答案</p>
                <p className="text-text-primary">{question.wrong_answer}</p>
              </div>
            )}

            <div className="p-4 bg-green-50 border-2 border-green-500 rounded-xl">
              <p className="text-sm text-green-600 font-medium mb-1">正确答案</p>
              <p className="text-text-primary">{question.correct_answer}</p>
            </div>

            {question.error_reason && (
              <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                <p className="text-sm text-orange-600 font-medium mb-1">错误原因</p>
                <p className="text-text-primary">{question.error_reason}</p>
              </div>
            )}
          </div>

          {question.analysis && (
            <div className="p-4 bg-sky-light rounded-xl mb-6">
              <h3 className="font-medium text-text-primary mb-2">解析</h3>
              <p className="text-text-secondary whitespace-pre-wrap">{question.analysis}</p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-text-primary mb-2">
              掌握程度 {saving && <span className="text-xs text-text-light">保存中…</span>}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {masteryOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleMasteryChange(option.value)}
                  className={`px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                    mastery === option.value
                      ? `border-sky bg-sky/5 ${option.color} font-medium`
                      : 'border-border text-text-secondary hover:border-sky/50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full gap-2 text-red-500 hover:text-red-500"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4" />
            删除错题
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
