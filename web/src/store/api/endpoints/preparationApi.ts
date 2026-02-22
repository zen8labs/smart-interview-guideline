import { baseApi } from '../baseApi'
import type { JDAnalysisResult } from './analysisApi'

export interface SubmitJdParams {
  text?: string
  file?: File
  linkedin_url?: string
}

export interface LastMemoryScanResult {
  score_percent: number
  correct_count: number
  total_questions: number
  knowledge_assessment?: KnowledgeAreaAssessment[]
  session_id?: number
  /** Báo cáo đánh giá từ LLM (Markdown), dựa trên bài test + đáp án + kết quả chấm */
  llm_report?: string | null
}

export interface PreparationItem {
  id: number
  user_id: number
  jd_analysis_id: number
  status: string
  roadmap_id: number | null
  /** Vùng kiến thức xác định từ JD + profile; dùng thống nhất cho memory scan, roadmap, self-check */
  knowledge_areas?: string[]
  last_memory_scan_result?: LastMemoryScanResult | null
  created_at: string
  /** Từ JD analysis meta (chỉ có khi list preparations) */
  company_name?: string | null
  job_title?: string | null
}

export interface MemoryScanQuestion {
  id: string
  question_text: string
  question_type: string
  options: Record<string, unknown>
}

/** Câu hỏi giả lập phỏng vấn (self-check): chỉ nội dung, không trắc nghiệm/chấm điểm */
export interface SelfCheckQuestion {
  id: string
  question_text: string
}

export interface MemoryScanSubmitRequest {
  answers: { question_id: string; selected_answer: string }[]
}

export interface KnowledgeAreaAssessment {
  knowledge_area: string
  level: number // 1-5
  correct_count: number
  total_count: number
}

export interface MemoryScanSubmitResponse {
  session_id: number
  score_percent: number
  total_questions: number
  correct_count: number
  preparation_id: number
  roadmap_ready: boolean
  knowledge_assessment?: KnowledgeAreaAssessment[]
  /** Báo cáo đánh giá từ LLM (Markdown) */
  llm_report?: string | null
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
    createPreparation: builder.mutation<PreparationItem, void>({
      query: () => ({
        url: 'preparations',
        method: 'POST',
      }),
      invalidatesTags: ['Interview'],
    }),
    submitJdForPreparation: builder.mutation<
      JDAnalysisResult,
      { preparationId: number; params: SubmitJdParams }
    >({
      query: ({ preparationId, params }) => {
        const formData = new FormData()
        if (params.text) formData.append('text', params.text)
        if (params.file) formData.append('file', params.file)
        if (params.linkedin_url) formData.append('linkedin_url', params.linkedin_url)
        return {
          url: `preparations/${preparationId}/submit-jd`,
          method: 'POST',
          body: formData,
        }
      },
      invalidatesTags: (result, err, { preparationId }) => [
        { type: 'Interview', id: `prep-${preparationId}` },
        'Interview',
      ],
    }),
    getPreparationJdAnalysis: builder.query<JDAnalysisResult, number>({
      query: (preparationId) => `preparations/${preparationId}/jd-analysis`,
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
    createRoadmap: builder.mutation<
      { roadmap_id: number; preparation_id: number },
      number
    >({
      query: (preparationId) => ({
        url: `preparations/${preparationId}/create-roadmap`,
        method: 'POST',
      }),
      invalidatesTags: (result, err, preparationId) => [
        { type: 'Interview', id: `prep-${preparationId}` },
        'Interview',
      ],
    }),
    resetMemoryScan: builder.mutation<{ ok: boolean }, number>({
      query: (preparationId) => ({
        url: `preparations/${preparationId}/memory-scan/reset`,
        method: 'POST',
      }),
      invalidatesTags: (result, err, preparationId) => [
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
    getSelfCheckQuestions: builder.query<SelfCheckQuestion[], number>({
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
  useCreatePreparationMutation,
  useSubmitJdForPreparationMutation,
  useGetPreparationJdAnalysisQuery,
  useGetMemoryScanQuestionsQuery,
  useSubmitMemoryScanMutation,
  useCreateRoadmapMutation,
  useResetMemoryScanMutation,
  useGetPreparationRoadmapQuery,
  useGetSelfCheckQuestionsQuery,
} = preparationApi
