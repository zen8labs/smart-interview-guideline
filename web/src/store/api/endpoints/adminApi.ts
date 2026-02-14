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
      query: (params = {}) => {
        const searchParams = new URLSearchParams()
        if (params.page) searchParams.append('page', params.page.toString())
        if (params.page_size) searchParams.append('page_size', params.page_size.toString())
        if (params.email) searchParams.append('email', params.email)
        if (params.is_active !== undefined) searchParams.append('is_active', params.is_active.toString())
        if (params.is_admin !== undefined) searchParams.append('is_admin', params.is_admin.toString())

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
} = adminApi
