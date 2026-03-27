'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BookOpen, Plus, Trash2, Check, X, FileQuestion } from 'lucide-react'
import {
  getWorkbookById,
  getWorkbookQuestions,
  getWrongQuestions,
  addQuestionToWorkbook,
  removeQuestionFromWorkbook,
  updateWorkbook,
  DbWorkbook,
  DbWrongQuestion,
  DbWorkbookQuestion
} from '@/lib/database'
import { useParams } from 'next/navigation'

const subjectMap: Record<string, string> = {
  chinese: '语文',
  math: '数学',
  english: '英语',
  physics: '物理',
  chemistry: '化学',
}

const difficultyMap: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
}

const masteryMap: Record<string, string> = {
  unfamiliar: '不熟悉',
  normal: '一般',
  mastered: '已掌握',
}

export default function WorkbookDetailPage() {
  const router = useRouter()
  const params = useParams()
  const workbookId = params.id as string
  const [workbook, setWorkbook] = useState<DbWorkbook | null>(null)
  const [workbookQuestions, setWorkbookQuestions] = useState<DbWorkbookQuestion[]>([])
  const [allQuestions, setAllQuestions] = useState<DbWrongQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState('')

  useEffect(() => {
    if (workbookId) {
      loadData()
    }
  }, [workbookId])

  const loadData = async () => {
    try {
      const [workbookData, questionsData, allQuestionsData] = await Promise.all([
        getWorkbookById(workbookId),
        getWorkbookQuestions(workbookId),
        getWrongQuestions(),
      ])
      setWorkbook(workbookData)
      setWorkbookQuestions(questionsData)
      setAllQuestions(allQuestionsData)
      setName(workbookData.name)
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddQuestion = async (questionId: string) => {
    try {
      await addQuestionToWorkbook(workbookId, questionId)
      await loadData()
      setShowAddModal(false)
    } catch (error) {
      console.error('添加题目失败:', error)
    }
  }

  const handleRemoveQuestion = async (questionId: string) => {
    if (confirm('确定要从练习册中移除这道题吗？')) {
      try {
        await removeQuestionFromWorkbook(workbookId, questionId)
        await loadData()
      } catch (error) {
        console.error('移除题目失败:', error)
      }
    }
  }

  const handleUpdateName = async () => {
    if (!name.trim() || name === workbook?.name) {
      setEditingName(false)
      return
    }
    try {
      await updateWorkbook(workbookId, { name: name.trim() })
      setWorkbook({ ...workbook!, name: name.trim() })
      setEditingName(false)
    } catch (error) {
      console.error('更新名称失败:', error)
    }
  }

  // 获取不在练习册中的题目
  const availableQuestions = allQuestions.filter(
    (q) => !workbookQuestions.find((wq) => wq.question_id === q.id)
  )

  // 获取练习册中的题目详情
  const includedQuestions = allQuestions.filter((q) =>
    workbookQuestions.find((wq) => wq.question_id === q.id)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky"></div>
      </div>
    )
  }

  if (!workbook) {
    return (
      <div className="text-center py-16">
        <p className="text-text-secondary">练习册不存在</p>
        <button
          onClick={() => router.push('/workbook')}
          className="mt-4 text-sky hover:underline"
        >
          返回练习册列表
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push('/workbook')}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="w-5 h-5" />
        返回练习册
      </button>

      {/* 练习册信息 */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-sky to-sunset-warm rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-2xl font-bold text-text-primary border-b-2 border-sky focus:outline-none"
                    autoFocus
                    onBlur={handleUpdateName}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
                  />
                  <button onClick={handleUpdateName} className="text-sky">
                    <Check className="w-5 h-5" />
                  </button>
                  <button onClick={() => { setName(workbook.name); setEditingName(false) }} className="text-text-secondary">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <h1
                  className="text-2xl font-bold text-text-primary cursor-pointer hover:text-sky"
                  onClick={() => setEditingName(true)}
                >
                  {workbook.name}
                </h1>
              )}
              <div className="flex items-center gap-3 mt-2">
                {workbook.subject && (
                  <span className="px-2 py-1 bg-sky/10 text-sky rounded-lg text-sm font-medium">
                    {subjectMap[workbook.subject] || workbook.subject}
                  </span>
                )}
                <span className="text-text-secondary text-sm">
                  {workbook.question_count} 道题目
                </span>
                {workbook.description && (
                  <span className="text-text-secondary text-sm">
                    {workbook.description}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-sky text-white rounded-xl hover:bg-sky-dark transition-colors"
          >
            <Plus className="w-5 h-5" />
            添加题目
          </button>
        </div>
      </div>

      {/* 题目列表 */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">题目列表</h2>

        {includedQuestions.length === 0 ? (
          <div className="text-center py-12">
            <FileQuestion className="w-12 h-12 text-text-secondary/30 mx-auto mb-3" />
            <p className="text-text-secondary">练习册中还没有题目</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-3 text-sky hover:underline"
            >
              添加题目
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {includedQuestions.map((question) => (
              <div
                key={question.id}
                className="flex items-start justify-between p-4 bg-sky/5 rounded-xl"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary font-medium line-clamp-2">
                    {question.content}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="px-2 py-0.5 bg-sky/10 text-sky rounded text-xs">
                      {subjectMap[question.subject] || question.subject}
                    </span>
                    {question.difficulty && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                        {difficultyMap[question.difficulty] || question.difficulty}
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
                      {masteryMap[question.mastery_level] || question.mastery_level}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveQuestion(question.id)}
                  className="p-2 text-text-secondary hover:text-error hover:bg-error/10 rounded-lg ml-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 添加题目弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold">添加题目</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-sky-light rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {availableQuestions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-text-secondary">所有错题都已添加到练习册</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableQuestions.map((question) => (
                    <div
                      key={question.id}
                      className="flex items-center justify-between p-3 border border-border rounded-xl hover:border-sky/30"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-text-primary line-clamp-2">{question.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 bg-sky/10 text-sky rounded text-xs">
                            {subjectMap[question.subject] || question.subject}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddQuestion(question.id)}
                        className="p-2 text-sky hover:bg-sky/10 rounded-lg ml-2"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
