import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 类型定义
export type UserRole = 'student' | 'teacher' | 'parent'

export type Subject = 'chinese' | 'math' | 'english' | 'physics' | 'chemistry'

export type MasteryLevel = 'unfamiliar' | 'normal' | 'mastered'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface WrongQuestion {
  id: string
  user_id: string
  subject: Subject
  content: string
  content_image_url?: string
  correct_answer: string
  wrong_answer?: string
  error_reason?: string
  analysis?: string
  chapter?: string
  difficulty?: Difficulty
  mastery_level: MasteryLevel
  created_at: string
  updated_at: string
}

export interface KnowledgePoint {
  id: string
  user_id: string
  subject: Subject
  name: string
  description?: string
  created_at: string
}

export interface QuestionTag {
  id: string
  question_id: string
  tag_id: string
}

export interface AssessmentQuestion {
  id: string
  type: 'choice' | 'fill' | 'judge'
  content: string
  options?: string[]
  correct_answer: string
  explanation?: string
  knowledgePoint: string
  subject: Subject
  difficulty: Difficulty
}

export interface AssessmentRecord {
  id: string
  question_id: string
  user_answer: string
  is_correct: boolean
  answered_at: string
}

export interface KnowledgeMastery {
  knowledgePointId: string
  knowledgePointName: string
  subject: Subject
  totalQuestions: number
  correctCount: number
  masteryLevel: MasteryLevel
  lastPracticed: string
}

// 学科显示名称
export const subjectLabels: Record<Subject, string> = {
  chinese: '语文',
  math: '数学',
  english: '英语',
  physics: '物理',
  chemistry: '化学',
}

// 学科颜色
export const subjectColors: Record<Subject, string> = {
  chinese: 'bg-red-500',
  math: 'bg-blue-500',
  english: 'bg-purple-500',
  physics: 'bg-teal-500',
  chemistry: 'bg-yellow-500',
}

// 掌握程度标签
export const masteryLabels: Record<MasteryLevel, string> = {
  unfamiliar: '不熟悉',
  normal: '一般',
  mastered: '已掌握',
}

// 难度标签
export const difficultyLabels: Record<Difficulty, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
}
