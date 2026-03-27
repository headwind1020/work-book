'use client'

import { useState, useEffect, useRef } from 'react'
import { Sparkles, Send, Bot, User, Trash2, Lightbulb, FileQuestion, BookOpen, ChevronDown } from 'lucide-react'
import { getWrongQuestions, getKnowledgePoints, DbWrongQuestion, DbKnowledgePoint } from '@/lib/database'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const systemPrompt = `你是智能错题簿的 AI 助手，专门帮助学生学习。你有以下能力：
1. 错题分析 - 分析学生的错题，提供详细的解题思路和错误原因分析
2. 学习建议 - 根据学生的错题历史和知识点掌握情况，提供个性化的学习建议
3. 知识答疑 - 回答学生在学习中遇到的问题

请用友好、专业的语气回答问题，尽可能提供详细和有用的信息。`

export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [wrongQuestions, setWrongQuestions] = useState<DbWrongQuestion[]>([])
  const [knowledgePoints, setKnowledgePoints] = useState<DbKnowledgePoint[]>([])
  const [showContextMenu, setShowContextMenu] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadContext()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadContext = async () => {
    try {
      const [questions, points] = await Promise.all([
        getWrongQuestions(),
        getKnowledgePoints(),
      ])
      setWrongQuestions(questions)
      setKnowledgePoints(points)
    } catch (error) {
      console.error('加载上下文失败:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const contextMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages.slice(-10).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user' as const, content: userMessage.content },
      ]

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: contextMessages }),
      })

      if (!response.ok) {
        throw new Error('AI 响应失败')
      }

      const data = await response.json()
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.choices?.[0]?.message?.content || '抱歉，我暂时无法回答这个问题。',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error: any) {
      console.error('发送消息失败:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error?.response?.data?.error || error.message || '抱歉，发生了错误，请稍后重试。',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAction = async (action: string) => {
    let prompt = ''

    switch (action) {
      case 'analyze-wrong':
        if (wrongQuestions.length === 0) {
          alert('暂无错题数据')
          return
        }
        prompt = `请分析我的错题情况。以下是我的错题列表：\n${wrongQuestions
          .slice(0, 5)
          .map((q, i) => `${i + 1}. ${q.content}\n正确答案: ${q.correct_answer}\n错误原因: ${q.error_reason || '无'}\n解析: ${q.analysis || '无'}`)
          .join('\n')}\n请分析我的薄弱环节并给出学习建议。`
        break
      case 'study-suggestion':
        if (knowledgePoints.length === 0) {
          alert('暂无知识点数据')
          return
        }
        prompt = `请根据我的知识点掌握情况给出学习建议。以下是我的知识点列表：\n${knowledgePoints
          .map((p, i) => `${i + 1}. ${p.name} - ${p.subject} - 掌握程度: ${p.mastery_level}`)
          .join('\n')}\n请分析我的知识盲点并给出针对性的学习计划。`
        break
      case 'ask-question':
        prompt = '我有一道数学题不会做，请问你能帮我解答吗？'
        break
    }

    setInput(prompt)
  }

  const clearChat = () => {
    if (confirm('确定要清空对话记录吗？')) {
      setMessages([])
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-sky to-sunset-warm rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">AI 智能体</h1>
            <p className="text-text-secondary text-sm">与 AI 讨论问题，获取学习帮助</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-2 px-3 py-2 text-text-secondary hover:text-error hover:bg-error/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            清空对话
          </button>
        )}
      </div>

      {/* 快捷操作 */}
      {messages.length === 0 && (
        <div className="bg-white rounded-2xl border border-border p-4 mb-4">
          <p className="text-sm text-text-secondary mb-3">快捷操作：</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleQuickAction('analyze-wrong')}
              className="flex items-center gap-2 px-3 py-2 bg-sky/10 text-sky rounded-lg hover:bg-sky/20 transition-colors"
            >
              <FileQuestion className="w-4 h-4" />
              分析错题
            </button>
            <button
              onClick={() => handleQuickAction('study-suggestion')}
              className="flex items-center gap-2 px-3 py-2 bg-sunset-warm/10 text-sunset-warm rounded-lg hover:bg-sunset-warm/20 transition-colors"
            >
              <Lightbulb className="w-4 h-4" />
              学习建议
            </button>
            <button
              onClick={() => handleQuickAction('ask-question')}
              className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
            >
              <Bot className="w-4 h-4" />
              提问问题
            </button>
          </div>
        </div>
      )}

      {/* 聊天区域 */}
      <div className="flex-1 bg-white rounded-2xl border border-border overflow-hidden flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Bot className="w-16 h-16 text-text-secondary/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">你好，我是 AI 助手</h3>
              <p className="text-text-secondary text-sm max-w-sm">
                可以帮你分析错题、解答问题、制定学习计划。试试上面的快捷操作或直接提问吧！
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user'
                      ? 'bg-sky text-white'
                      : 'bg-gradient-to-br from-sky to-sunset-warm text-white'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div
                  className={`max-w-[70%] ${
                    message.role === 'user' ? 'text-right' : ''
                  }`}
                >
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-sky text-white'
                        : 'bg-sky/5 text-text-primary'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <p className="text-xs text-text-secondary mt-1">
                    {message.timestamp.toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky to-sunset-warm flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="px-4 py-3 bg-sky/5 rounded-2xl">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-sky rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-sky rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-sky rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* 输入区域 */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="输入你的问题..."
                className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky/20 focus:border-sky pr-12"
                disabled={loading}
              />
              <button
                onClick={() => setShowContextMenu(!showContextMenu)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-sky-light rounded-lg"
              >
                <ChevronDown className={`w-4 h-4 text-text-secondary transition-transform ${showContextMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* 上下文菜单 */}
              {showContextMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-xl border border-border shadow-lg p-2">
                  <p className="text-xs text-text-secondary px-2 py-1">上下文信息</p>
                  <div className="text-sm">
                    <p className="px-2 py-1 text-text-secondary">
                      错题数量: {wrongQuestions.length}
                    </p>
                    <p className="px-2 py-1 text-text-secondary">
                      知识点数量: {knowledgePoints.length}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="px-4 py-3 bg-sky text-white rounded-xl hover:bg-sky-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
