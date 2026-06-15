'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, Button, Input, Select } from '@/components/ui'
import { Plus, Search, Lightbulb, TrendingUp, X, ArrowRight, ChevronRight, Trash2, Sparkles } from 'lucide-react'
import Link from 'next/link'
import {
  getKnowledgePoints,
  getWrongQuestions,
  addKnowledgePoint,
  deleteKnowledgePoint,
  type KnowledgePoint,
  type WrongQuestion,
} from '@/lib/database'
import { subjectLabels, subjectColors, masteryLabels, masteryColors, type Subject } from '@/lib/supabase'
import { debounce } from '@/lib/utils'

const subjectOptions = [
  { value: '', label: '全部学科' },
  { value: 'chinese', label: '语文' },
  { value: 'math', label: '数学' },
  { value: 'english', label: '英语' },
  { value: 'physics', label: '物理' },
  { value: 'chemistry', label: '化学' },
]

const newPointSubjectOptions = [
  { value: 'math', label: '数学' },
  { value: 'physics', label: '物理' },
  { value: 'english', label: '英语' },
  { value: 'chinese', label: '语文' },
  { value: 'chemistry', label: '化学' },
]

export default function KnowledgePage() {
  const [points, setPoints] = useState<KnowledgePoint[]>([])
  const [allQuestions, setAllQuestions] = useState<WrongQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [subject, setSubject] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null)
  const [newPoint, setNewPoint] = useState({ name: '', subject: 'math' as Subject, description: '' })
  const [saving, setSaving] = useState(false)

  const debouncedSearch = useCallback(
    (value: string) => debounce((v: string) => setSearch(v), 300)(value),
    []
  )

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    debouncedSearch(value)
  }

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [kp, qs] = await Promise.all([getKnowledgePoints(), getWrongQuestions()])
      setPoints(kp)
      setAllQuestions(qs)
    } catch (err) {
      console.error('加载知识点失败:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd() {
    if (!newPoint.name.trim()) {
      alert('请输入知识点名称')
      return
    }
    setSaving(true)
    try {
      await addKnowledgePoint({
        name: newPoint.name.trim(),
        subject: newPoint.subject,
        description: newPoint.description.trim() || undefined,
        mastery_level: 'unfamiliar',
      })
      setShowAddModal(false)
      setNewPoint({ name: '', subject: 'math', description: '' })
      await loadData()
    } catch (err) {
      console.error('添加知识点失败:', err)
      alert('添加失败，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确定要删除这个知识点吗？')) return
    try {
      await deleteKnowledgePoint(id)
      await loadData()
    } catch (err) {
      console.error('删除失败:', err)
    }
  }

  const filtered = points.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    const matchSubject = !subject || p.subject === (subject as Subject)
    return matchSearch && matchSubject
  })

  const selectedPoint = points.find((p) => p.id === selectedPointId) || null
  const linkedQuestions = selectedPointId
    ? allQuestions.filter((q) => q.knowledge_point_id === selectedPointId)
    : []

  function countForPoint(p: KnowledgePoint) {
    return allQuestions.filter((q) => q.knowledge_point_id === p.id).length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-sky border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">知识点管理</h1>
          <p className="text-text-secondary mt-1">共 {points.length} 个知识点</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          添加知识点
        </Button>
      </div>

      <Card>
        <div className="p-4 flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="搜索知识点..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-white text-text-primary placeholder:text-text-light focus:border-sky focus:ring-2 focus:ring-sky/20 transition-all"
            />
          </div>
          <Select
            options={subjectOptions}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full lg:w-40"
          />
        </div>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((point) => {
          const count = countForPoint(point)
          const colorBg = subjectColors[point.subject] ?? 'bg-gray-500'
          return (
            <Card
              key={point.id}
              hover
              className="group cursor-pointer"
              onClick={() => setSelectedPointId(point.id)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className={`${colorBg} w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Lightbulb className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs text-text-light bg-gray-100 px-2 py-1 rounded-full">
                    {subjectLabels[point.subject]}
                  </span>
                </div>
                <h3 className="font-medium text-text-primary mt-3">{point.name}</h3>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-3.5 h-3.5 text-text-light" />
                  <span className="text-sm text-text-secondary">{count} 道错题</span>
                </div>
                {point.description && (
                  <p className="text-xs text-text-light mt-2 line-clamp-2">{point.description}</p>
                )}
                <div className="mt-2 text-xs text-text-light text-center pt-2 border-t border-border/50 flex items-center justify-center gap-1">
                  点击查看详情 <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {selectedPoint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPointId(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className={`${subjectColors[selectedPoint.subject] ?? 'bg-gray-500'} p-6 text-white flex-shrink-0`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lightbulb className="w-6 h-6" />
                  <div>
                    <h3 className="text-xl font-bold">{selectedPoint.name}</h3>
                    <p className="text-sm opacity-80">{subjectLabels[selectedPoint.subject]}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedPointId(null)} className="p-2 hover:bg-white/20 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {selectedPoint.description && (
                <p className="mt-2 text-sm opacity-90">{selectedPoint.description}</p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-text-primary">相关错题 ({linkedQuestions.length} 道)</h4>
                <Link href="/assessment">
                  <Button size="sm" className="gap-1">
                    开始评测 <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>

              <div className="space-y-2">
                {linkedQuestions.map((q) => (
                  <Link key={q.id} href={`/wrong-questions/${q.id}`} className="block">
                    <div className="p-3 rounded-xl border border-border hover:border-sky hover:bg-sky-light/30 transition-all flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary line-clamp-2">{q.content}</p>
                        <p className="text-xs text-text-light mt-1">答案: {q.correct_answer}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${masteryColors[q.mastery_level]}`}>
                          {masteryLabels[q.mastery_level]}
                        </span>
                        <ChevronRight className="w-4 h-4 text-text-light" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {linkedQuestions.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-text-secondary">暂无错题记录</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border flex-shrink-0 flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  handleDelete(selectedPoint.id)
                  setSelectedPointId(null)
                }}
                className="gap-1 text-error"
              >
                <Trash2 className="w-4 h-4" /> 删除
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setSelectedPointId(null)}>
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
              <Input
                label="知识点名称"
                placeholder="请输入知识点名称"
                value={newPoint.name}
                onChange={(e) => setNewPoint({ ...newPoint, name: e.target.value })}
              />
              <Select
                label="所属学科"
                options={newPointSubjectOptions}
                value={newPoint.subject}
                onChange={(e) => setNewPoint({ ...newPoint, subject: e.target.value as Subject })}
              />
              <Input
                label="描述（可选）"
                placeholder="简要描述该知识点"
                value={newPoint.description}
                onChange={(e) => setNewPoint({ ...newPoint, description: e.target.value })}
              />
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAddModal(false)}
                >
                  取消
                </Button>
                <Button className="flex-1" onClick={handleAdd} disabled={saving}>
                  {saving ? '保存中…' : '保存'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12">
          {search || subject ? (
            <>
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-text-light" />
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-2">没有找到相关知识点</h3>
              <p className="text-text-secondary mb-4">试试其他关键词，或清除筛选</p>
              <Button variant="outline" onClick={() => { setSearchInput(''); setSearch(''); setSubject(''); }}>
                清除筛选
              </Button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-gradient-to-br from-sky/20 to-sunset-warm/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-10 h-10 text-sky" />
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-2">还没有知识点</h3>
              <p className="text-text-secondary mb-6">添加第一个知识点开始整理</p>
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
