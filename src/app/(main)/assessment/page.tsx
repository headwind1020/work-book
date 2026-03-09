'use client'

import { useState } from 'react'
import { Card, CardContent, Button, Input } from '@/components/ui'
import { useAppStore } from '@/store'
import { AssessmentQuestion, subjectLabels, subjectColors, MasteryLevel } from '@/lib/supabase'
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
  Zap
} from 'lucide-react'

const mockKnowledgePoints = [
  { id: '1', subject: 'math', name: '二次函数', totalQuestions: 15, correctCount: 8, masteryLevel: 'normal' as MasteryLevel },
  { id: '2', subject: 'math', name: '一元二次方程', totalQuestions: 12, correctCount: 10, masteryLevel: 'mastered' as MasteryLevel },
  { id: '3', subject: 'physics', name: '动能定理', totalQuestions: 8, correctCount: 2, masteryLevel: 'unfamiliar' as MasteryLevel },
  { id: '4', subject: 'physics', name: '自由落体', totalQuestions: 7, correctCount: 5, masteryLevel: 'normal' as MasteryLevel },
  { id: '5', subject: 'english', name: '从句语法', totalQuestions: 7, correctCount: 1, masteryLevel: 'unfamiliar' as MasteryLevel },
  { id: '6', subject: 'english', name: '时态', totalQuestions: 6, correctCount: 4, masteryLevel: 'normal' as MasteryLevel },
  { id: '7', subject: 'chemistry', name: '化学方程式', totalQuestions: 6, correctCount: 6, masteryLevel: 'mastered' as MasteryLevel },
  { id: '8', subject: 'chinese', name: '文言文', totalQuestions: 4, correctCount: 0, masteryLevel: 'unfamiliar' as MasteryLevel },
]

