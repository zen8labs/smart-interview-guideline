import { baseApi } from '../baseApi'

// Admin-specific types
export interface AdminLoginRequest {
  email: string
  password: string
}

export interface AdminUser {
  id: number
  email: string
  is_active: boolean
  is_admin: boolean
  role: string | null
  experience_years: number | null
  cv_filename: string | null
  created_at: string
  updated_at: string
}

export interface UserListItem {
  id: number
  email: string
  is_active: boolean
  is_admin: boolean
  role: string | null
  experience_years: number | null
  created_at: string
  updated_at: string
}

export interface UserListResponse {
  users: UserListItem[]
  total: number
  page: number
  page_size: number
}

export interface UserListParams {
  page?: number
  page_size?: number
  email?: string
  is_active?: boolean
  is_admin?: boolean
}

export interface BanUserRequest {
  reason?: string
}

export type AdminContributionStatus = 'pending' | 'approved' | 'rejected'

export interface AdminContribution {
  id: number
  user_id: number
  company_id: number
  company_name?: string
  user_email?: string
  preparation_id: number | null
  job_position: string | null
  jd_content: string
  question_info: Record<string, unknown>[]
  candidate_responses: string | null
  status: AdminContributionStatus
  approved_at: string | null
  created_at: string
}

export interface AdminContributionsParams {
  status?: AdminContributionStatus
  page?: number
  page_size?: number
}

/**
 * Admin API endpoints
 */
export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Admin login
    adminLogin: builder.mutation<{ access_token: string; token_type: string; user: AdminUser }, AdminLoginRequest>({
      query: (credentials) => ({
        url: '/admin/login',
        method: 'POST',
        body: credentials,
      }),
    }),

    // List users with pagination and filtering
    listUsers: builder.query<UserListResponse, UserListParams | void>({
      query: (params) => {
        const p = params ?? {}
        const searchParams = new URLSearchParams()
        if (p.page) searchParams.append('page', p.page.toString())
        if (p.page_size) searchParams.append('page_size', p.page_size.toString())
        if (p.email) searchParams.append('email', p.email)
        if (p.is_active !== undefined) searchParams.append('is_active', p.is_active.toString())
        if (p.is_admin !== undefined) searchParams.append('is_admin', p.is_admin.toString())

        return `/admin/users?${searchParams.toString()}`
      },
      providesTags: ['User'],
    }),

    // Get user detail
    getUserDetail: builder.query<AdminUser, number>({
      query: (userId) => `/admin/users/${userId}`,
      providesTags: (_result, _error, userId) => [{ type: 'User', id: userId }],
    }),

    // Ban user
    banUser: builder.mutation<AdminUser, { userId: number; reason?: string }>({
      query: ({ userId, reason }) => ({
        url: `/admin/users/${userId}/ban`,
        method: 'PATCH',
        body: { reason },
      }),
      invalidatesTags: (_result, _error, { userId }) => [{ type: 'User', id: userId }, 'User'],
    }),

    // Unban user
    unbanUser: builder.mutation<AdminUser, number>({
      query: (userId) => ({
        url: `/admin/users/${userId}/unban`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, userId) => [{ type: 'User', id: userId }, 'User'],
    }),

    // List contributions (admin moderation)
    listAdminContributions: builder.query<AdminContribution[], AdminContributionsParams | void>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams()
        if (params?.status) searchParams.append('status', params.status)
        if (params?.page) searchParams.append('page', params.page.toString())
        if (params?.page_size) searchParams.append('page_size', params.page_size.toString())
        return `/admin/contributions?${searchParams.toString()}`
      },
      providesTags: (result) =>
        result
          ? [...result.map((c) => ({ type: 'AdminContribution' as const, id: c.id })), 'AdminContribution']
          : ['AdminContribution'],
    }),

    getAdminContributionsCount: builder.query<{ total: number }, { status?: AdminContributionStatus } | void>({
      query: (params) => {
        const searchParams = new URLSearchParams()
        if (params?.status) searchParams.append('status', params.status)
        return `/admin/contributions/count?${searchParams.toString()}`
      },
      providesTags: ['AdminContribution'],
    }),

    getAdminContribution: builder.query<AdminContribution, number>({
      query: (id) => `/admin/contributions/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'AdminContribution', id }],
    }),

    approveContribution: builder.mutation<AdminContribution, number>({
      query: (id) => ({
        url: `/admin/contributions/${id}/approve`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _err, id) => [{ type: 'AdminContribution', id }, 'AdminContribution'],
    }),

    rejectContribution: builder.mutation<AdminContribution, number>({
      query: (id) => ({
        url: `/admin/contributions/${id}/reject`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _err, id) => [{ type: 'AdminContribution', id }, 'AdminContribution'],
    }),
  }),
})

export const {
  useAdminLoginMutation,
  useListUsersQuery,
  useLazyListUsersQuery,
  useGetUserDetailQuery,
  useLazyGetUserDetailQuery,
  useBanUserMutation,
  useUnbanUserMutation,
  useListAdminContributionsQuery,
  useGetAdminContributionsCountQuery,
  useGetAdminContributionQuery,
  useApproveContributionMutation,
  useRejectContributionMutation,
} = adminApi
