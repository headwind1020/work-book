'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, Button, Input, Select } from '@/components/ui'
import { Plus, Search, ChevronRight, Trash2, Edit, Download, X, FileText, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { getWrongQuestions, deleteWrongQuestion, DbWrongQuestion } from '@/lib/database'
import { debounce } from '@/lib/utils'

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

export default function WrongQuestionsPage() {
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [subject, setSubject] = useState('')
  const [mastery, setMastery] = useState('')

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
  const [questions, setQuestions] = useState<DbWrongQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [downloadType, setDownloadType] = useState<'all' | 'subject' | 'mastery'>('all')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedMastery, setSelectedMastery] = useState('')

  // 从数据库加载错题
  useEffect(() => {
    loadQuestions()
  }, [])

  const loadQuestions = async () => {
    try {
      setLoading(true)
      const data = await getWrongQuestions()
      setQuestions(data)
    } catch (err: any) {
      console.error('加载错题失败:', err)
      // 如果未登录或出错，显示提示
      if (err.message === '未登录') {
        setError('请先登录')
      } else {
        setError('加载失败，请刷新页面')
      }
    } finally {
      setLoading(false)
    }
  }

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

  const getSubjectLabel = (key: string) => {
    const labels: Record<string, string> = {
      chinese: '语文',
      math: '数学',
      english: '英语',
      physics: '物理',
      chemistry: '化学',
    }
    return labels[key] || key
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

  // 筛选题目
  const filteredQuestions = questions.filter((q) => {
    const matchSearch = q.content.toLowerCase().includes(search.toLowerCase())
    const matchSubject = !subject || q.subject === subject
    const matchMastery = !mastery || q.mastery_level === mastery
    return matchSearch && matchSubject && matchMastery
  })

  // 获取要下载的题目
  const getQuestionsToDownload = () => {
    if (downloadType === 'all') {
      return filteredQuestions
    } else if (downloadType === 'subject') {
      return filteredQuestions.filter(q => q.subject === selectedSubject)
    } else if (downloadType === 'mastery') {
      return filteredQuestions.filter(q => q.mastery_level === selectedMastery)
    } else if (downloadType === 'subject-mastery') {
      return filteredQuestions.filter(q => q.subject === selectedSubject && q.mastery_level === selectedMastery)
    }
    return filteredQuestions
  }

  // 获取下载标题
  const getDownloadTitle = () => {
    if (downloadType === 'all') return '全部错题'
    if (downloadType === 'subject') return `${getSubjectLabel(selectedSubject)}错题`
    if (downloadType === 'mastery') return `"${getMasteryLabel(selectedMastery)}"错题`
    if (downloadType === 'subject-mastery') return `${getSubjectLabel(selectedSubject)} - ${getMasteryLabel(selectedMastery)}错题`
    return ''
  }

  // 下载为文本文件
  const downloadAsText = () => {
    const questionsToDownload = getQuestionsToDownload()
    if (questionsToDownload.length === 0) {
      alert('没有可下载的题目！')
      return
    }

    let content = `错题下载 - ${new Date().toLocaleDateString()}\n`
    content += `======================================\n\n`

    questionsToDownload.forEach((q, index) => {
      content += `${index + 1}. [${getSubjectLabel(q.subject)}] ${q.chapter || '无章节'}\n`
      content += `   题目: ${q.content}\n`
      content += `   正确答案: ${q.correct_answer}\n`
      content += `   解析: ${q.analysis || '无'}\n`
      content += `   掌握程度: ${getMasteryLabel(q.mastery_level)}\n`
      content += `   日期: ${new Date(q.created_at).toLocaleDateString()}\n`
      content += `\n--------------------------------------\n\n`
    })

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `错题本_${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
    setShowDownloadModal(false)
    setShowDownloadMenu(false)
    alert(`成功下载 ${questionsToDownload.length} 道错题！`)
  }

  // 打印
  const handlePrint = () => {
    const questionsToDownload = getQuestionsToDownload()
    if (questionsToDownload.length === 0) {
      alert('没有可打印的题目！')
      return
    }

    const printContent = `
      <html>
      <head>
        <title>错题打印</title>
        <style>
          body { font-family: 'SimSun', serif; padding: 20px; }
          h1 { text-align: center; color: #333; }
          .question { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; }
          .subject { color: #666; font-size: 12px; }
          .answer { color: #e74c3c; margin-top: 10px; }
          .explanation { color: #666; margin-top: 5px; font-size: 14px; }
        </style>
      </head>
      <body>
        <h1>错题本 - ${new Date().toLocaleDateString()}</h1>
        ${questionsToDownload.map((q, index) => `
          <div class="question">
            <div class="subject">[${getSubjectLabel(q.subject)}] ${q.chapter || ''} - ${getMasteryLabel(q.mastery_level)}</div>
            <div><strong>${index + 1}.</strong> ${q.content}</div>
            <div class="answer">正确答案: ${q.correct_answer}</div>
            <div class="explanation">解析: ${q.analysis || '无'}</div>
          </div>
        `).join('')}
      </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
    setShowDownloadModal(false)
    setShowDownloadMenu(false)
  }

  // 处理删除 - 带防抖防止重复点击
  const handleDelete = useCallback(
    debounce(async (id: string) => {
      if (!confirm('确定要删除这道错题吗？')) return
      try {
        await deleteWrongQuestion(id)
        setQuestions(questions.filter(q => q.id !== id))
        alert('删除成功')
      } catch (err) {
        console.error('删除失败:', err)
        alert('删除失败')
      }
    }, 500),
    [questions]
  )

  // 加载中
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

  // 未登录
  if (error === '请先登录') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-12">
          <p className="text-text-secondary mb-4">请先登录后再查看错题</p>
          <Link href="/login">
            <Button>去登录</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 页面头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">错题管理</h1>
          <p className="text-text-secondary mt-1">共 {questions.length} 道错题</p>
        </div>
        <div className="flex gap-2">
          {/* 下载按钮 */}
          <div className="relative">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
            >
              <Download className="w-4 h-4" />
              下载
            </Button>
            {/* 下载菜单 */}
            {showDownloadMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-border z-10">
                <button
                  onClick={() => {
                    setDownloadType('all')
                    setSelectedSubject('')
                    setSelectedMastery('')
                    setShowDownloadModal(true)
                    setShowDownloadMenu(false)
                  }}
                  className="w-full px-4 py-2.5 text-left hover:bg-sky-light flex items-center gap-2 rounded-t-xl"
                >
                  <FileText className="w-4 h-4" />
                  全部错题
                </button>
                <div className="border-t border-border">
                  <div className="px-4 py-2 text-xs text-text-light">按学科+掌握程度</div>
                  {/* 数学 */}
                  <div className="relative group">
                    <button className="w-full px-4 py-2 text-left hover:bg-sky-light flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      数学
                      <span className="ml-auto text-xs text-text-light">▶</span>
                    </button>
                    <div className="absolute left-full top-0 ml-1 w-36 bg-white rounded-xl shadow-lg border border-border hidden group-hover:block">
                      <button onClick={() => { setDownloadType('subject-mastery'); setSelectedSubject('math'); setSelectedMastery('unfamiliar'); setShowDownloadModal(true); setShowDownloadMenu(false); }} className="w-full px-3 py-2 text-left hover:bg-sky-light text-sm">不熟悉</button>
                      <button onClick={() => { setDownloadType('subject-mastery'); setSelectedSubject('math'); setSelectedMastery('normal'); setShowDownloadModal(true); setShowDownloadMenu(false); }} className="w-full px-3 py-2 text-left hover:bg-sky-light text-sm">一般</button>
                      <button onClick={() => { setDownloadType('subject-mastery'); setSelectedSubject('math'); setSelectedMastery('mastered'); setShowDownloadModal(true); setShowDownloadMenu(false); }} className="w-full px-3 py-2 text-left hover:bg-sky-light text-sm">已掌握</button>
                    </div>
                  </div>
                  {/* 物理 */}
                  <div className="relative group">
                    <button className="w-full px-4 py-2 text-left hover:bg-sky-light flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                      物理
                      <span className="ml-auto text-xs text-text-light">▶</span>
                    </button>
                    <div className="absolute left-full top-0 ml-1 w-36 bg-white rounded-xl shadow-lg border border-border hidden group-hover:block">
                      <button onClick={() => { setDownloadType('subject-mastery'); setSelectedSubject('physics'); setSelectedMastery('unfamiliar'); setShowDownloadModal(true); setShowDownloadMenu(false); }} className="w-full px-3 py-2 text-left hover:bg-sky-light text-sm">不熟悉</button>
                      <button onClick={() => { setDownloadType('subject-mastery'); setSelectedSubject('physics'); setSelectedMastery('normal'); setShowDownloadModal(true); setShowDownloadMenu(false); }} className="w-full px-3 py-2 text-left hover:bg-sky-light text-sm">一般</button>
                      <button onClick={() => { setDownloadType('subject-mastery'); setSelectedSubject('physics'); setSelectedMastery('mastered'); setShowDownloadModal(true); setShowDownloadMenu(false); }} className="w-full px-3 py-2 text-left hover:bg-sky-light text-sm">已掌握</button>
                    </div>
                  </div>
                  {/* 英语 */}
                  <div className="relative group">
                    <button className="w-full px-4 py-2 text-left hover:bg-sky-light flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      英语
                      <span className="ml-auto text-xs text-text-light">▶</span>
                    </button>
                    <div className="absolute left-full top-0 ml-1 w-36 bg-white rounded-xl shadow-lg border border-border hidden group-hover:block">
                      <button onClick={() => { setDownloadType('subject-mastery'); setSelectedSubject('english'); setSelectedMastery('unfamiliar'); setShowDownloadModal(true); setShowDownloadMenu(false); }} className="w-full px-3 py-2 text-left hover:bg-sky-light text-sm">不熟悉</button>
                      <button onClick={() => { setDownloadType('subject-mastery'); setSelectedSubject('english'); setSelectedMastery('normal'); setShowDownloadModal(true); setShowDownloadMenu(false); }} className="w-full px-3 py-2 text-left hover:bg-sky-light text-sm">一般</button>
                      <button onClick={() => { setDownloadType('subject-mastery'); setSelectedSubject('english'); setSelectedMastery('mastered'); setShowDownloadModal(true); setShowDownloadMenu(false); }} className="w-full px-3 py-2 text-left hover:bg-sky-light text-sm">已掌握</button>
                    </div>
                  </div>
                  {/* 化学 */}
                  <div className="relative group">
                    <button className="w-full px-4 py-2 text-left hover:bg-sky-light flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                      化学
                      <span className="ml-auto text-xs text-text-light">▶</span>
                    </button>
                    <div className="absolute left-full top-0 ml-1 w-36 bg-white rounded-xl shadow-lg border border-border hidden group-hover:block">
                      <button onClick={() => { setDownloadType('subject-mastery'); setSelectedSubject('chemistry'); setSelectedMastery('unfamiliar'); setShowDownloadModal(true); setShowDownloadMenu(false); }} className="w-full px-3 py-2 text-left hover:bg-sky-light text-sm">不熟悉</button>
                      <button onClick={() => { setDownloadType('subject-mastery'); setSelectedSubject('chemistry'); setSelectedMastery('normal'); setShowDownloadModal(true); setShowDownloadMenu(false); }} className="w-full px-3 py-2 text-left hover:bg-sky-light text-sm">一般</button>
                      <button onClick={() => { setDownloadType('subject-mastery'); setSelectedSubject('chemistry'); setSelectedMastery('mastered'); setShowDownloadModal(true); setShowDownloadMenu(false); }} className="w-full px-3 py-2 text-left hover:bg-sky-light text-sm">已掌握</button>
                    </div>
                  </div>
                  {/* 语文 */}
                  <div className="relative group">
                    <button className="w-full px-4 py-2 text-left hover:bg-sky-light flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      语文
                      <span className="ml-auto text-xs text-text-light">▶</span>
                    </button>
                    <div className="absolute left-full top-0 ml-1 w-36 bg-white rounded-xl shadow-lg border border-border hidden group-hover:block">
                      <button onClick={() => { setDownloadType('subject-mastery'); setSelectedSubject('chinese'); setSelectedMastery('unfamiliar'); setShowDownloadModal(true); setShowDownloadMenu(false); }} className="w-full px-3 py-2 text-left hover:bg-sky-light text-sm">不熟悉</button>
                      <button onClick={() => { setDownloadType('subject-mastery'); setSelectedSubject('chinese'); setSelectedMastery('normal'); setShowDownloadModal(true); setShowDownloadMenu(false); }} className="w-full px-3 py-2 text-left hover:bg-sky-light text-sm">一般</button>
                      <button onClick={() => { setDownloadType('subject-mastery'); setSelectedSubject('chinese'); setSelectedMastery('mastered'); setShowDownloadModal(true); setShowDownloadMenu(false); }} className="w-full px-3 py-2 text-left hover:bg-sky-light text-sm">已掌握</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <Link href="/wrong-questions/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              新增错题
            </Button>
          </Link>
        </div>
      </div>

      {/* 筛选区域 */}
      <Card>
        <div className="p-4 flex flex-col lg:flex-row gap-4">
          {/* 搜索 */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
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
        {filteredQuestions.map((question) => (
          <Card key={question.id} hover className="group">
            <Link href={`/wrong-questions/${question.id}`}>
              <div className="p-4 flex items-start gap-4">
                {/* 学科标签 */}
                <div className={`${getSubjectColor(question.subject)} w-12 h-12 rounded-xl flex items-center justify-center text-white font-medium flex-shrink-0`}>
                  {getSubjectLabel(question.subject)}
                </div>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary line-clamp-2">{question.content}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-text-light">{question.chapter || '无章节'}</span>
                    <span className="text-xs text-text-light">•</span>
                    <span className="text-xs text-text-light">{new Date(question.created_at).toLocaleDateString()}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getMasteryColor(question.mastery_level)}`}>
                      {getMasteryLabel(question.mastery_level)}
                    </span>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="p-2 rounded-lg hover:bg-red-50 text-text-secondary hover:text-error transition-colors"
                    onClick={(e) => {
                      e.preventDefault()
                      handleDelete(question.id)
                    }}
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
      {filteredQuestions.length === 0 && (
        <div className="text-center py-12">
          {questions.length === 0 ? (
            <>
              <div className="w-20 h-20 bg-gradient-to-br from-sky/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-10 h-10 text-sky" />
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-2">还没有错题</h3>
              <p className="text-text-secondary mb-6">将平时的错题记录在这里，系统会自动整理知识点</p>
              <Link href="/wrong-questions/new">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  添加第一道错题
                </Button>
              </Link>
            </>
          ) : search || subject || mastery ? (
            <>
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-text-light" />
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-2">没有找到匹配的错题</h3>
              <p className="text-text-secondary mb-4">试试调整筛选条件</p>
              <Button
                variant="outline"
                onClick={() => { setSearchInput(''); setSearch(''); setSubject(''); setMastery(''); }}
              >
                清除筛选条件
              </Button>
            </>
          ) : null}
        </div>
      )}

      {/* 下载确认弹窗 */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDownloadModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-text-primary">确认下载</h3>
              <button onClick={() => setShowDownloadModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <Download className="w-12 h-12 text-sky mx-auto mb-3" />
                <p className="text-text-primary font-medium">
                  确定要下载以下错题吗？
                </p>
                <p className="text-2xl font-bold text-sky mt-2">
                  {getQuestionsToDownload().length} 道
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-text-secondary">
                  {getDownloadTitle()}
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowDownloadModal(false)}>
                  取消
                </Button>
                <Button className="flex-1 gap-2" onClick={downloadAsText}>
                  <Download className="w-4 h-4" />
                  下载文本
                </Button>
              </div>
              <Button
                variant="outline"
                className="w-full mt-2 gap-2"
                onClick={handlePrint}
              >
                打印 / 生成PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