const generateQuestions = (knowledgePointId: string, _subject: string): AssessmentQuestion[] => {
  const questionBanks: Record<string, AssessmentQuestion[]> = {
    '1': [
      { id: 'q1', type: 'choice', content: '二次函数 y = x² - 4x + 3 的顶点坐标是？', options: ['(2, -1)', '(2, 1)', '(-2, -1)', '(-2, 1)'], correct_answer: '(2, -1)', explanation: '利用顶点公式 x = -b/2a = 4/2 = 2，代入得 y = 4 - 8 + 3 = -1', knowledgePoint: '二次函数', subject: 'math', difficulty: 'medium' },
      { id: 'q2', type: 'fill', content: '二次函数 y = 2x² + 4x + 1 的对称轴是？', correct_answer: 'x = -1', explanation: '对称轴 x = -b/2a = -4/4 = -1', knowledgePoint: '二次函数', subject: 'math', difficulty: 'easy' },
      { id: 'q3', type: 'choice', content: '若二次函数 y = ax² + bx + c 的图像开口向下，则 a 的取值范围是？', options: ['a > 0', 'a < 0', 'a = 0', 'a ≠ 0'], correct_answer: 'a < 0', explanation: '开口向下说明二次项系数 a < 0', knowledgePoint: '二次函数', subject: 'math', difficulty: 'easy' },
      { id: 'q4', type: 'judge', content: '二次函数 y = x² - 9 与 x 轴有两个交点。', correct_answer: '正确', explanation: '判别式 Δ = 0 - 4×1×(-9) = 36 > 0，有两个交点', knowledgePoint: '二次函数', subject: 'math', difficulty: 'medium' },
      { id: 'q5', type: 'choice', content: '将二次函数 y = x² 向上平移 3 个单位，解析式变为？', options: ['y = x² + 3', 'y = x² - 3', 'y = (x+3)²', 'y = (x-3)²'], correct_answer: 'y = x² + 3', explanation: '向上平移加，下移减', knowledgePoint: '二次函数', subject: 'math', difficulty: 'easy' },
    ],
    '3': [
      { id: 'q6', type: 'choice', content: '动能定理的表达式是？', options: ['E_k = mv', 'E_k = mv²', 'E_k = ½mv²', 'E_k = ½m²v'], correct_answer: 'E_k = ½mv²', explanation: '动能的定义式为 E_k = ½mv²', knowledgePoint: '动能定理', subject: 'physics', difficulty: 'easy' },
      { id: 'q7', type: 'fill', content: '质量为 2kg 的物体以 3m/s 的速度运动，其动能为多少焦耳？', correct_answer: '9', explanation: 'E_k = ½×2×3² = 9J', knowledgePoint: '动能定理', subject: 'physics', difficulty: 'easy' },
      { id: 'q8', type: 'choice', content: '根据动能定理，合外力对物体做的功等于？', options: ['动量的变化', '动能的变化', '势能的变化', '机械能的变化'], correct_answer: '动能的变化', explanation: '动能定理：合外力做功等于物体动能变化量', knowledgePoint: '动能定理', subject: 'physics', difficulty: 'medium' },
      { id: 'q9', type: 'judge', content: '物体的速度增大时，其动能一定增大。', correct_answer: '错误', explanation: '动能与速度方向无关，只与速度大小有关，但速度方向改变时动能不变', knowledgePoint: '动能定理', subject: 'physics', difficulty: 'medium' },
      { id: 'q10', type: 'choice', content: '一人用水平力 F 推物体前进距离 s，则做功为？', options: ['Fs', '-Fs', '0', '2Fs'], correct_answer: 'Fs', explanation: '功 W = F·s（力与位移方向相同）', knowledgePoint: '动能定理', subject: 'physics', difficulty: 'easy' },
    ],
    '5': [
      { id: 'q11', type: 'choice', content: 'This is the book ___ I bought yesterday.', options: ['who', 'which', 'whose', 'whom'], correct_answer: 'which', explanation: '先行词是 book（物），用 which 引导定语从句', knowledgePoint: '从句语法', subject: 'english', difficulty: 'easy' },
      { id: 'q12', type: 'choice', content: 'He is the student ___ scored highest in the exam.', options: ['who', 'which', 'that', 'whom'], correct_answer: 'who', explanation: '先行词是 student（人），用 who 引导定语从句', knowledgePoint: '从句语法', subject: 'english', difficulty: 'easy' },
      { id: 'q13', type: 'fill', content: 'The reason ___ he was absent is that he was ill.', correct_answer: 'why', explanation: 'reason 后用 why 引导定语从句', knowledgePoint: '从句语法', subject: 'english', difficulty: 'medium' },
      { id: 'q14', type: 'choice', content: 'I will never forget the day ___ I met you.', options: ['when', 'where', 'which', 'that'], correct_answer: 'when', explanation: '先行词是 day（时间），用 when 引导定语从句', knowledgePoint: '从句语法', subject: 'english', difficulty: 'medium' },
      { id: 'q15', type: 'judge', content: 'that 可以引导非限制性定语从句。', correct_answer: '错误', explanation: 'that 不能引导非限制性定语从句', knowledgePoint: '从句语法', subject: 'english', difficulty: 'hard' },
    ],
    '8': [
      { id: 'q16', type: 'fill', content: '《论语》是___家的经典著作。', correct_answer: '儒', explanation: '《论语》是儒家经典，记录孔子及其弟子言行', knowledgePoint: '文言文', subject: 'chinese', difficulty: 'easy' },
      { id: 'q17', type: 'choice', content: '下列加点字解释正确的是"学而时习之，不亦说乎"', options: ['说：说话', '说：愉快', '说：学说', '说：说明'], correct_answer: '说：愉快', explanation: '"说"通"悦"，愉快的意思', knowledgePoint: '文言文', subject: 'chinese', difficulty: 'easy' },
      { id: 'q18', type: 'choice', content: '"知之者不如好之者，好之者不如乐之者"中"乐"的意思是？', options: ['快乐', '以...为乐', '音乐', '愉快'], correct_answer: '以...为乐', explanation: '意为以学习为乐趣', knowledgePoint: '文言文', subject: 'chinese', difficulty: 'medium' },
      { id: 'q19', type: 'fill', content: '三人行，必有我师焉。出自《论语》中的《___》篇。', correct_answer: '述而', explanation: '出自《论语·述而》', knowledgePoint: '文言文', subject: 'chinese', difficulty: 'medium' },
      { id: 'q20', type: 'judge', content: '"温故而知新"可以理解为：复习旧知识的同时获得新知识。', correct_answer: '正确', explanation: '这是孔子对学习方法的经典总结', knowledgePoint: '文言文', subject: 'chinese', difficulty: 'easy' },
    ],
  }
  return questionBanks[knowledgePointId] || questionBanks['1']
}

