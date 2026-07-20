import { supabase } from './supabase'
import type { Session } from '@supabase/supabase-js'

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

export interface DbWorkbook {
  id: string
  user_id: string
  name: string
  description?: string
  subject?: string
  question_count: number
  created_at: string
  updated_at: string
}

export interface DbWorkbookQuestion {
  id: string
  workbook_id: string
  question_id: string
  added_at: string
}

// ============ 用户相关 ============

// 注册新用户：通过服务端 API 路由
export async function signUp(email: string, password: string, name: string, role: string = 'student') {
  const res = await fetch('/api/auth/sign-up', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name, role }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({} as { error?: string }))
    throw new Error(err.error || `注册失败 (${res.status})`)
  }

  const data = await res.json()
  if (data.session) {
    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    })
  }
  return data
}

// 登录：通过服务端 API 路由调用 Supabase，避免浏览器直接连接的 CORS/DNS/代理问题
export async function signIn(email: string, password: string) {
  const res = await fetch('/api/auth/sign-in', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({} as { error?: string }))
    const message = err.error || `登录失败 (${res.status})`
    throw new Error(message)
  }

  const data = await res.json()
  // 让客户端 supabase 知道 session，刷新本地状态
  if (data.session) {
    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    })
  }
  return data
}

// 退出登录：通过服务端 API 路由清除服务端 cookie
export async function signOut() {
  // 服务端 signOut 需要 cookie 上下文；浏览器端走 supabase.auth.signOut 清除本地 cookie
  // 先尝试服务端（如果失败回退客户端）
  try {
    await fetch('/api/auth/sign-out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.warn('服务端 signOut 失败，使用本地登出:', err)
  }
  // 同时清除客户端会话
  await supabase.auth.signOut()
}

// 获取当前用户
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

// 监听用户状态变化
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
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
export async function addKnowledgePoint(point: Omit<DbKnowledgePoint, 'id' | 'created_at' | 'user_id'>) {
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
export async function addWrongQuestion(question: Omit<DbWrongQuestion, 'id' | 'created_at' | 'updated_at' | 'user_id'>) {
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

export interface UserStats {
  totalQuestions: number
  subjectStats: Record<string, number>
  masteryStats: Record<string, number>
}

export interface WeeklyStat {
  day: string
  date: string
  count: number
}

// 获取用户错题统计
export async function getUserStats(): Promise<UserStats> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const { count: totalQuestions } = await supabase
    .from('wrong_questions')
    .select('*', { count: 'exact', head: true })

  const { data: subjectData } = await supabase
    .from('wrong_questions')
    .select('subject')

  const subjectStats: Record<string, number> = {}
  subjectData?.forEach((q: { subject: string }) => {
    subjectStats[q.subject] = (subjectStats[q.subject] || 0) + 1
  })

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

// 获取最近 N 天每天的错题新增数（基于 created_at）
export async function getWeeklyStats(days: number = 7): Promise<WeeklyStat[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const dayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // 计算 N 天前 0 点
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - (days - 1))

  const { data, error } = await supabase
    .from('wrong_questions')
    .select('created_at')
    .gte('created_at', startDate.toISOString())

  if (error) throw error

  const buckets: WeeklyStat[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    buckets.push({
      day: dayLabels[d.getDay()],
      date: d.toISOString().slice(0, 10),
      count: 0,
    })
  }

  data?.forEach((q: { created_at: string }) => {
    const created = new Date(q.created_at)
    const createdDate = new Date(created.getFullYear(), created.getMonth(), created.getDate())
    const idx = Math.round((createdDate.getTime() - startDate.getTime()) / 86400000)
    if (idx >= 0 && idx < days) {
      buckets[idx].count += 1
    }
  })

  return buckets
}

// 获取最近的错题
export async function getRecentQuestions(limit: number = 5): Promise<DbWrongQuestion[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const { data, error } = await supabase
    .from('wrong_questions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data as DbWrongQuestion[]) || []
}

// 获取薄弱知识点（按错题数量降序，返回对应 knowledge_point 信息）
export interface WeakPoint {
  id: string
  name: string
  subject: string
  count: number
}

export async function getWeakPoints(limit: number = 5): Promise<WeakPoint[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const { data: questions, error } = await supabase
    .from('wrong_questions')
    .select('knowledge_point_id, subject, chapter')
    .not('knowledge_point_id', 'is', null)

  if (error) throw error

  // 统计每个 knowledge_point_id 的错题数
  const counter: Record<string, { count: number; subject: string; chapter: string }> = {}
  questions?.forEach((q: { knowledge_point_id: string; subject: string; chapter: string | null }) => {
    if (!q.knowledge_point_id) return
    if (!counter[q.knowledge_point_id]) {
      counter[q.knowledge_point_id] = { count: 0, subject: q.subject, chapter: q.chapter || '' }
    }
    counter[q.knowledge_point_id].count += 1
  })

  const ids = Object.keys(counter)
  if (ids.length === 0) return []

  const { data: points, error: pointsError } = await supabase
    .from('knowledge_points')
    .select('id, name, subject')
    .in('id', ids)

  if (pointsError) throw pointsError

  const result: WeakPoint[] = (points || []).map((p: { id: string; name: string; subject: string }) => ({
    id: p.id,
    name: p.name,
    subject: p.subject,
    count: counter[p.id]?.count || 0,
  }))

  return result.sort((a, b) => b.count - a.count).slice(0, limit)
}

// 获取本周新增错题数
export async function getWeeklyNewCount(): Promise<number> {
  const stats = await getWeeklyStats(7)
  return stats.reduce((sum, s) => sum + s.count, 0)
}

// ============ 练习册相关 ============

// 获取当前用户的练习册
export async function getWorkbooks() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const { data, error } = await supabase
    .from('workbooks')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as DbWorkbook[]
}

// 获取单个练习册
export async function getWorkbookById(id: string) {
  const { data, error } = await supabase
    .from('workbooks')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as DbWorkbook
}

// 创建练习册
export async function createWorkbook(workbook: Omit<DbWorkbook, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'question_count'>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const { data, error } = await supabase
    .from('workbooks')
    .insert([{ ...workbook, user_id: user.id, question_count: 0 }])
    .select()

  if (error) throw error
  return data[0] as DbWorkbook
}

// 更新练习册
export async function updateWorkbook(id: string, updates: Partial<DbWorkbook>) {
  const { data, error } = await supabase
    .from('workbooks')
    .update(updates)
    .eq('id', id)
    .select()

  if (error) throw error
  return data[0] as DbWorkbook
}

// 删除练习册（同时级联删除 workbook_questions 关联记录）
export async function deleteWorkbook(id: string) {
  // 先删除关联的题目
  const { error: wqError } = await supabase
    .from('workbook_questions')
    .delete()
    .eq('workbook_id', id)

  if (wqError) throw wqError

  // 再删除练习册本身
  const { error } = await supabase
    .from('workbooks')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// 获取练习册中的题目
export async function getWorkbookQuestions(workbookId: string) {
  const { data, error } = await supabase
    .from('workbook_questions')
    .select('*')
    .eq('workbook_id', workbookId)
    .order('added_at', { ascending: false })

  if (error) throw error
  return data as DbWorkbookQuestion[]
}

// 添加题目到练习册
export async function addQuestionToWorkbook(workbookId: string, questionId: string) {
  const { data, error } = await supabase
    .from('workbook_questions')
    .insert([{ workbook_id: workbookId, question_id: questionId }])
    .select()

  if (error) throw error

  // 更新练习册题目数量
  const workbook = await getWorkbookById(workbookId)
  await supabase
    .from('workbooks')
    .update({ question_count: workbook.question_count + 1 })
    .eq('id', workbookId)

  return data[0] as DbWorkbookQuestion
}

// 从练习册移除题目
export async function removeQuestionFromWorkbook(workbookId: string, questionId: string) {
  const { error } = await supabase
    .from('workbook_questions')
    .delete()
    .eq('workbook_id', workbookId)
    .eq('question_id', questionId)

  if (error) throw error

  // 更新练习册题目数量
  const workbook = await getWorkbookById(workbookId)
  await supabase
    .from('workbooks')
    .update({ question_count: Math.max(workbook.question_count - 1, 0) })
    .eq('id', workbookId)
}
