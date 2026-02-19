import { baseApi } from '../baseApi'

// Types
export interface Question {
  id: number
  title: string
  content: string
  question_type: 'multiple_choice' | 'true_false' | 'scenario' | 'coding'
  options: Record<string, any>
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  estimated_time_seconds: number | null
  explanation: string | null
  status: 'draft' | 'pending_review' | 'approved' | 'rejected'
  is_official: boolean
  source_type: 'on_fly' | 'admin_curated' | 'user_contributed' | 'crowdsourced'
  created_by_user_id: number
  approved_by_admin_id: number | null
  tags: string[]
  version: number
  created_at: string
  updated_at: string
}

export interface QuestionListResponse {
  total: number
  page: number
  page_size: number
  items: Question[]
}

export interface QuestionCreate {
  title: string
  content: string
  question_type: 'multiple_choice' | 'true_false' | 'scenario' | 'coding'
  options: Record<string, any>
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  estimated_time_seconds?: number
  explanation?: string
  tags?: string[]
  skill_ids?: number[]
}

export interface QuestionUpdate {
  title?: string
  content?: string
  question_type?: 'multiple_choice' | 'true_false' | 'scenario' | 'coding'
  options?: Record<string, any>
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  estimated_time_seconds?: number
  explanation?: string
  tags?: string[]
  skill_ids?: number[]
}

export interface QuestionFilterParams {
  status?: string[]
  question_type?: string[]
  difficulty?: string[]
  skill_ids?: number[]
  tags?: string[]
  source_type?: string[]
  is_official?: boolean
  created_by_user_id?: number
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  page?: number
  page_size?: number
}

export interface Skill {
  id: number
  name: string
  slug: string
  category: string
  relevance_score: number
}

export interface KnowledgeLink {
  id: number
  knowledge_id: number
  link_type: 'prerequisite' | 'remedial' | 'advanced' | 'related'
  relevance_score: number
  created_by: string
  created_at: string
}

export interface QuestionKnowledgeLinkCreate {
  question_id: number
  knowledge_id: number
  link_type: 'prerequisite' | 'remedial' | 'advanced' | 'related'
  relevance_score?: number
}

export interface BulkApproveRequest {
  question_ids: number[]
}

export interface BulkRejectRequest {
  question_ids: number[]
  feedback?: string
}

// API endpoints
export const questionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // List questions with filters
    listQuestions: builder.query<QuestionListResponse, QuestionFilterParams>({
      query: (params) => {
        const queryParams = new URLSearchParams()
        
        if (params.status) params.status.forEach(s => queryParams.append('status', s))
        if (params.question_type) params.question_type.forEach(t => queryParams.append('question_type', t))
        if (params.difficulty) params.difficulty.forEach(d => queryParams.append('difficulty', d))
        if (params.skill_ids) params.skill_ids.forEach(id => queryParams.append('skill_ids', id.toString()))
        if (params.tags) params.tags.forEach(t => queryParams.append('tags', t))
        if (params.source_type) params.source_type.forEach(s => queryParams.append('source_type', s))
        if (params.is_official !== undefined) queryParams.append('is_official', params.is_official.toString())
        if (params.created_by_user_id) queryParams.append('created_by_user_id', params.created_by_user_id.toString())
        if (params.search) queryParams.append('search', params.search)
        if (params.sort_by) queryParams.append('sort_by', params.sort_by)
        if (params.sort_order) queryParams.append('sort_order', params.sort_order)
        if (params.page) queryParams.append('page', params.page.toString())
        if (params.page_size) queryParams.append('page_size', params.page_size.toString())
        
        return `/admin/questions?${queryParams.toString()}`
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'Question' as const, id })),
              { type: 'Question', id: 'LIST' },
            ]
          : [{ type: 'Question', id: 'LIST' }],
    }),

    // Get single question
    getQuestion: builder.query<Question, number>({
      query: (id) => `/admin/questions/${id}`,
      providesTags: (result, error, id) => [{ type: 'Question', id }],
    }),

    // Create question
    createQuestion: builder.mutation<Question, QuestionCreate>({
      query: (data) => ({
        url: '/admin/questions',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Question', id: 'LIST' }],
    }),

    // Update question
    updateQuestion: builder.mutation<Question, { id: number; data: QuestionUpdate }>({
      query: ({ id, data }) => ({
        url: `/admin/questions/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Question', id },
        { type: 'Question', id: 'LIST' },
      ],
    }),

    // Delete question
    deleteQuestion: builder.mutation<void, number>({
      query: (id) => ({
        url: `/admin/questions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Question', id },
        { type: 'Question', id: 'LIST' },
      ],
    }),

    // Approve question
    approveQuestion: builder.mutation<Question, number>({
      query: (id) => ({
        url: `/admin/questions/${id}/approve`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Question', id },
        { type: 'Question', id: 'LIST' },
      ],
    }),

    // Reject question
    rejectQuestion: builder.mutation<Question, { id: number; feedback?: string }>({
      query: ({ id, feedback }) => ({
        url: `/admin/questions/${id}/reject`,
        method: 'PATCH',
        body: feedback ? { feedback } : undefined,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Question', id },
        { type: 'Question', id: 'LIST' },
      ],
    }),

    // Promote to official
    promoteToOfficial: builder.mutation<Question, number>({
      query: (id) => ({
        url: `/admin/questions/${id}/promote`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Question', id },
        { type: 'Question', id: 'LIST' },
      ],
    }),

    // Link question to knowledge
    linkQuestionToKnowledge: builder.mutation<{ message: string }, QuestionKnowledgeLinkCreate>({
      query: ({ question_id, ...data }) => ({
        url: `/admin/questions/${question_id}/link-knowledge`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { question_id }) => [
        { type: 'Question', id: question_id },
      ],
    }),

    // Assign skills to question
    assignSkillsToQuestion: builder.mutation<{ message: string }, { id: number; skill_ids: number[] }>({
      query: ({ id, skill_ids }) => ({
        url: `/admin/questions/${id}/assign-skills`,
        method: 'POST',
        body: skill_ids,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Question', id },
      ],
    }),

    // Get question skills
    getQuestionSkills: builder.query<Skill[], number>({
      query: (id) => `/admin/questions/${id}/skills`,
      providesTags: (result, error, id) => [{ type: 'Question', id }],
    }),

    // Get question knowledge links
    getQuestionKnowledgeLinks: builder.query<KnowledgeLink[], number>({
      query: (id) => `/admin/questions/${id}/knowledge-links`,
      providesTags: (result, error, id) => [{ type: 'Question', id }],
    }),

    // Bulk approve
    bulkApproveQuestions: builder.mutation<{ message: string; approved_count: number }, BulkApproveRequest>({
      query: (data) => ({
        url: '/admin/questions/bulk-approve',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Question', id: 'LIST' }],
    }),

    // Bulk reject
    bulkRejectQuestions: builder.mutation<{ message: string; rejected_count: number }, BulkRejectRequest>({
      query: (data) => ({
        url: '/admin/questions/bulk-reject',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Question', id: 'LIST' }],
    }),
  }),
})

// Export hooks
export const {
  useListQuestionsQuery,
  useGetQuestionQuery,
  useCreateQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  useApproveQuestionMutation,
  useRejectQuestionMutation,
  usePromoteToOfficialMutation,
  useLinkQuestionToKnowledgeMutation,
  useAssignSkillsToQuestionMutation,
  useGetQuestionSkillsQuery,
  useGetQuestionKnowledgeLinksQuery,
  useBulkApproveQuestionsMutation,
  useBulkRejectQuestionsMutation,
} = questionsApi
