'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, Button, Input } from '@/components/ui'
import { Plus, Search, Lightbulb, TrendingUp, X, ArrowRight, ChevronRight, BookOpen, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { debounce } from '@/lib/utils'

// 知识点数据
const knowledgePoints = [
  { id: '1', subject: '数学', name: '二次函数', count: 15, color: 'bg-blue-500', description: '二次函数的概念、图像和性质' },
  { id: '2', subject: '数学', name: '一元二次方程', count: 12, color: 'bg-blue-500', description: '一元二次方程的解法和判别式' },
  { id: '3', subject: '物理', name: '动能定理', count: 8, color: 'bg-teal-500', description: '动能和动能定理的应用' },
  { id: '4', subject: '物理', name: '自由落体', count: 7, color: 'bg-teal-500', description: '自由落体运动的规律' },
  { id: '5', subject: '英语', name: '从句语法', count: 7, color: 'bg-purple-500', description: '定语从句、状语从句等' },
  { id: '6', subject: '英语', name: '时态', count: 6, color: 'bg-purple-500', description: '一般现在时、完成时等时态' },
  { id: '7', subject: '化学', name: '化学方程式', count: 6, color: 'bg-yellow-500', description: '化学方程式的书写和配平' },
  { id: '8', subject: '化学', name: '氧化还原', count: 5, color: 'bg-yellow-500', description: '氧化还原反应的概念' },
  { id: '9', subject: '语文', name: '文言文', count: 4, color: 'bg-red-500', description: '文言文阅读和翻译' },
  { id: '10', subject: '语文', name: '诗词鉴赏', count: 3, color: 'bg-red-500', description: '古诗词鉴赏方法和技巧' },
]

// 知识点对应的错题
const knowledgePointQuestions: Record<string, {
  id: string
  content: string
  mastery: 'unfamiliar' | 'normal' | 'mastered'
  correctAnswer: string
  createdAt: string
}[]> = {
  '1': [
    { id: '1-1', content: '已知二次函数 y = ax² + bx + c 的图像经过点 (1, 2)、(2, 3)、(3, 6)，求 a、b、c 的值。', mastery: 'unfamiliar', correctAnswer: 'a=1, b=-2, c=3', createdAt: '2024-01-15' },
    { id: '1-2', content: '二次函数 y = x² - 4x + 3 的顶点坐标是？', mastery: 'unfamiliar', correctAnswer: '(2, -1)', createdAt: '2024-01-14' },
    { id: '1-3', content: '若二次函数 y = ax² + bx + c 的图像开口向下，则 a 的取值范围是？', mastery: 'unfamiliar', correctAnswer: 'a < 0', createdAt: '2024-01-13' },
    { id: '1-4', content: '将二次函数 y = x² 向上平移 3 个单位，解析式变为？', mastery: 'normal', correctAnswer: 'y = x² + 3', createdAt: '2024-01-12' },
    { id: '1-5', content: '二次函数 y = x² - 9 与 x 轴有几个交点？', mastery: 'normal', correctAnswer: '2个', createdAt: '2024-01-11' },
    { id: '1-6', content: '求二次函数 y = 2x² + 4x + 1 的对称轴', mastery: 'normal', correctAnswer: 'x = -1', createdAt: '2024-01-10' },
    { id: '1-7', content: '已知二次函数最大值是 3，则其解析式可能是？', mastery: 'normal', correctAnswer: 'y = -x² + 3', createdAt: '2024-01-09' },
    { id: '1-8', content: '二次函数图像与 y 轴的交点是？', mastery: 'normal', correctAnswer: '(0, c)', createdAt: '2024-01-08' },
    { id: '1-9', content: '当 a > 0 时，二次函数图像开口向哪里？', mastery: 'mastered', correctAnswer: '向上', createdAt: '2024-01-07' },
    { id: '1-10', content: '二次函数 y = (x-1)² 的顶点坐标是？', mastery: 'mastered', correctAnswer: '(1, 0)', createdAt: '2024-01-06' },
    { id: '1-11', content: '判断：二次函数的图像一定是抛物线', mastery: 'mastered', correctAnswer: '正确', createdAt: '2024-01-05' },
    { id: '1-12', content: '二次函数 y = x² + 1 的最小值是？', mastery: 'mastered', correctAnswer: '1', createdAt: '2024-01-04' },
    { id: '1-13', content: '比较大小：y = 2x² 与 y = x² 在 x = 1 时的函数值', mastery: 'normal', correctAnswer: 'y = 2x² > y = x²', createdAt: '2024-01-03' },
    { id: '1-14', content: '已知抛物线经过原点，且对称轴是 x = 2，则解析式为？', mastery: 'normal', correctAnswer: 'y = a(x-2)²', createdAt: '2024-01-02' },
    { id: '1-15', content: '二次函数 y = -x² + 4x - 3 的最大值是？', mastery: 'normal', correctAnswer: '1', createdAt: '2024-01-01' },
  ],
  '2': [
    { id: '2-1', content: '解方程：x² - 5x + 6 = 0', mastery: 'unfamiliar', correctAnswer: 'x = 2 或 x = 3', createdAt: '2024-01-15' },
    { id: '2-2', content: '一元二次方程 x² = 4 的解是？', mastery: 'unfamiliar', correctAnswer: 'x = ±2', createdAt: '2024-01-14' },
    { id: '2-3', content: '用配方法解：x² + 4x + 3 = 0', mastery: 'unfamiliar', correctAnswer: 'x = -1 或 x = -3', createdAt: '2024-01-13' },
    { id: '2-4', content: '方程 x² - 3x + 2 = 0 的判别式 Δ = ？', mastery: 'normal', correctAnswer: '1', createdAt: '2024-01-12' },
    { id: '2-5', content: '若方程 x² + bx + 4 = 0 有两个相等实根，则 b = ？', mastery: 'normal', correctAnswer: 'b = ±4', createdAt: '2024-01-11' },
    { id: '2-6', content: '求根公式中根号内的表达式叫？', mastery: 'normal', correctAnswer: '判别式', createdAt: '2024-01-10' },
    { id: '2-7', content: '一元二次方程的一般形式是？', mastery: 'mastered', correctAnswer: 'ax² + bx + c = 0', createdAt: '2024-01-09' },
    { id: '2-8', content: '因式分解法解：x² - 9 = 0', mastery: 'mastered', correctAnswer: 'x = 3 或 x = -3', createdAt: '2024-01-08' },
    { id: '2-9', content: '韦达定理：若方程 ax² + bx + c = 0 的两根为 x1, x2，则 x1 + x2 = ？', mastery: 'normal', correctAnswer: '-b/a', createdAt: '2024-01-07' },
    { id: '2-10', content: '方程 ax² + bx + c = 0 有实根的条件是？', mastery: 'normal', correctAnswer: 'Δ ≥ 0', createdAt: '2024-01-06' },
    { id: '2-11', content: '直接开平方法适用于哪种形式的方程？', mastery: 'mastered', correctAnswer: '(x+a)² = b', createdAt: '2024-01-05' },
    { id: '2-12', content: '求作一个一元二次方程，使两根为 2 和 3', mastery: 'normal', correctAnswer: 'x² - 5x + 6 = 0', createdAt: '2024-01-04' },
  ],
  '3': [
    { id: '3-1', content: '动能定理的表达式是？', mastery: 'unfamiliar', correctAnswer: 'E_k = ½mv²', createdAt: '2024-01-15' },
    { id: '3-2', content: '质量为 2kg 的物体以 3m/s 的速度运动，其动能为多少焦耳？', mastery: 'unfamiliar', correctAnswer: '9J', createdAt: '2024-01-14' },
    { id: '3-3', content: '根据动能定理，合外力对物体做的功等于？', mastery: 'normal', correctAnswer: '动能的变化', createdAt: '2024-01-13' },
    { id: '3-4', content: '物体的速度增大时，其动能一定增大吗？', mastery: 'normal', correctAnswer: '不一定', createdAt: '2024-01-12' },
    { id: '3-5', content: '一人用水平力 F 推物体前进距离 s，则做功为？', mastery: 'normal', correctAnswer: 'Fs', createdAt: '2024-01-11' },
    { id: '3-6', content: '动能的国际单位是？', mastery: 'mastered', correctAnswer: '焦耳(J)', createdAt: '2024-01-10' },
    { id: '3-7', content: '质量减半，速度加倍，动能如何变化？', mastery: 'mastered', correctAnswer: '不变', createdAt: '2024-01-09' },
    { id: '3-8', content: '动能与速度的关系是？', mastery: 'mastered', correctAnswer: '正比于速度的平方', createdAt: '2024-01-08' },
  ],
  '5': [
    { id: '5-1', content: 'This is the book ___ I bought yesterday.', mastery: 'unfamiliar', correctAnswer: 'which', createdAt: '2024-01-15' },
    { id: '5-2', content: 'He is the student ___ scored highest in the exam.', mastery: 'unfamiliar', correctAnswer: 'who', createdAt: '2024-01-14' },
    { id: '5-3', content: 'The reason ___ he was absent is that he was ill.', mastery: 'normal', correctAnswer: 'why', createdAt: '2024-01-13' },
    { id: '5-4', content: 'I will never forget the day ___ I met you.', mastery: 'normal', correctAnswer: 'when', createdAt: '2024-01-12' },
    { id: '5-5', content: 'that 可以引导非限制性定语从句吗？', mastery: 'normal', correctAnswer: '不可以', createdAt: '2024-01-11' },
    { id: '5-6', content: 'This is the room ___ I live.', mastery: 'normal', correctAnswer: 'where', createdAt: '2024-01-10' },
    { id: '5-7', content: '定语从句中 which 和 that 的区别是？', mastery: 'mastered', correctAnswer: 'which可引导非限制性，that不可', createdAt: '2024-01-09' },
  ],
}

const subjectColors: Record<string, string> = {
  '数学': 'bg-blue-500',
  '物理': 'bg-teal-500',
  '英语': 'bg-purple-500',
  '化学': 'bg-yellow-500',
  '语文': 'bg-red-500',
}

export default function KnowledgePage() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null)

  // 防抖搜索
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearch(value)
    }, 300),
    []
  )

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    debouncedSearch(value)
  }

  const filteredPoints = knowledgePoints.filter((point) =>
    point.name.toLowerCase().includes(search.toLowerCase())
  )

  const getSelectedPoint = () => {
    return knowledgePoints.find(p => p.id === selectedPointId)
  }

  const getQuestionsForPoint = () => {
    if (!selectedPointId) return []
    return knowledgePointQuestions[selectedPointId] || []
  }

  const getMasteryColor = (level: string) => {
    const colors: Record<string, string> = {
      unfamiliar: 'bg-red-100 text-red-600',
      normal: 'bg-yellow-100 text-yellow-600',
      mastered: 'bg-green-100 text-green-600',
    }
    return colors[level] || ''
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
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="搜索知识点..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-white text-text-primary placeholder:text-text-light focus:border-sky focus:ring-2 focus:ring-sky/20 transition-all"
            />
          </div>
        </div>
      </Card>

      {/* 知识点卡片网格 */}
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
              <div className="mt-2 text-xs text-text-light text-center pt-2 border-t border-border/50 flex items-center justify-center gap-1">
                点击查看详情 <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 知识点详情弹窗 */}
      {selectedPointId && getSelectedPoint() && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPointId(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* 头部 */}
            <div className={`${getSelectedPoint()?.color} p-6 text-white flex-shrink-0`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lightbulb className="w-6 h-6" />
                  <div>
                    <h3 className="text-xl font-bold">{getSelectedPoint()?.name}</h3>
                    <p className="text-sm opacity-80">{getSelectedPoint()?.subject}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedPointId(null)} className="p-2 hover:bg-white/20 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-2 text-sm opacity-90">{getSelectedPoint()?.description}</p>
            </div>

            {/* 错题列表 */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-text-primary">相关错题 ({getQuestionsForPoint().length} 道)</h4>
                <Link href="/assessment">
                  <Button size="sm" className="gap-1">
                    开始评测 <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>

              <div className="space-y-2">
                {getQuestionsForPoint().map((q) => (
                  <Link
                    key={q.id}
                    href={`/wrong-questions/${q.id}`}
                    className="block"
                  >
                    <div className="p-3 rounded-xl border border-border hover:border-sky hover:bg-sky-light/30 transition-all flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary line-clamp-2">{q.content}</p>
                        <p className="text-xs text-text-light mt-1">答案: {q.correctAnswer}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getMasteryColor(q.mastery)}`}>
                          {getMasteryLabel(q.mastery)}
                        </span>
                        <ChevronRight className="w-4 h-4 text-text-light" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {getQuestionsForPoint().length === 0 && (
                <div className="text-center py-8">
                  <p className="text-text-secondary">暂无错题记录</p>
                </div>
              )}
            </div>

            {/* 底部 */}
            <div className="p-4 border-t border-border flex-shrink-0">
              <Button variant="outline" className="w-full" onClick={() => setSelectedPointId(null)}>
                关闭
              </Button>
            </div>
          </div>
        </div>
      )}

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
                  variant="outline"
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
          {search ? (
            <>
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-text-light" />
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-2">没有找到相关知识点</h3>
              <p className="text-text-secondary mb-4">试试其他关键词，或清除搜索</p>
              <Button variant="outline" onClick={() => { setSearchInput(''); setSearch(''); }}>
                清除搜索
              </Button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-gradient-to-br from-sky/20 to-sunset-warm/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-10 h-10 text-sky" />
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-2">还没有知识点</h3>
              <p className="text-text-secondary mb-6">从添加错题开始，系统会自动为您整理知识点</p>
              <Link href="/wrong-questions/new">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  添加第一道错题
                </Button>
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  )
}
