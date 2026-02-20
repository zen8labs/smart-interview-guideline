import { baseApi } from '../baseApi'

export interface DailyTaskItem {
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
}

export interface DailyRoadmapResponse {
  roadmap_id: number
  day_index: number
  tasks: DailyTaskItem[]
}

export const roadmapApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDailyRoadmap: builder.query<DailyRoadmapResponse, void>({
      query: () => 'roadmap/daily',
      providesTags: ['Interview'],
    }),
    completeTask: builder.mutation<DailyTaskItem, number>({
      query: (taskId) => ({
        url: `roadmap/task/${taskId}/complete`,
        method: 'POST',
      }),
      invalidatesTags: ['Interview'],
    }),
  }),
})

export const { useGetDailyRoadmapQuery, useCompleteTaskMutation } = roadmapApi
