import type { Subject, Difficulty } from './supabase'

// 学科下拉选项（按 value/label 格式）
export const subjectOptions: { value: Subject; label: string }[] = [
  { value: 'math', label: '数学' },
  { value: 'physics', label: '物理' },
  { value: 'english', label: '英语' },
  { value: 'chinese', label: '语文' },
  { value: 'chemistry', label: '化学' },
]

// 难度选项
export const difficultyOptions: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: '简单' },
  { value: 'medium', label: '中等' },
  { value: 'hard', label: '困难' },
]

// 题型选项（错题新增表单）
export const questionTypeOptions = [
  { value: 'choice', label: '选择题' },
  { value: 'fill', label: '填空题' },
  { value: 'judge', label: '判断题' },
  { value: 'answer', label: '解答题' },
]

// 角色选项（注册页）
export const roleOptions = [
  { value: 'student', label: '学生' },
  { value: 'teacher', label: '老师' },
  { value: 'parent', label: '家长' },
]

// 掌握程度选项（错题管理筛选）
export const masteryFilterOptions = [
  { value: '', label: '全部掌握程度' },
  { value: 'unfamiliar', label: '不熟悉' },
  { value: 'normal', label: '一般' },
  { value: 'mastered', label: '已掌握' },
]

// 学科筛选选项（含"全部"）
export const subjectFilterOptions = [
  { value: '', label: '全部学科' },
  ...subjectOptions,
]