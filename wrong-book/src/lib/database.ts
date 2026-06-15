import { supabase } from './supabase'
import type { Session, AuthChangeEvent } from '@supabase/supabase-js'
import type {
  User,
  KnowledgePoint,
  WrongQuestion,
  AssessmentRecord,
  Workbook,
  WorkbookQuestion,
} from './supabase'

// 重新导出以兼容使用方
export type {
  User,
  KnowledgePoint,
  WrongQuestion,
  AssessmentRecord,
  Workbook,
  WorkbookQuestion,
  Subject,
  MasteryLevel,
} from './supabase'

// 保留 DbXxx 别名以兼容旧引用
export type DbUser = User
export type DbKnowledgePoint = KnowledgePoint
export type DbWrongQuestion = WrongQuestion
export type DbAssessmentRecord = AssessmentRecord
export type DbWorkbook = Workbook
export type DbWorkbookQuestion = WorkbookQuestion

// ============ 认证 ============

export async function signUp(email: string, password: string, name: string, role: string = 'student') {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, role },
      emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard`,
    },
  })

  if (error) throw error

  return {
    ...data,
    needsEmailConfirmation: data.session === null,
  }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export function onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
  return supabase.auth.onAuthStateChange(callback)
}

// ============ 用户 Profile ============

export async function getUserProfile(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()
  if (error) {
    // 未在 users 表中建档：返回从 auth 推导的最小可用信息
    return {
      id: user.id,
      email: user.email ?? '',
      name: (user.user_metadata?.name as string) || user.email?.split('@')[0] || '用户',
      role: (user.user_metadata?.role as User['role']) || 'student',
      avatar_url: undefined,
      created_at: user.created_at,
      updated_at: user.updated_at ?? user.created_at,
    }
  }
  return data as User
}

// ============ 知识点 ============

export async function getKnowledgePoints(): Promise<KnowledgePoint[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const { data, error } = await supabase
    .from('knowledge_points')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as KnowledgePoint[]
}

export async function addKnowledgePoint(point: Omit<KnowledgePoint, 'id' | 'created_at' | 'user_id'>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const { data, error } = await supabase
    .from('knowledge_points')
    .insert([{ ...point, user_id: user.id }])
    .select()
    .single()

  if (error) throw error
  return data as KnowledgePoint
}

export async function deleteKnowledgePoint(id: string) {
  const { error } = await supabase.from('knowledge_points').delete().eq('id', id)
  if (error) throw error
}

// ============ 错题 ============

export async function getWrongQuestions(): Promise<WrongQuestion[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const { data, error } = await supabase
    .from('wrong_questions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as WrongQuestion[]
}

export async function getWrongQuestionById(id: string): Promise<WrongQuestion | null> {
  const { data, error } = await supabase
    .from('wrong_questions')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return (data as WrongQuestion) ?? null
}

export async function addWrongQuestion(question: Omit<WrongQuestion, 'id' | 'created_at' | 'updated_at' | 'user_id'>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const { data, error } = await supabase
    .from('wrong_questions')
    .insert([{ ...question, user_id: user.id }])
    .select()
    .single()

  if (error) throw error
  return data as WrongQuestion
}

export async function updateWrongQuestion(id: string, updates: Partial<WrongQuestion>) {
  const { data, error } = await supabase
    .from('wrong_questions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as WrongQuestion
}

export async function deleteWrongQuestion(id: string) {
  const { error } = await supabase.from('wrong_questions').delete().eq('id', id)
  if (error) throw error
}

// ============ 评测记录 ============

export async function addAssessmentRecord(record: Omit<AssessmentRecord, 'id' | 'answered_at' | 'user_id'>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const { data, error } = await supabase
    .from('assessment_records')
    .insert([{ ...record, user_id: user.id }])
    .select()
    .single()

  if (error) throw error
  return data as AssessmentRecord
}

export async function getAssessmentRecords(knowledgePointId?: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  let query = supabase
    .from('assessment_records')
    .select('*')
    .eq('user_id', user.id)
    .order('answered_at', { ascending: false })

  if (knowledgePointId) {
    query = query.eq('knowledge_point_id', knowledgePointId)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as AssessmentRecord[]
}

// ============ 练习册 ============

export async function getWorkbooks(): Promise<Workbook[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const { data, error } = await supabase
    .from('workbooks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Workbook[]
}

export async function getWorkbookById(id: string): Promise<Workbook | null> {
  const { data, error } = await supabase
    .from('workbooks')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return (data as Workbook) ?? null
}

export async function createWorkbook(workbook: Omit<Workbook, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'question_count'>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const { data, error } = await supabase
    .from('workbooks')
    .insert([{ ...workbook, user_id: user.id, question_count: 0 }])
    .select()
    .single()

  if (error) throw error
  return data as Workbook
}

export async function updateWorkbook(id: string, updates: Partial<Workbook>) {
  const { data, error } = await supabase
    .from('workbooks')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Workbook
}

export async function deleteWorkbook(id: string) {
  const { error } = await supabase.from('workbooks').delete().eq('id', id)
  if (error) throw error
}

export async function getWorkbookQuestions(workbookId: string): Promise<WorkbookQuestion[]> {
  const { data, error } = await supabase
    .from('workbook_questions')
    .select('*')
    .eq('workbook_id', workbookId)
    .order('added_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as WorkbookQuestion[]
}

export async function addQuestionToWorkbook(workbookId: string, questionId: string) {
  const { data, error } = await supabase
    .from('workbook_questions')
    .insert([{ workbook_id: workbookId, question_id: questionId }])
    .select()
    .single()

  if (error) throw error

  const workbook = await getWorkbookById(workbookId)
  if (workbook) {
    await supabase
      .from('workbooks')
      .update({ question_count: workbook.question_count + 1 })
      .eq('id', workbookId)
  }

  return data as WorkbookQuestion
}

export async function removeQuestionFromWorkbook(workbookId: string, questionId: string) {
  const { error } = await supabase
    .from('workbook_questions')
    .delete()
    .eq('workbook_id', workbookId)
    .eq('question_id', questionId)

  if (error) throw error

  const workbook = await getWorkbookById(workbookId)
  if (workbook) {
    await supabase
      .from('workbooks')
      .update({ question_count: Math.max(workbook.question_count - 1, 0) })
      .eq('id', workbookId)
  }
}

// ============ 统计 ============

export interface UserStats {
  total: number
  bySubject: Record<string, number>
  byMastery: Record<string, number>
  byDifficulty: Record<string, number>
  recent7Days: { date: string; count: number }[]
  recent: WrongQuestion[]
}

export async function getUserStats(): Promise<UserStats> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const { data, error } = await supabase
    .from('wrong_questions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  const list = (data ?? []) as WrongQuestion[]

  const bySubject: Record<string, number> = {}
  const byMastery: Record<string, number> = {}
  const byDifficulty: Record<string, number> = {}

  list.forEach((q) => {
    bySubject[q.subject] = (bySubject[q.subject] || 0) + 1
    byMastery[q.mastery_level] = (byMastery[q.mastery_level] || 0) + 1
    if (q.difficulty) {
      byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] || 0) + 1
    }
  })

  // 最近 7 天按天聚合
  const dayMap = new Map<string, number>()
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = `${d.getMonth() + 1}/${d.getDate()}`
    dayMap.set(key, 0)
  }
  list.forEach((q) => {
    const d = new Date(q.created_at)
    const key = `${d.getMonth() + 1}/${d.getDate()}`
    if (dayMap.has(key)) {
      dayMap.set(key, (dayMap.get(key) || 0) + 1)
    }
  })

  const recent7Days = Array.from(dayMap.entries()).map(([date, count]) => ({ date, count }))
  const recent = list.slice(0, 5)

  return {
    total: list.length,
    bySubject,
    byMastery,
    byDifficulty,
    recent7Days,
    recent,
  }
}

export interface KnowledgeStats {
  id: string
  name: string
  subject: string
  count: number
  unfamiliarCount: number
}

export async function getKnowledgeStats(): Promise<KnowledgeStats[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const [pointsRes, questionsRes] = await Promise.all([
    supabase
      .from('knowledge_points')
      .select('*')
      .eq('user_id', user.id),
    supabase
      .from('wrong_questions')
      .select('id, knowledge_point_id, mastery_level')
      .eq('user_id', user.id),
  ])

  if (pointsRes.error) throw pointsRes.error
  if (questionsRes.error) throw questionsRes.error

  const points = (pointsRes.data ?? []) as KnowledgePoint[]
  const questions = (questionsRes.data ?? []) as Pick<WrongQuestion, 'id' | 'knowledge_point_id' | 'mastery_level'>[]

  return points.map((p) => {
    const linked = questions.filter((q) => q.knowledge_point_id === p.id)
    return {
      id: p.id,
      name: p.name,
      subject: p.subject,
      count: linked.length,
      unfamiliarCount: linked.filter((q) => q.mastery_level === 'unfamiliar').length,
    }
  })
}
