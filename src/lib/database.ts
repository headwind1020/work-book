import { supabase } from './supabase'

// 类型定义（与数据库表对应）
export interface DbUser {
  id: string
  email: string
  name: string
  role: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface DbKnowledgePoint {
  id: string
  user_id: string
  subject: string
  name: string
  description?: string
  mastery_level: string
  created_at: string
}

export interface DbWrongQuestion {
  id: string
  user_id: string
  subject: string
  content: string
  content_image_url?: string
  correct_answer: string
  wrong_answer?: string
  error_reason?: string
  analysis?: string
  chapter?: string
  difficulty?: string
  mastery_level: string
  knowledge_point_id?: string
  created_at: string
  updated_at: string
}

export interface DbAssessmentRecord {
  id: string
  user_id: string
  knowledge_point_id?: string
  question_id?: string
  user_answer: string
  is_correct: boolean
  answered_at: string
}

// ============ 用户相关 ============

// 注册新用户
export async function signUp(email: string, password: string, name: string, role: string = 'student') {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role,
      },
      emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard`,
    },
  })

  if (error) throw error

  // 如果需要邮箱验证，Supabase会返回session为null
  // 但用户已经创建成功，只是需要验证邮箱
  return {
    ...data,
    needsEmailConfirmation: data.session === null,
  }
}

// 登录
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

// 退出登录
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// 获取当前用户
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

// 监听用户状态变化
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback)
}

// ============ 知识点相关 ============

// 获取当前用户的知识点
export async function getKnowledgePoints() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const { data, error } = await supabase
    .from('knowledge_points')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as DbKnowledgePoint[]
}

// 添加知识点
export async function addKnowledgePoint(point: Omit<DbKnowledgePoint, 'id' | 'created_at'>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const { data, error } = await supabase
    .from('knowledge_points')
    .insert([{ ...point, user_id: user.id }])
    .select()

  if (error) throw error
  return data[0] as DbKnowledgePoint
}

// ============ 错题相关 ============

// 获取当前用户的错题
export async function getWrongQuestions() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const { data, error } = await supabase
    .from('wrong_questions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as DbWrongQuestion[]
}

// 添加错题
export async function addWrongQuestion(question: Omit<DbWrongQuestion, 'id' | 'created_at' | 'updated_at'>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const { data, error } = await supabase
    .from('wrong_questions')
    .insert([{ ...question, user_id: user.id }])
    .select()

  if (error) throw error
  return data[0] as DbWrongQuestion
}

// 更新错题
export async function updateWrongQuestion(id: string, updates: Partial<DbWrongQuestion>) {
  const { data, error } = await supabase
    .from('wrong_questions')
    .update(updates)
    .eq('id', id)
    .select()

  if (error) throw error
  return data[0] as DbWrongQuestion
}

// 删除错题
export async function deleteWrongQuestion(id: string) {
  const { error } = await supabase
    .from('wrong_questions')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// 获取单个错题
export async function getWrongQuestionById(id: string) {
  const { data, error } = await supabase
    .from('wrong_questions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as DbWrongQuestion
}

// ============ 评测记录相关 ============

// 添加评测记录
export async function addAssessmentRecord(record: Omit<DbAssessmentRecord, 'id' | 'answered_at'>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const { data, error } = await supabase
    .from('assessment_records')
    .insert([{ ...record, user_id: user.id }])
    .select()

  if (error) throw error
  return data[0] as DbAssessmentRecord
}

// 获取评测记录
export async function getAssessmentRecords(knowledgePointId?: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  let query = supabase
    .from('assessment_records')
    .select('*')
    .order('answered_at', { ascending: false })

  if (knowledgePointId) {
    query = query.eq('knowledge_point_id', knowledgePointId)
  }

  const { data, error } = await query

  if (error) throw error
  return data as DbAssessmentRecord[]
}

// ============ 统计分析 ============

// 获取用户错题统计
export async function getUserStats() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  // 获取错题数量
  const { count: totalQuestions } = await supabase
    .from('wrong_questions')
    .select('*', { count: 'exact', head: true })

  // 获取各学科错题数量
  const { data: subjectData } = await supabase
    .from('wrong_questions')
    .select('subject')

  const subjectStats: Record<string, number> = {}
  subjectData?.forEach((q: { subject: string }) => {
    subjectStats[q.subject] = (subjectStats[q.subject] || 0) + 1
  })

  // 获取各掌握程度数量
  const { data: masteryData } = await supabase
    .from('wrong_questions')
    .select('mastery_level')

  const masteryStats: Record<string, number> = {}
  masteryData?.forEach((q: { mastery_level: string }) => {
    masteryStats[q.mastery_level] = (masteryStats[q.mastery_level] || 0) + 1
  })

  return {
    totalQuestions: totalQuestions || 0,
    subjectStats,
    masteryStats,
  }
}
