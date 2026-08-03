'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, Button, Input, Select } from '@/components/ui'
import { ArrowLeft, Save, Camera, Keyboard, Upload, X, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { addWrongQuestion } from '@/lib/database'
import {
  subjectOptions,
  difficultyOptions,
  questionTypeOptions,
} from '@/lib/constants'

export default function NewWrongQuestionPage() {
  const router = useRouter()
  const [inputType, setInputType] = useState<'manual' | 'camera'>('manual')
  const [subject, setSubject] = useState('')
  const [questionType, setQuestionType] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
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
  const [recognizedData, setRecognizedData] = useState<{
    content: string
    correctAnswer: string
    analysis: string
    knowledgePoint: string
    difficulty: string
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 组件卸载时释放 blob URL
  useEffect(() => {
    return () => {
      if (uploadedImage) URL.revokeObjectURL(uploadedImage)
    }
  }, [uploadedImage])

  const handleSubmit = async () => {
    if (!subject || !questionType || !content || !correctAnswer) {
      alert('请填写完整信息！')
      return
    }

    setLoading(true)
    setError('')

    try {
      await addWrongQuestion({
        subject,
        content,
        correct_answer: correctAnswer,
        analysis: explanation,
        chapter: chapter || knowledgePoint,
        difficulty,
        mastery_level: 'unfamiliar',
        wrong_answer: '',
        error_reason: '',
      })
      alert('错题添加成功！')
      router.push('/wrong-questions')
    } catch (err: unknown) {
      console.error('添加错题失败:', err)
      const message = err instanceof Error ? err.message : String(err)
      setError(message || '添加失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 将图片压缩到最长边 1024px、JPEG 0.7，避免 Vercel 4.5MB 请求体限制
  const compressImage = async (file: File, maxEdge = 768, quality = 0.65): Promise<string> => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = dataUrl
    })
    const longest = Math.max(img.width, img.height)
    const scale = longest > maxEdge ? maxEdge / longest : 1
    const w = Math.round(img.width * scale)
    const h = Math.round(img.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return dataUrl
    ctx.drawImage(img, 0, 0, w, h)
    return canvas.toDataURL('image/jpeg', quality)
  }

  // 处理图片上传
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const previewUrl = URL.createObjectURL(file)
    setUploadedImage(previewUrl)
    setOcrResult('')
    setIsUploading(true)
    setError('')

    try {
      const dataUrl = await compressImage(file)

      let res: Response
      try {
        res = await fetch('/api/ai/recognize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: dataUrl,
            subject: subject || 'math',
          }),
        })
      } catch (networkErr) {
        throw new Error('网络请求失败（fetch failed）。请检查网络后重试，或稍后再试。')
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `识别失败（HTTP ${res.status}）`)
      }

      const data = await res.json()

      if (data.content) {
        let recognized = {
          content: data.content ?? '',
          correctAnswer: data.correctAnswer ?? '',
          analysis: data.analysis ?? '',
          knowledgePoint: data.knowledgePoint ?? '',
          difficulty: data.difficulty ?? 'medium',
        }

        // 兜底 1：模型把正确答塞进了 content 字段（前面带"正确答案："等关键字）
        if (!recognized.correctAnswer && recognized.content) {
          const m = recognized.content.match(/正确答案[：:]\s*([\s\S]+?)(?:\n\n|$)/)
          if (m) recognized.correctAnswer = m[1].trim()
        }

        // 兜底 2：content 本身是 JSON 字符串（模型偶发把整段 JSON 吐回 content）
        if ((!recognized.correctAnswer || recognized.content.startsWith('{')) && recognized.content.startsWith('{')) {
          try {
            const inner = JSON.parse(recognized.content)
            if (inner.content) recognized.content = inner.content
            if (inner.correctAnswer) recognized.correctAnswer = inner.correctAnswer
            if (inner.analysis) recognized.analysis = inner.analysis
            if (inner.knowledgePoint) recognized.knowledgePoint = inner.knowledgePoint
          } catch {
            // 不是 JSON，忽略
          }
        }

        setRecognizedData(recognized)
        // 自动填充表单
        setContent(recognized.content)
        if (recognized.correctAnswer) setCorrectAnswer(recognized.correctAnswer)
        if (recognized.analysis) setExplanation(recognized.analysis)
        if (recognized.knowledgePoint) setKnowledgePoint(recognized.knowledgePoint)
        if (recognized.difficulty) setDifficulty(recognized.difficulty as 'easy' | 'medium' | 'hard')
        setOcrResult(
          recognized.correctAnswer
            ? `✅ 已识别题目\n\n题目：${recognized.content}\n\n正确答案：${recognized.correctAnswer}`
            : `已识别：${recognized.content}`
        )
      } else {
        setOcrResult('未识别到任何文字，请手动输入')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '识别失败'
      console.error('识别错误:', err)
      setError(message)
      setOcrResult('')
    } finally {
      setIsUploading(false)
    }
  }

  // 使用识别结果填充表单
  const useOcrResult = () => {
    if (recognizedData) {
      setContent(recognizedData.content)
      setCorrectAnswer(recognizedData.correctAnswer)
      setExplanation(recognizedData.analysis)
      setKnowledgePoint(recognizedData.knowledgePoint)
      if (recognizedData.difficulty) {
        setDifficulty(recognizedData.difficulty as 'easy' | 'medium' | 'hard')
      }
    } else if (ocrResult && ocrResult !== '未识别到任何文字，请手动输入') {
      setContent(ocrResult)
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

      {/* 选择输入方式 */}
      <Card>
        <CardContent className="p-6">
          <h2 className="font-medium text-text-primary mb-4">选择输入方式</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setInputType('manual')}
              className={`p-6 rounded-xl border-2 transition-all ${
                inputType === 'manual'
                  ? 'border-sky bg-sky-light'
                  : 'border-border hover:border-sky/50'
              }`}
            >
              <Keyboard className={`w-10 h-10 mx-auto mb-3 ${inputType === 'manual' ? 'text-sky' : 'text-text-secondary'}`} />
              <p className="font-medium text-text-primary">手动输入</p>
              <p className="text-sm text-text-secondary mt-1">直接填写题目信息</p>
            </button>
            <button
              onClick={() => setInputType('camera')}
              className={`p-6 rounded-xl border-2 transition-all ${
                inputType === 'camera'
                  ? 'border-sky bg-sky-light'
                  : 'border-border hover:border-sky/50'
              }`}
            >
              <Camera className={`w-10 h-10 mx-auto mb-3 ${inputType === 'camera' ? 'text-sky' : 'text-text-secondary'}`} />
              <p className="font-medium text-text-primary">拍照输入</p>
              <p className="text-sm text-text-secondary mt-1">拍照识别题目（OCR）</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 手动输入表单 */}
      {inputType === 'manual' && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">学科 *</label>
                <Select
                  options={subjectOptions}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="选择学科"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">难度</label>
                <Select
                  options={difficultyOptions}
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
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
                {loading ? '保存中...' : (
                  <>
                    <Save className="w-4 h-4" />
                    保存
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 拍照输入 */}
      {inputType === 'camera' && (
        <Card>
          <CardContent className="p-6 space-y-4">
            {/* 上传区域 */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                uploadedImage ? 'border-sky' : 'border-border hover:border-sky/50'
              }`}
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
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

            {/* OCR识别中 */}
            {isUploading && (
              <div className="flex items-center justify-center gap-2 py-4">
                <Sparkles className="w-5 h-5 text-sky animate-pulse" />
                <span className="text-text-secondary">AI 正在识别题目...</span>
              </div>
            )}

            {/* OCR结果 */}
            {ocrResult && !isUploading && (
              <div className="bg-sky-light rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-text-primary">识别结果</h3>
                  <button
                    onClick={useOcrResult}
                    className="text-sm text-sky hover:underline"
                  >
                    使用此内容
                  </button>
                </div>
                <pre className="text-sm text-text-secondary whitespace-pre-wrap">{ocrResult}</pre>
              </div>
            )}

            {/* 手动补充信息 */}
            <div className="border-t border-border pt-4 mt-4">
              <h3 className="font-medium text-text-primary mb-4">补充信息</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">学科 *</label>
                  <Select
                    options={subjectOptions}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
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
                {loading ? '保存中...' : (
                  <>
                    <Save className="w-4 h-4" />
                    保存
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
