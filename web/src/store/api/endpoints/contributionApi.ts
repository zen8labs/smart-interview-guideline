import { baseApi } from '../baseApi'

export type ContributionStatus = 'pending' | 'approved' | 'rejected'

export interface Contribution {
  id: number
  user_id: number
  company_id: number
  company_name?: string
  preparation_id: number | null
  job_position: string | null
  jd_content: string
  question_info: Record<string, unknown>[]
  candidate_responses: string | null
  status: ContributionStatus
  approved_at: string | null
  created_at: string
}

export interface ContributionCreateInput {
  company_id: number
  preparation_id?: number | null
  job_position?: string | null
  jd_content: string
  question_info?: Record<string, unknown>[]
  candidate_responses?: string | null
}

export const contributionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listMyContributions: builder.query<
      Contribution[],
      { preparation_id?: number; limit?: number } | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams()
        if (params?.preparation_id != null) searchParams.set('preparation_id', String(params.preparation_id))
        if (params?.limit != null) searchParams.set('limit', String(params.limit))
        const qs = searchParams.toString()
        return `contributions${qs ? `?${qs}` : ''}`
      },
      providesTags: (result) =>
        result
          ? [...result.map((c) => ({ type: 'Contribution' as const, id: c.id })), 'Contribution']
          : ['Contribution'],
    }),
    getContribution: builder.query<Contribution, number>({
      query: (id) => `contributions/${id}`,
      providesTags: (result, err, id) => [{ type: 'Contribution', id }],
    }),
    createContribution: builder.mutation<Contribution, ContributionCreateInput>({
      query: (body) => ({
        url: 'contributions',
        method: 'POST',
        body: {
          company_id: body.company_id,
          preparation_id: body.preparation_id ?? null,
          job_position: body.job_position ?? null,
          jd_content: body.jd_content,
          question_info: body.question_info ?? [],
          candidate_responses: body.candidate_responses ?? null,
        },
      }),
      invalidatesTags: ['Contribution'],
    }),
  }),
})

export const {
  useListMyContributionsQuery,
  useGetContributionQuery,
  useCreateContributionMutation,
} = contributionApi
