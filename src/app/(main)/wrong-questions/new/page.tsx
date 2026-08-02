'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, Button, Input, Select } from '@/components/ui'
import { ArrowLeft, Save, Camera, Keyboard, Upload, X, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { addWrongQuestion } from '@/lib/database'
import type { Subject, Difficulty } from '@/lib/supabase'
import { stripLatex } from '@/lib/text-utils'

const subjectOptions = [
  { value: 'math', label: '数学' },
  { value: 'physics', label: '物理' },
  { value: 'english', label: '英语' },
  { value: 'chinese', label: '语文' },
  { value: 'chemistry', label: '化学' },
]

const questionTypeOptions = [
  { value: 'choice', label: '选择题' },
  { value: 'fill', label: '填空题' },
  { value: 'judge', label: '判断题' },
  { value: 'answer', label: '解答题' },
]

const difficultyOptions = [
  { value: 'easy', label: '简单' },
  { value: 'medium', label: '中等' },
  { value: 'hard', label: '困难' },
]

// 客户端直连阿里云 MaaS（自定义域名）
const MAAS_BASE_URL = 'https://llm-6o2wwdhcy3mx1z74.cn-beijing.maas.aliyuncs.com/compatible-mode/v1'
const MAAS_API_KEY = 'sk-19e2d059b5df4bb485f32d9233c104f0'
const MAAS_MODEL = 'qwen-vl-max'

const SYSTEM_PROMPT = `你是初中数学错题解析老师。

**最关键的输出规则**：
- content 字段**只含题目原文**，不要任何解题步骤、推导过程或自检
- 把所有解题过程放在 analysis 字段
- 答案放在 correctAnswer 字段
- 知识点放在 knowledgePoint 字段

字段定义（严格遵守）：
- content: 仅题目文字（不含"解："、"分析："等引导词）
- correctAnswer: 最终答案（坐标、值或表达式）
- analysis: 完整解题步骤 + 自检
- knowledgePoint: ≤10 字

只用 JSON 输出，不要 markdown 代码块。`

export default function NewWrongQuestionPage() {
  const router = useRouter()
  const [inputType, setInputType] = useState<'manual' | 'camera'>('manual')
  const [subject, setSubject] = useState<Subject | ''>('math')
  const [questionType, setQuestionType] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [content, setContent] = useState('')
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [explanation, setExplanation] = useState('')
  const [knowledgePoint, setKnowledgePoint] = useState('')
  const [chapter, setChapter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [ocrResult, setOcrResult] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async () => {
    if (!subject || !questionType || !content || !correctAnswer) {
      alert('请填写完整信息！')
      return
    }
    setLoading(true)
    setError('')

    try {
      await addWrongQuestion({
        subject: subject as Subject,
        content,
        correct_answer: correctAnswer,
        analysis: explanation,
        chapter: chapter || knowledgePoint,
        difficulty,
        mastery_level: 'unfamiliar',
        wrong_answer: '',
        error_reason: '',
        content_image_url: '',
      })
      alert('错题添加成功！')
      router.push('/wrong-questions')
    } catch (err) {
      const message = err instanceof Error ? err.message : '添加失败，请稍后重试'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  // 直接调用阿里云 MaaS（绕过 Vercel 函数限制）
  const callMaasDirect = async (
    imageBase64: string,
    subj: Subject | '',
  ): Promise<{ content: string; correctAnswer: string; analysis: string; knowledgePoint: string; difficulty: string }> => {
    const cleaned = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '')

    const response = await fetch(`${MAAS_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${MAAS_API_KEY}`,
      },
      body: JSON.stringify({
        model: MAAS_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${cleaned}` } },
              {
                type: 'text',
                text: `分析这张${subj || '数学'}错题图片。严格输出 JSON（不要 markdown）：

{
  "content": "题目原文（公式用 $LaTeX$）",
  "correctAnswer": "本题最终答案",
  "analysis": "步骤1: ...\\n步骤2: ...\\n【自检】代入验证：...",
  "knowledgePoint": "考察的知识点（≤10字）",
  "difficulty": "easy|medium|hard",
  "errorReason": "常见错误原因"
}`,
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 2048,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`MaaS ${response.status}: ${errText.slice(0, 200)}`)
    }

    const data = await response.json()
    let text: string = data.choices?.[0]?.message?.content || ''

    let parsed: Record<string, unknown> = {}
    try {
      parsed = JSON.parse(text)
    } catch {
      const m = text.match(/\{[\s\S]*\}/)
      if (m) {
        try {
          parsed = JSON.parse(m[0])
        } catch {
          parsed = { content: text }
        }
      } else {
        parsed = { content: text }
      }
    }

    // 兜底 1：从 analysis 文本里提取"最终答案"
    let correctAnswer = (parsed.correctAnswer as string) ?? ''
    if (!correctAnswer && parsed.analysis) {
      const analysis = String(parsed.analysis)
      const patterns = [
        /【自检】[\s\S]*?答案[：:]\s*([^\n。]+)/,
        /最终答案[：:]\s*([^\n。]+)/,
        /答案[：:]\s*([^\n。]+)/,
        /∴\s*([^\n。]+)/,
      ]
      for (const p of patterns) {
        const m = analysis.match(p)
        if (m) {
          correctAnswer = m[1].trim()
          break
        }
      }
    }

    // 兜底 2：从 content 里提取（如果模型没分字段）
    if (!correctAnswer && parsed.content) {
      const m = String(parsed.content).match(/答案[：:]\s*([^\n。]+)/)
      if (m) correctAnswer = m[1].trim()
    }

    return {
      content: stripLatex((parsed.content as string) ?? ''),
      correctAnswer: stripLatex(correctAnswer),
      analysis: stripLatex((parsed.analysis as string) ?? ''),
      knowledgePoint: stripLatex((parsed.knowledgePoint as string) ?? ''),
      difficulty: (parsed.difficulty as string) ?? 'medium',
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const previewUrl = URL.createObjectURL(file)
    setUploadedImage(previewUrl)
    setOcrResult('')
    setIsUploading(true)
    setError('')

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const result = await callMaasDirect(dataUrl, subject)

      if (result.content) {
        setContent(result.content)
        if (result.correctAnswer) setCorrectAnswer(result.correctAnswer)
        if (result.analysis) setExplanation(result.analysis)
        if (result.knowledgePoint) setKnowledgePoint(result.knowledgePoint)
        if (result.difficulty) setDifficulty(result.difficulty as Difficulty)

        // 卡片只展示"是否成功 + 识别到的答案摘要"
        const summary = result.correctAnswer
          ? `✅ 已识别完成\n\n题目已填，答案：${result.correctAnswer.slice(0, 80)}${result.correctAnswer.length > 80 ? '...' : ''}`
          : result.knowledgePoint
            ? `✅ 已识别（未返回答案，请手动填写）\n\n知识点：${result.knowledgePoint}`
            : `✅ 已识别题目，请填写正确答案`
        setOcrResult(summary)
      } else {
        setOcrResult('⚠️ 未识别到任何文字，请手动输入')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '识别失败'
      setError(message)
      setOcrResult('')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/wrong-questions" className="p-2 hover:bg-sky-light rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-text-primary">新增错题</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="font-medium text-text-primary mb-4">选择输入方式</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setInputType('manual')}
              className={`p-6 rounded-xl border-2 transition-all ${inputType === 'manual' ? 'border-sky bg-sky-light' : 'border-border hover:border-sky/50'}`}
            >
              <Keyboard className={`w-10 h-10 mx-auto mb-3 ${inputType === 'manual' ? 'text-sky' : 'text-text-secondary'}`} />
              <p className="font-medium text-text-primary">手动输入</p>
              <p className="text-sm text-text-secondary mt-1">直接填写题目信息</p>
            </button>
            <button
              onClick={() => setInputType('camera')}
              className={`p-6 rounded-xl border-2 transition-all ${inputType === 'camera' ? 'border-sky bg-sky-light' : 'border-border hover:border-sky/50'}`}
            >
              <Camera className={`w-10 h-10 mx-auto mb-3 ${inputType === 'camera' ? 'text-sky' : 'text-text-secondary'}`} />
              <p className="font-medium text-text-primary">拍照输入</p>
              <p className="text-sm text-text-secondary mt-1">拍照识别题目（AI）</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {inputType === 'manual' && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">学科 *</label>
                <Select
                  options={subjectOptions}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as Subject | '')}
                  placeholder="选择学科"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">难度</label>
                <Select
                  options={difficultyOptions}
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">知识点</label>
                <Input
                  value={knowledgePoint}
                  onChange={(e) => setKnowledgePoint(e.target.value)}
                  placeholder="请输入知识点名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">章节</label>
                <Input
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  placeholder="请输入章节"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">题型</label>
              <Select
                options={questionTypeOptions}
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value)}
                placeholder="选择题型"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">题目内容 *</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="请输入题目内容"
                className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">正确答案 *</label>
              <Input
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                placeholder="请输入正确答案"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">解析</label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="请输入题目解析"
                className="w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky"
                rows={3}
              />
            </div>

            {error && <p className="text-sm text-error">{error}</p>}

            <div className="flex gap-3 pt-4">
              <Link href="/wrong-questions" className="flex-1">
                <Button variant="outline" className="w-full">取消</Button>
              </Link>
              <Button onClick={handleSubmit} className="flex-1 gap-2" disabled={loading}>
                {loading ? '保存中...' : (<><Save className="w-4 h-4" />保存</>)}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {inputType === 'camera' && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${uploadedImage ? 'border-sky' : 'border-border hover:border-sky/50'}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {uploadedImage ? (
                <div className="relative">
                  <img src={uploadedImage} alt="上传的图片" className="max-h-64 mx-auto rounded-lg" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setUploadedImage(null)
                      setOcrResult('')
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-text-light mx-auto mb-3" />
                  <p className="text-text-primary font-medium">点击上传图片</p>
                  <p className="text-sm text-text-secondary mt-1">支持 JPG、PNG 格式</p>
                </>
              )}
            </div>

            {isUploading && (
              <div className="flex items-center justify-center gap-2 py-4">
                <Sparkles className="w-5 h-5 text-sky animate-pulse" />
                <span className="text-text-secondary">AI 正在识别题目（可能需要 30-60 秒）...</span>
              </div>
            )}

            {ocrResult && !isUploading && (
              <div className="bg-sky-light rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-text-primary">识别结果</h3>
                  <span className="text-sm text-text-secondary">已自动填表，可手动修改</span>
                </div>
                <pre className="text-sm text-text-secondary whitespace-pre-wrap">{ocrResult}</pre>
              </div>
            )}

            <div className="border-t border-border pt-4 mt-4">
              <h3 className="font-medium text-text-primary mb-4">补充信息</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">学科 *</label>
                  <Select
                    options={subjectOptions}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value as Subject | '')}
                    placeholder="选择学科"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">知识点</label>
                  <Input
                    value={knowledgePoint}
                    onChange={(e) => setKnowledgePoint(e.target.value)}
                    placeholder="知识点"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-text-primary mb-2">正确答案 *</label>
                <Input
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  placeholder="请输入正确答案"
                />
              </div>
            </div>

            {error && <p className="text-sm text-error">{error}</p>}

            <div className="flex gap-3 pt-4">
              <Link href="/wrong-questions" className="flex-1">
                <Button variant="outline" className="w-full">取消</Button>
              </Link>
              <Button onClick={handleSubmit} className="flex-1 gap-2" disabled={loading}>
                {loading ? '保存中...' : (<><Save className="w-4 h-4" />保存</>)}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}