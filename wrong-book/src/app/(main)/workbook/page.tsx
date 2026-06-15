'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FolderOpen, Plus, BookOpen, Clock, Trash2 } from 'lucide-react'
import { getWorkbooks, deleteWorkbook, DbWorkbook } from '@/lib/database'

const subjectMap: Record<string, string> = {
  chinese: '语文',
  math: '数学',
  english: '英语',
  physics: '物理',
  chemistry: '化学',
}

export default function WorkbookPage() {
  const [workbooks, setWorkbooks] = useState<DbWorkbook[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWorkbooks()
  }, [])

  const loadWorkbooks = async () => {
    try {
      const data = await getWorkbooks()
      setWorkbooks(data)
    } catch (error) {
      console.error('加载练习册失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个练习册吗？')) {
      try {
        await deleteWorkbook(id)
        setWorkbooks(workbooks.filter(w => w.id !== id))
      } catch (error) {
        console.error('删除练习册失败:', error)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-sky to-sunset-warm rounded-xl flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">练习册</h1>
            <p className="text-text-secondary text-sm">管理你的练习册，从中选择题目练习</p>
          </div>
        </div>
        <Link
          href="/workbook/new"
          className="flex items-center gap-2 px-4 py-2 bg-sky text-white rounded-xl hover:bg-sky-dark transition-colors"
        >
          <Plus className="w-5 h-5" />
          新建练习册
        </Link>
      </div>

      {workbooks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-border">
          <FolderOpen className="w-16 h-16 text-text-secondary/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">暂无练习册</h3>
          <p className="text-text-secondary mb-6">创建你的第一个练习册，开始有针对性地练习</p>
          <Link
            href="/workbook/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-sky text-white rounded-xl hover:bg-sky-dark transition-colors"
          >
            <Plus className="w-5 h-5" />
            创建练习册
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workbooks.map((workbook) => (
            <div
              key={workbook.id}
              className="bg-white rounded-2xl border border-border p-5 hover:border-sky/30 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-sky/10 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-sky" />
                </div>
                <button
                  onClick={() => handleDelete(workbook.id)}
                  className="p-2 text-text-secondary hover:text-error hover:bg-error/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="font-semibold text-text-primary mb-2 line-clamp-1">
                {workbook.name}
              </h3>

              {workbook.description && (
                <p className="text-text-secondary text-sm mb-4 line-clamp-2">
                  {workbook.description}
                </p>
              )}

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  {workbook.subject && (
                    <span className="px-2 py-1 bg-sky/10 text-sky rounded-lg text-xs font-medium">
                      {subjectMap[workbook.subject] || workbook.subject}
                    </span>
                  )}
                  <span className="text-text-secondary flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {workbook.question_count} 题
                  </span>
                </div>
                <span className="text-text-secondary flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {new Date(workbook.created_at).toLocaleDateString('zh-CN')}
                </span>
              </div>

              <Link
                href={`/workbook/${workbook.id}`}
                className="mt-4 block w-full text-center py-2.5 bg-sky/5 text-sky rounded-xl hover:bg-sky/10 transition-colors font-medium"
              >
                进入练习
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
