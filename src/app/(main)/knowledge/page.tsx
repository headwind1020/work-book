'use client'

import { useState } from 'react'
import { Card, CardContent, Button, Input } from '@/components/ui'
import { Plus, Search, Lightbulb, TrendingUp, X } from 'lucide-react'

const knowledgePoints = [
  { id: '1', subject: '数学', name: '二次函数', count: 15, color: 'bg-blue-500' },
  { id: '2', subject: '数学', name: '一元二次方程', count: 12, color: 'bg-blue-500' },
  { id: '3', subject: '物理', name: '动能定理', count: 8, color: 'bg-teal-500' },
  { id: '4', subject: '物理', name: '自由落体', count: 7, color: 'bg-teal-500' },
  { id: '5', subject: '英语', name: '从句语法', count: 7, color: 'bg-purple-500' },
  { id: '6', subject: '英语', name: '时态', count: 6, color: 'bg-purple-500' },
  { id: '7', subject: '化学', name: '化学方程式', count: 6, color: 'bg-yellow-500' },
  { id: '8', subject: '化学', name: '氧化还原', count: 5, color: 'bg-yellow-500' },
  { id: '9', subject: '语文', name: '文言文', count: 4, color: 'bg-red-500' },
  { id: '10', subject: '语文', name: '诗词鉴赏', count: 3, color: 'bg-red-500' },
]

export default function KnowledgePage() {
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  const filteredPoints = knowledgePoints.filter((point) =>
    point.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 页面头部 */}
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

      {/* 搜索 */}
      <Card>
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索知识点..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-white text-text-primary placeholder:text-text-light focus:border-sky focus:ring-2 focus:ring-sky/20 transition-all"
            />
          </div>
        </div>
      </Card>

      {/* 知识点卡片网格 */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredPoints.map((point) => (
          <Card key={point.id} hover className="group">
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className={`${point.color} w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Lightbulb className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-text-light bg-gray-100 px-2 py-1 rounded-full">
                  {point.subject}
                </span>
              </div>
              <h3 className="font-medium text-text-primary mt-3">{point.name}</h3>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-3.5 h-3.5 text-text-light" />
                <span className="text-sm text-text-secondary">{point.count} 道错题</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 添加知识点弹窗 */}
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
              <Input label="知识点名称" placeholder="请输入知识点名称" />
              <Input label="所属学科" placeholder="如：数学、物理" />
              <Input label="描述（可选）" placeholder="简要描述该知识点" />
              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowAddModal(false)}
                >
                  取消
                </Button>
                <Button className="flex-1">
                  保存
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 空状态 */}
      {filteredPoints.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-sky-light rounded-full flex items-center justify-center mx-auto mb-4">
            <Lightbulb className="w-8 h-8 text-sky" />
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-2">没有找到知识点</h3>
          <p className="text-text-secondary">添加一个新的知识点吧</p>
        </div>
      )}
    </div>
  )
}
