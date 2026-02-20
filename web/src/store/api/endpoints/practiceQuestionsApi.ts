import { baseApi } from '../baseApi'

export interface UserQuestionItem {
  id: number
  title: string
  content: string
  question_type: string
  options: Record<string, unknown>
  difficulty: string
  estimated_time_seconds: number | null
  tags: string[]
}

export interface SubmitAnswersRequest {
  session_type: 'memory_scan' | 'knowledge_check'
  answers: { question_id: number; selected_answer: string }[]
}

export interface SubmitAnswersResponse {
  session_id: number
  score_percent: number
  total_questions: number
  correct_count: number
}

export const practiceQuestionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPracticeQuestions: builder.query<
      UserQuestionItem[],
      { mode: string; tags?: string[]; skill_ids?: number[]; limit?: number }
    >({
      query: ({ mode, tags, skill_ids, limit }) => {
        const params = new URLSearchParams()
        params.set('mode', mode)
        if (tags?.length) tags.forEach((t) => params.append('tags', t))
        if (skill_ids?.length)
          skill_ids.forEach((id) => params.append('skill_ids', id.toString()))
        if (limit != null) params.set('limit', String(limit))
        return `questions?${params.toString()}`
      },
      providesTags: ['Question'],
    }),
    submitPracticeAnswers: builder.mutation<
      SubmitAnswersResponse,
      SubmitAnswersRequest
    >({
      query: (body) => ({
        url: 'questions/submit',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Question'],
    }),
  }),
})

export const {
  useGetPracticeQuestionsQuery,
  useSubmitPracticeAnswersMutation,
} = practiceQuestionsApi
