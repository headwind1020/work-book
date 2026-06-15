'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, Button, Input } from '@/components/ui'
import { useAppStore } from '@/store'
import {
  AssessmentQuestion,
  subjectLabels,
  subjectColors,
  MasteryLevel,
  type KnowledgePoint,
} from '@/lib/supabase'
import {
  Brain,
  Target,
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Home,
  Sparkles,
  Trophy,
  Zap,
  Loader2,
} from 'lucide-react'
import {
  getKnowledgePoints,
  getAssessmentRecords,
  addAssessmentRecord,
  updateWrongQuestion,
  type AssessmentRecord,
} from '@/lib/database'

function getMasteryColor(level: MasteryLevel): string {
  switch (level) {
    case 'mastered': return 'bg-green-500'
    case 'normal': return 'bg-yellow-500'
    case 'unfamiliar': return 'bg-red-500'
  }
}

function getMasteryLabel(level: MasteryLevel): string {
  switch (level) {
    case 'mastered': return '已掌握'
    case 'normal': return '一般'
    case 'unfamiliar': return '不熟悉'
  }
}

interface KpWithStats {
  id: string
  subject: KnowledgePoint['subject']
  name: string
  totalQuestions: number
  correctCount: number
  masteryLevel: MasteryLevel
}

export default function AssessmentPage() {
  const [view, setView] = useState<'select' | 'testing' | 'result'>('select')
  const [knowledgeList, setKnowledgeList] = useState<KpWithStats[]>([])
  const [selectedKp, setSelectedKp] = useState<KpWithStats | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([])
  const [answers, setAnswers] = useState<{ questionId: string; answer: string; isCorrect: boolean }[]>([])
  const [loading, setLoading] = useState(true)

  const { startAssessment, submitAnswer, nextQuestion, endAssessment } = useAppStore()

  useEffect(() => {
    loadKnowledge()
  }, [])

  async function loadKnowledge() {
    try {
      setLoading(true)
      const [points, records] = await Promise.all([
        getKnowledgePoints(),
        getAssessmentRecords(),
      ])
      const list: KpWithStats[] = points.map((p) => {
        const linked = records.filter((r) => r.knowledge_point_id === p.id)
        const total = Math.max(linked.length, 0)
        const correctCount = linked.filter((r) => r.is_correct).length
        const rate = total > 0 ? correctCount / total : 0
        const level: MasteryLevel = rate >= 0.8 ? 'mastered' : rate >= 0.5 ? 'normal' : 'unfamiliar'
        return {
          id: p.id,
          subject: p.subject,
          name: p.name,
          totalQuestions: total,
          correctCount,
          masteryLevel: level,
        }
      })
      setKnowledgeList(list)
    } catch (err) {
      console.error('加载知识点评测数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  function generateQuestions(kp: KpWithStats): AssessmentQuestion[] {
    // 根据知识点动态生成 5 道题（占位题库，待接入 AI 智能出题）
    const templates: Omit<AssessmentQuestion, 'id' | 'subject' | 'knowledgePoint'>[] = [
      { type: 'choice', content: `关于"${kp.name}"，下列说法正确的是？`, options: ['选项 A（正确）', '选项 B', '选项 C', '选项 D'], correct_answer: '选项 A（正确）', explanation: '此题为占位题，建议接入 AI 智能出题后获得真实题库。', difficulty: 'medium' },
      { type: 'fill', content: `请补全与"${kp.name}"相关的关键概念：______ 是核心要素。`, correct_answer: '该知识点', explanation: '此题为占位题。', difficulty: 'easy' },
      { type: 'judge', content: `"${kp.name}"是本学科的重要基础。`, correct_answer: '正确', explanation: '此题为占位题。', difficulty: 'easy' },
      { type: 'choice', content: `以下哪个场景最适合应用"${kp.name}"？`, options: ['实际应用 A', '理论推导 B', '计算题 C', '记忆题 D'], correct_answer: '实际应用 A', explanation: '此题为占位题。', difficulty: 'medium' },
      { type: 'fill', content: `请简述"${kp.name}"的核心公式或方法（用一句话回答）。`, correct_answer: '结合题意', explanation: '此题为占位题。', difficulty: 'hard' },
    ]
    return templates.map((t, i) => ({
      ...t,
      id: `${kp.id}-q${i + 1}`,
      subject: kp.subject,
      knowledgePoint: kp.name,
    }))
  }

  function handleStart(kp: KpWithStats) {
    setSelectedKp(kp)
    const qs = generateQuestions(kp)
    setQuestions(qs)
    setAnswers([])
    setCurrentQuestionIndex(0)
    setUserAnswer('')
    setShowResult(false)
    setIsCorrect(null)
    startAssessment(qs, kp.id)
    setView('testing')
  }

  async function handleSubmit() {
    if (!userAnswer.trim() || !selectedKp) return

    const q = questions[currentQuestionIndex]
    const correct = userAnswer.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()

    setIsCorrect(correct)
    setShowResult(true)
    submitAnswer(q.id, userAnswer)
    setAnswers((prev) => [...prev, { questionId: q.id, answer: userAnswer, isCorrect: correct }])

    // 持久化评测记录
    try {
      const record: Omit<AssessmentRecord, 'id' | 'answered_at' | 'user_id'> = {
        knowledge_point_id: selectedKp.id,
        question_id: q.id,
        user_answer: userAnswer,
        is_correct: correct,
      }
      await addAssessmentRecord(record)
      // 提升对应错题的掌握程度
      if (q.id.includes('-q') === false) {
        await updateWrongQuestion(q.id, {
          mastery_level: correct ? 'mastered' : 'unfamiliar',
        }).catch(() => {})
      }
    } catch (err) {
      console.error('保存评测记录失败:', err)
    }
  }

  function handleNext() {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((i) => i + 1)
      setUserAnswer('')
      setShowResult(false)
      setIsCorrect(null)
      nextQuestion()
    } else {
      setView('result')
    }
  }

  function handleRestart() {
    if (selectedKp) handleStart(selectedKp)
  }

  function handleBackToSelect() {
    endAssessment()
    setView('select')
    setSelectedKp(null)
    setQuestions([])
    setAnswers([])
    loadKnowledge()
  }

  function getScore() {
    return answers.filter((a) => a.isCorrect).length
  }

  function getNewMasteryLevel(): MasteryLevel {
    const score = getScore()
    const rate = score / questions.length
    if (rate >= 0.8) return 'mastered'
    if (rate >= 0.5) return 'normal'
    return 'unfamiliar'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-sky animate-spin" />
      </div>
    )
  }

  if (view === 'select') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Brain className="w-7 h-7 text-sky" />
            智能评测
          </h1>
          <p className="text-text-secondary mt-1">选择知识点开始评测，动态掌握你的掌握程度</p>
        </div>

        {knowledgeList.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Sparkles className="w-12 h-12 text-text-light mx-auto mb-4" />
              <h3 className="font-medium text-text-primary mb-2">还没有知识点</h3>
              <p className="text-text-secondary text-sm">先去添加几个知识点，再开始评测吧</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {knowledgeList.map((kp) => (
              <Card key={kp.id} hover className="cursor-pointer group" onClick={() => handleStart(kp)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className={`${subjectColors[kp.subject]} w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${getMasteryColor(kp.masteryLevel)}`}>
                      {getMasteryLabel(kp.masteryLevel)}
                    </span>
                  </div>
                  <h3 className="font-medium text-text-primary mt-3">{kp.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getMasteryColor(kp.masteryLevel)}`}
                        style={{ width: `${kp.totalQuestions > 0 ? (kp.correctCount / kp.totalQuestions) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-text-light">{kp.correctCount}/{kp.totalQuestions}</span>
                  </div>
                  <p className="text-xs text-text-light mt-2">
                    {subjectLabels[kp.subject]} · {kp.totalQuestions} 次评测
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (view === 'testing') {
    const currentQuestion = questions[currentQuestionIndex]
    if (!currentQuestion) return null

    return (
      <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBackToSelect}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            退出评测
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">
              第 {currentQuestionIndex + 1} / {questions.length} 题
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {questions.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 flex-1 rounded-full ${
                idx < currentQuestionIndex
                  ? answers[idx]?.isCorrect
                    ? 'bg-green-500'
                    : 'bg-red-500'
                  : idx === currentQuestionIndex
                    ? 'bg-sky'
                    : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${subjectColors[currentQuestion.subject]}`}>
                {subjectLabels[currentQuestion.subject]}
              </span>
              <span className="text-xs text-text-light">{currentQuestion.knowledgePoint}</span>
            </div>

            <h2 className="text-lg font-medium text-text-primary mb-6">
              {currentQuestion.content}
            </h2>

            {currentQuestion.type === 'choice' && currentQuestion.options && (
              <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => (
                  <button
                    key={idx}
                    disabled={showResult}
                    onClick={() => !showResult && setUserAnswer(option)}
                    className={`w-full p-4 rounded-xl text-left transition-all ${
                      showResult
                        ? option === currentQuestion.correct_answer
                          ? 'bg-green-100 border-2 border-green-500 text-green-700'
                          : userAnswer === option
                            ? 'bg-red-100 border-2 border-red-500 text-red-700'
                            : 'bg-gray-50 border border-gray-200'
                        : userAnswer === option
                          ? 'bg-sky/10 border-2 border-sky text-sky'
                          : 'bg-white border border-gray-200 hover:border-sky/50'
                    }`}
                  >
                    <span className="font-medium">{option}</span>
                  </button>
                ))}
              </div>
            )}

            {currentQuestion.type === 'fill' && (
              <Input
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="请输入你的答案"
                disabled={showResult}
                className="text-lg"
              />
            )}

            {currentQuestion.type === 'judge' && (
              <div className="flex gap-4">
                {['正确', '错误'].map((option) => (
                  <button
                    key={option}
                    disabled={showResult}
                    onClick={() => !showResult && setUserAnswer(option)}
                    className={`flex-1 p-4 rounded-xl text-center transition-all ${
                      showResult
                        ? option === currentQuestion.correct_answer
                          ? 'bg-green-100 border-2 border-green-500 text-green-700'
                          : userAnswer === option
                            ? 'bg-red-100 border-2 border-red-500 text-red-700'
                            : 'bg-gray-50 border border-gray-200'
                        : userAnswer === option
                          ? 'bg-sky/10 border-2 border-sky text-sky'
                          : 'bg-white border border-gray-200 hover:border-sky/50'
                    }`}
                  >
                    <span className="font-medium">{option}</span>
                  </button>
                ))}
              </div>
            )}

            {showResult && (
              <div className={`mt-6 p-4 rounded-xl ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className={`font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                    {isCorrect ? '回答正确！' : '回答错误'}
                  </span>
                </div>
                <p className="text-sm text-text-secondary">
                  正确答案：{currentQuestion.correct_answer}
                </p>
                {currentQuestion.explanation && (
                  <p className="text-sm text-text-secondary mt-2">
                    解析：{currentQuestion.explanation}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              {!showResult ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!userAnswer.trim()}
                  className="flex-1"
                >
                  提交答案
                </Button>
              ) : (
                <Button onClick={handleNext} className="flex-1 gap-2">
                  {currentQuestionIndex < questions.length - 1 ? (
                    <>下一题 <ArrowRight className="w-4 h-4" /></>
                  ) : (
                    <>查看结果</>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (view === 'result') {
    const score = getScore()
    const rate = Math.round((score / questions.length) * 100)
    const newMastery = getNewMasteryLevel()

    return (
      <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${
              rate >= 80 ? 'bg-green-100' : rate >= 50 ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              <Trophy className={`w-10 h-10 ${
                rate >= 80 ? 'text-green-500' : rate >= 50 ? 'text-yellow-500' : 'text-red-500'
              }`} />
            </div>

            <h2 className="text-2xl font-bold text-text-primary mb-2">
              评测完成！
            </h2>
            <p className="text-text-secondary mb-6">
              {selectedKp?.name} 知识点评测结果
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-3xl font-bold text-sky">{score}</p>
                <p className="text-sm text-text-secondary">正确题数</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-3xl font-bold text-sky">{questions.length - score}</p>
                <p className="text-sm text-text-secondary">错误题数</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-3xl font-bold text-sky">{rate}%</p>
                <p className="text-sm text-text-secondary">正确率</p>
              </div>
            </div>

            <div className={`p-4 rounded-xl mb-6 border-2 ${getMasteryColor(newMastery).replace('bg-', 'border-')}`}>
              <div className="flex items-center justify-center gap-2">
                <Zap className={`w-5 h-5 ${getMasteryColor(newMastery).replace('bg-', 'text-')}`} />
                <span className={`font-medium ${getMasteryColor(newMastery).replace('bg-', 'text-')}`}>
                  知识点掌握程度：{getMasteryLabel(newMastery)}
                </span>
              </div>
              <p className="text-sm text-text-secondary mt-2">
                {newMastery === 'mastered'
                  ? '太棒了！这个知识点你已经完全掌握！'
                  : newMastery === 'normal'
                    ? '不错！继续努力，达到更高掌握程度！'
                    : '需要加强练习，建议重新复习该知识点'}
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleRestart} className="flex-1 gap-2">
                <RotateCcw className="w-4 h-4" />
                重新评测
              </Button>
              <Button onClick={handleBackToSelect} className="flex-1 gap-2">
                <Home className="w-4 h-4" />
                返回首页
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium text-text-primary mb-4">答题详情</h3>
            <div className="space-y-3">
              {answers.map((answer, idx) => {
                const question = questions.find((q) => q.id === answer.questionId)
                return (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      answer.isCorrect ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {answer.isCorrect ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary truncate">{question?.content}</p>
                      <p className="text-xs text-text-light mt-0.5">
                        你的答案：{answer.answer} · 正确答案：{question?.correct_answer}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
