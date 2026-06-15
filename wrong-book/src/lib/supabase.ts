import { createClient } from '@supabase/supabase-js'
import type { Session, AuthChangeEvent } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============ 基础枚举 ============
export type UserRole = 'student' | 'teacher' | 'parent'

export type Subject = 'chinese' | 'math' | 'english' | 'physics' | 'chemistry'

export type MasteryLevel = 'unfamiliar' | 'normal' | 'mastered'

export type Difficulty = 'easy' | 'medium' | 'hard'

export type QuestionType = 'choice' | 'fill' | 'judge' | 'answer'

// ============ 数据库行类型 ============
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface KnowledgePoint {
  id: string
  user_id: string
  subject: Subject
  name: string
  description?: string
  mastery_level: MasteryLevel
  created_at: string
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
  knowledge_point_id?: string
  created_at: string
  updated_at: string
}

export interface QuestionTag {
  id: string
  question_id: string
  tag_id: string
}

export interface AssessmentRecord {
  id: string
  user_id: string
  knowledge_point_id?: string
  question_id?: string
  user_answer: string
  is_correct: boolean
  answered_at: string
}

export interface Workbook {
  id: string
  user_id: string
  name: string
  description?: string
  subject?: Subject
  question_count: number
  created_at: string
  updated_at: string
}

export interface WorkbookQuestion {
  id: string
  workbook_id: string
  question_id: string
  added_at: string
}

// ============ 应用层类型 ============
export interface AssessmentQuestion {
  id: string
  type: QuestionType
  content: string
  options?: string[]
  correct_answer: string
  explanation?: string
  knowledgePoint: string
  subject: Subject
  difficulty: Difficulty
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

// ============ 标签字典 ============
export const subjectLabels: Record<Subject, string> = {
  chinese: '语文',
  math: '数学',
  english: '英语',
  physics: '物理',
  chemistry: '化学',
}

export const subjectColors: Record<Subject, string> = {
  chinese: 'bg-red-500',
  math: 'bg-blue-500',
  english: 'bg-purple-500',
  physics: 'bg-teal-500',
  chemistry: 'bg-yellow-500',
}

export const subjectTextColors: Record<Subject, string> = {
  chinese: 'text-red-500',
  math: 'text-blue-500',
  english: 'text-purple-500',
  physics: 'text-teal-500',
  chemistry: 'text-yellow-500',
}

export const masteryLabels: Record<MasteryLevel, string> = {
  unfamiliar: '不熟悉',
  normal: '一般',
  mastered: '已掌握',
}

export const masteryColors: Record<MasteryLevel, string> = {
  unfamiliar: 'bg-red-100 text-red-600',
  normal: 'bg-yellow-100 text-yellow-600',
  mastered: 'bg-green-100 text-green-600',
}

export const difficultyLabels: Record<Difficulty, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
}

export const roleLabels: Record<UserRole, string> = {
  student: '学生',
  teacher: '老师',
  parent: '家长',
}

// ============ Supabase 事件类型重导出 ============
export type { Session, AuthChangeEvent }