const getMasteryColor = (level: MasteryLevel) => {
  switch (level) {
    case 'mastered': return 'bg-green-500'
    case 'normal': return 'bg-yellow-500'
    case 'unfamiliar': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

const getMasteryLabel = (level: MasteryLevel) => {
  switch (level) {
    case 'mastered': return '已掌握'
    case 'normal': return '一般'
    case 'unfamiliar': return '不熟悉'
  }
}

export default function AssessmentPage() {
  const [view, setView] = useState<'select' | 'testing' | 'result'>('select')
  const [selectedKnowledgePoint, setSelectedKnowledgePoint] = useState<typeof mockKnowledgePoints[0] | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([])
  const [answers, setAnswers] = useState<{ questionId: string; answer: string; isCorrect: boolean }[]>([])

  const { startAssessment, submitAnswer, nextQuestion, assessmentSession, endAssessment } = useAppStore()

  const handleStartAssessment = (kp: typeof mockKnowledgePoints[0]) => {
    setSelectedKnowledgePoint(kp)
    const generatedQuestions = generateQuestions(kp.id, kp.subject)
    setQuestions(generatedQuestions)
    setAnswers([])
    setCurrentQuestionIndex(0)
    setUserAnswer('')
    setShowResult(false)
    setIsCorrect(null)
    startAssessment(generatedQuestions, kp.id)
    setView('testing')
  }

  const handleSubmitAnswer = () => {
    if (!userAnswer.trim()) return

    const currentQuestion = questions[currentQuestionIndex]
    const correct = userAnswer.trim().toLowerCase() === currentQuestion.correct_answer.trim().toLowerCase()
    
    setIsCorrect(correct)
    setShowResult(true)
    submitAnswer(currentQuestion.id, userAnswer)
    setAnswers([...answers, { questionId: currentQuestion.id, answer: userAnswer, isCorrect: correct }])
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setUserAnswer('')
      setShowResult(false)
      setIsCorrect(null)
      nextQuestion()
    } else {
      setView('result')
    }
  }

  const handleRestart = () => {
    if (selectedKnowledgePoint) {
      handleStartAssessment(selectedKnowledgePoint)
    }
  }

  const handleBackToSelect = () => {
    endAssessment()
    setView('select')
    setSelectedKnowledgePoint(null)
    setQuestions([])
    setAnswers([])
  }

  const getScore = () => {
    return answers.filter(a => a.isCorrect).length
  }

  const getNewMasteryLevel = (): MasteryLevel => {
    const score = getScore()
    const total = questions.length
    const rate = score / total
    if (rate >= 0.8) return 'mastered'
    if (rate >= 0.5) return 'normal'
    return 'unfamiliar'
  }

  if (view === 'select') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <Brain className="w-7 h-7 text-sky" />
              智能评测
            </h1>
            <p className="text-text-secondary mt-1">根据知识点出题，动态掌握你的掌握程度</p>
          </div>
        </div>

        <Card className="bg-gradient-to-r from-sky/10 to-purple-500/10 border-none">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-sky rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">智能评测说明</h3>
                <p className="text-sm text-text-secondary mt-1">
                  选择下方知识点开始评测，系统将根据该知识点的错题情况为你生成专属题目。
                  完成评测后，系统会动态更新你对知识点的掌握程度。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mockKnowledgePoints.map((kp) => (
            <Card 
              key={kp.id} 
              hover 
              className="cursor-pointer group"
              onClick={() => handleStartAssessment(kp)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className={`${subjectColors[kp.subject as keyof typeof subjectColors] || 'bg-gray-500'} w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0`}>
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
                      style={{ width: `${(kp.correctCount / kp.totalQuestions) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-text-light">{kp.correctCount}/{kp.totalQuestions}</span>
                </div>
                <p className="text-xs text-text-light mt-2">
                  {subjectLabels[kp.subject as keyof typeof subjectLabels]} · {kp.totalQuestions} 道题目
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (view === 'testing') {
    const currentQuestion = questions[currentQuestionIndex]

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
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${subjectColors[currentQuestion.subject as keyof typeof subjectColors] || 'bg-gray-500'}`}>
                {subjectLabels[currentQuestion.subject as keyof typeof subjectLabels]}
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
                  onClick={handleSubmitAnswer}
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
              {selectedKnowledgePoint?.name} 知识点评测结果
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

            <div className={`p-4 rounded-xl mb-6 ${getMasteryColor(newMastery)}/10 border-2 ${getMasteryColor(newMastery)}`}>
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
                const question = questions.find(q => q.id === answer.questionId)
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
