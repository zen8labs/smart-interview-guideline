import { baseApi } from '../baseApi'

export interface PreparationItem {
  id: number
  user_id: number
  jd_analysis_id: number
  status: string
  roadmap_id: number | null
  created_at: string
}

export interface MemoryScanQuestion {
  id: string
  question_text: string
  question_type: string
  options: Record<string, unknown>
}

export interface MemoryScanSubmitRequest {
  answers: { question_id: string; selected_answer: string }[]
}

export interface MemoryScanSubmitResponse {
  session_id: number
  score_percent: number
  total_questions: number
  correct_count: number
  preparation_id: number
  roadmap_ready: boolean
}

export interface RoadmapTaskReference {
  type?: 'youtube' | 'blog' | 'docs' | 'course' | 'link'
  title: string
  url: string
}

export interface RoadmapTaskMeta {
  image_url?: string
  references?: RoadmapTaskReference[]
}

export interface RoadmapTask {
  id: number
  roadmap_id: number
  day_index: number
  title: string
  content: string
  content_type: string
  knowledge_id: number | null
  sort_order: number
  is_completed: boolean
  completed_at: string | null
  created_at: string
  meta?: RoadmapTaskMeta
}

export const preparationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listPreparations: builder.query<PreparationItem[], void>({
      query: () => 'preparations',
      providesTags: ['Interview'],
    }),
    getPreparation: builder.query<PreparationItem, number>({
      query: (id) => `preparations/${id}`,
      providesTags: (result, err, id) => [{ type: 'Interview', id: `prep-${id}` }],
    }),
    getMemoryScanQuestions: builder.query<
      MemoryScanQuestion[],
      { preparationId: number; source?: 'warehouse' | 'ai' | 'auto' }
    >({
      query: ({ preparationId, source = 'auto' }) =>
        `preparations/${preparationId}/memory-scan-questions?source=${source}`,
      providesTags: (result, err, { preparationId }) => [
        { type: 'Interview', id: `prep-${preparationId}` },
      ],
    }),
    submitMemoryScan: builder.mutation<
      MemoryScanSubmitResponse,
      { preparationId: number; body: MemoryScanSubmitRequest }
    >({
      query: ({ preparationId, body }) => ({
        url: `preparations/${preparationId}/memory-scan/submit`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, err, { preparationId }) => [
        { type: 'Interview', id: `prep-${preparationId}` },
        'Interview',
      ],
    }),
    getPreparationRoadmap: builder.query<
      { roadmap_id: number | null; tasks: RoadmapTask[] },
      number
    >({
      query: (preparationId) => `preparations/${preparationId}/roadmap`,
      providesTags: (result, err, preparationId) => [
        { type: 'Interview', id: `prep-${preparationId}` },
      ],
    }),
    getSelfCheckQuestions: builder.query<MemoryScanQuestion[], number>({
      query: (preparationId) => `preparations/${preparationId}/self-check-questions`,
      providesTags: (result, err, preparationId) => [
        { type: 'Interview', id: `prep-${preparationId}` },
      ],
    }),
  }),
})

export const {
  useListPreparationsQuery,
  useGetPreparationQuery,
  useGetMemoryScanQuestionsQuery,
  useSubmitMemoryScanMutation,
  useGetPreparationRoadmapQuery,
  useGetSelfCheckQuestionsQuery,
} = preparationApi
