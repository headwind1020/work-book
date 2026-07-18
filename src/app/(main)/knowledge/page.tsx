'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, Button, Input } from '@/components/ui'
import { Plus, Search, Lightbulb, TrendingUp, X, ArrowRight, ChevronRight, Sparkles, Save } from 'lucide-react'
import Link from 'next/link'
import { debounce } from '@/lib/utils'
import {
  getKnowledgePoints,
  addKnowledgePoint,
  getWrongQuestions,
  DbKnowledgePoint,
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

const masteryLabels: Record<string, string> = {
  unfamiliar: '不熟悉',
  normal: '一般',
  mastered: '已掌握',
}

const masteryColors: Record<string, string> = {
  unfamiliar: 'bg-red-100 text-red-600',
  normal: 'bg-yellow-100 text-yellow-600',
  mastered: 'bg-green-100 text-green-600',
}

const subjectOptions = [
  { value: 'math', label: '数学' },
  { value: 'physics', label: '物理' },
  { value: 'english', label: '英语' },
  { value: 'chinese', label: '语文' },
  { value: 'chemistry', label: '化学' },
]

export default function KnowledgePage() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null)

  const [knowledgePoints, setKnowledgePoints] = useState<DbKnowledgePoint[]>([])
  const [allQuestions, setAllQuestions] = useState<DbWrongQuestion[]>([])
  const [loading, setLoading] = useState(true)

  // 添加表单状态
  const [newName, setNewName] = useState('')
  const [newSubject, setNewSubject] = useState('math')
  const [newDescription, setNewDescription] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [points, questions] = await Promise.all([
        getKnowledgePoints(),
        getWrongQuestions(),
      ])
      setKnowledgePoints(points)
      setAllQuestions(questions)
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const debouncedSearch = useCallback(
    (value: string) => {
      const handler = debounce((v: string) => {
        setSearch(v)
      }, 300)
      handler(value)
    },
    []
  )

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    debouncedSearch(value)
  }

  // 按知识点聚合错题数量
  const countByKnowledge = (pointId: string) => {
    return allQuestions.filter((q) => q.knowledge_point_id === pointId).length
  }

  const filteredPoints = knowledgePoints.filter((point) =>
    point.name.toLowerCase().includes(search.toLowerCase())
  )

  const getSelectedPoint = () => {
    return knowledgePoints.find((p) => p.id === selectedPointId)
  }

  const getQuestionsForPoint = (pointId: string) => {
    return allQuestions.filter((q) => q.knowledge_point_id === pointId)
  }

  const handleAddKnowledge = async () => {
    if (!newName.trim()) {
      setAddError('请输入知识点名称')
      return
    }
    try {
      setAdding(true)
      setAddError('')
      await addKnowledgePoint({
        name: newName.trim(),
        subject: newSubject,
        description: newDescription.trim(),
        user_id: '',
        mastery_level: 'unfamiliar',
      })
      await loadData()
      setShowAddModal(false)
      setNewName('')
      setNewDescription('')
      setNewSubject('math')
    } catch (err: unknown) {
      console.error('添加知识点失败:', err)
      const message = err instanceof Error ? err.message : '添加失败'
      setAddError(message)
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-sky border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">知识点管理</h1>
          <p className="text-text-secondary mt-1">共 {knowledgePoints.length} 个知识点</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          添加知识点
        </Button>
      </div>

      <Card>
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="搜索知识点..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-white text-text-primary placeholder:text-text-light focus:border-sky focus:ring-2 focus:ring-sky/20 transition-all"
            />
          </div>
        </div>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredPoints.map((point) => (
          <Card
            key={point.id}
            hover
            className="group cursor-pointer"
            onClick={() => setSelectedPointId(point.id)}
          >
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div
                  className={`${subjectColors[point.subject] || 'bg-gray-500'} w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0`}
                >
                  <Lightbulb className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-text-light bg-gray-100 px-2 py-1 rounded-full">
                  {subjectLabels[point.subject] || point.subject}
                </span>
              </div>
              <h3 className="font-medium text-text-primary mt-3">{point.name}</h3>
              {point.description && (
                <p className="text-xs text-text-secondary mt-1 line-clamp-2">{point.description}</p>
              )}
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-3.5 h-3.5 text-text-light" />
                <span className="text-sm text-text-secondary">
                  {countByKnowledge(point.id)} 道错题
                </span>
              </div>
              <div className="mt-2 text-xs text-text-light text-center pt-2 border-t border-border/50 flex items-center justify-center gap-1">
                点击查看详情 <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedPointId && getSelectedPoint() && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPointId(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`${subjectColors[getSelectedPoint()!.subject] || 'bg-gray-500'} p-6 text-white flex-shrink-0`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lightbulb className="w-6 h-6" />
                  <div>
                    <h3 className="text-xl font-bold">{getSelectedPoint()!.name}</h3>
                    <p className="text-sm opacity-80">
                      {subjectLabels[getSelectedPoint()!.subject] || getSelectedPoint()!.subject}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPointId(null)}
                  className="p-2 hover:bg-white/20 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {getSelectedPoint()!.description && (
                <p className="mt-2 text-sm opacity-90">{getSelectedPoint()!.description}</p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-text-primary">
                  相关错题 ({getQuestionsForPoint(selectedPointId).length} 道)
                </h4>
                <Link href="/assessment">
                  <Button size="sm" className="gap-1">
                    开始评测 <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>

              <div className="space-y-2">
                {getQuestionsForPoint(selectedPointId).map((q) => (
                  <Link
                    key={q.id}
                    href={`/wrong-questions/${q.id}`}
                    className="block"
                  >
                    <div className="p-3 rounded-xl border border-border hover:border-sky hover:bg-sky-light/30 transition-all flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary line-clamp-2">{q.content}</p>
                        <p className="text-xs text-text-light mt-1">
                          答案: {q.correct_answer}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${masteryColors[q.mastery_level] || ''}`}
                        >
                          {masteryLabels[q.mastery_level] || q.mastery_level}
                        </span>
                        <ChevronRight className="w-4 h-4 text-text-light" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {getQuestionsForPoint(selectedPointId).length === 0 && (
                <div className="text-center py-8">
                  <p className="text-text-secondary">暂无错题记录</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border flex-shrink-0">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSelectedPointId(null)}
              >
                关闭
              </Button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md animate-fade-in">
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <h2 className="font-semibold text-text-primary">添加知识点</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  知识点名称 <span className="text-error">*</span>
                </label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="请输入知识点名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  所属学科 <span className="text-error">*</span>
                </label>
                <select
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-text-primary focus:border-sky focus:ring-2 focus:ring-sky/20"
                >
                  {subjectOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  描述（可选）
                </label>
                <Input
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="简要描述该知识点"
                />
              </div>
              {addError && <p className="text-sm text-error">{addError}</p>}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAddModal(false)}
                  disabled={adding}
                >
                  取消
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handleAddKnowledge}
                  disabled={adding}
                >
                  {adding ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  保存
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {filteredPoints.length === 0 && (
        <div className="text-center py-12">
          {search ? (
            <>
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-text-light" />
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-2">没有找到相关知识点</h3>
              <p className="text-text-secondary mb-4">试试其他关键词，或清除搜索</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchInput('')
                  setSearch('')
                }}
              >
                清除搜索
              </Button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-gradient-to-br from-sky/20 to-sunset-warm/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-10 h-10 text-sky" />
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-2">还没有知识点</h3>
              <p className="text-text-secondary mb-6">点击上方按钮添加你的第一个知识点</p>
              <Button onClick={() => setShowAddModal(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                添加知识点
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}