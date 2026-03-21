'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, Button, Input, Select } from '@/components/ui'
import { ArrowLeft, Save, Camera, Keyboard, Upload, X, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { addWrongQuestion } from '@/lib/database'

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
    } catch (err: any) {
      console.error('添加错题失败:', err)
      setError(err.message || '添加失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadedImage(URL.createObjectURL(file))

    // 模拟OCR识别
    setTimeout(() => {
      setOcrResult('已识别题目内容：\n\n已知二次函数 y = ax² + bx + c 的图像开口向下，且与 x 轴交于点 (1, 0) 和 (-1, 0)，则下列结论正确的是？\n\nA. a > 0\nB. a < 0\nC. c = 0\nD. b = 0')
      setIsUploading(false)
    }, 1500)
  }

  // 使用OCR结果填充表单
  const useOcrResult = () => {
    if (ocrResult) {
      setContent(ocrResult.replace('已识别题目内容：\n\n', ''))
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
