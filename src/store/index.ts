import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, WrongQuestion, UserRole, AssessmentQuestion, AssessmentRecord, KnowledgeMastery } from '@/lib/supabase'

interface AppState {
  // 用户状态
  user: User | null
  isAuthenticated: boolean

  // 错题列表
  wrongQuestions: WrongQuestion[]

  // 当前选中的学科筛选
  selectedSubject: string | null

  // 评测相关状态
  currentAssessment: AssessmentQuestion[]
  assessmentRecords: AssessmentRecord[]
  knowledgeMastery: KnowledgeMastery[]
  assessmentSession: {
    isActive: boolean
    currentIndex: number
    startTime: string | null
    knowledgePointId: string | null
  }

  // 设置用户
  setUser: (user: User | null) => void

  // 设置错题列表
  setWrongQuestions: (questions: WrongQuestion[]) => void

  // 添加错题
  addWrongQuestion: (question: WrongQuestion) => void

  // 更新错题
  updateWrongQuestion: (id: string, data: Partial<WrongQuestion>) => void

  // 删除错题
  deleteWrongQuestion: (id: string) => void

  // 设置学科筛选
  setSelectedSubject: (subject: string | null) => void

  // 切换角色
  setRole: (role: UserRole) => void

  // 评测相关方法
  startAssessment: (questions: AssessmentQuestion[], knowledgePointId: string) => void
  submitAnswer: (questionId: string, answer: string) => void
  nextQuestion: () => void
  endAssessment: () => void
  updateKnowledgeMastery: (mastery: KnowledgeMastery[]) => void

  // 登出
  logout: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      wrongQuestions: [],
      selectedSubject: null,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setWrongQuestions: (questions) =>
        set({ wrongQuestions: questions }),

      addWrongQuestion: (question) =>
        set((state) => ({
          wrongQuestions: [question, ...state.wrongQuestions],
        })),

      updateWrongQuestion: (id, data) =>
        set((state) => ({
          wrongQuestions: state.wrongQuestions.map((q) =>
            q.id === id ? { ...q, ...data } : q
          ),
        })),

      deleteWrongQuestion: (id) =>
        set((state) => ({
          wrongQuestions: state.wrongQuestions.filter((q) => q.id !== id),
        })),

      setSelectedSubject: (subject) =>
        set({ selectedSubject: subject }),

      setRole: (role) =>
        set((state) => ({
          user: state.user ? { ...state.user, role } : null,
        })),

      currentAssessment: [],
      assessmentRecords: [],
      knowledgeMastery: [],
      assessmentSession: {
        isActive: false,
        currentIndex: 0,
        startTime: null,
        knowledgePointId: null,
      },

      startAssessment: (questions, knowledgePointId) =>
        set({
          currentAssessment: questions,
          assessmentRecords: [],
          assessmentSession: {
            isActive: true,
            currentIndex: 0,
            startTime: new Date().toISOString(),
            knowledgePointId,
          },
        }),

      submitAnswer: (questionId, userAnswer) =>
        set((state) => {
          const question = state.currentAssessment.find((q) => q.id === questionId)
          if (!question) return state

          const isCorrect = userAnswer.trim().toLowerCase() === question.correct_answer.trim().toLowerCase()
          const newRecord: AssessmentRecord = {
            id: Date.now().toString(),
            question_id: questionId,
            user_answer: userAnswer,
            is_correct: isCorrect,
            answered_at: new Date().toISOString(),
          }

          return {
            assessmentRecords: [...state.assessmentRecords, newRecord],
          }
        }),

      nextQuestion: () =>
        set((state) => ({
          assessmentSession: {
            ...state.assessmentSession,
            currentIndex: state.assessmentSession.currentIndex + 1,
          },
        })),

      endAssessment: () =>
        set({
          assessmentSession: {
            isActive: false,
            currentIndex: 0,
            startTime: null,
            knowledgePointId: null,
          },
        }),

      updateKnowledgeMastery: (mastery) =>
        set({ knowledgeMastery: mastery }),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          wrongQuestions: [],
          selectedSubject: null,
          currentAssessment: [],
          assessmentRecords: [],
          assessmentSession: {
            isActive: false,
            currentIndex: 0,
            startTime: null,
            knowledgePointId: null,
          },
        }),
    }),
    {
      name: 'wrong-book-storage',
    }
  )
)
