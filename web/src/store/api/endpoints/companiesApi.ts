import { baseApi } from '../baseApi'

export interface Company {
  id: number
  name: string
  created_at: string
}

export const companiesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listCompanies: builder.query<Company[], { q?: string; limit?: number } | void>({
      query: (params) => {
        const searchParams = new URLSearchParams()
        if (params?.q) searchParams.set('q', params.q)
        if (params?.limit) searchParams.set('limit', String(params.limit))
        const qs = searchParams.toString()
        return `companies${qs ? `?${qs}` : ''}`
      },
      providesTags: (result) =>
        result ? [...result.map((c) => ({ type: 'Company' as const, id: c.id })), 'Company'] : ['Company'],
    }),
    getCompany: builder.query<Company, number>({
      query: (id) => `companies/${id}`,
      providesTags: (result, err, id) => [{ type: 'Company', id }],
    }),
    createCompany: builder.mutation<Company, { name: string }>({
      query: (body) => ({
        url: 'companies',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Company'],
    }),
  }),
})

export const {
  useListCompaniesQuery,
  useGetCompanyQuery,
  useCreateCompanyMutation,
} = companiesApi
