import { baseApi } from '../baseApi';

// Define types for your API requests and responses
export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  is_active: boolean;
  full_name: string | null;
  phone: string | null;
  linkedin_url: string | null;
  current_company: string | null;
  skills_summary: string | null;
  education_summary: string | null;
  role: string | null;
  experience_years: number | null;
  cv_filename: string | null;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  user: User;
}

export interface UserInfoResponse {
  id: number;
  email: string;
  is_active: boolean;
  full_name: string | null;
  phone: string | null;
  linkedin_url: string | null;
  current_company: string | null;
  skills_summary: string | null;
  education_summary: string | null;
  role: string | null;
  experience_years: number | null;
  cv_filename: string | null;
  created_at: string;
}

/**
 * Authentication API endpoints
 * Injected into the base API
 */
export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Register mutation
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (credentials) => ({
        url: '/auth/register',
        method: 'POST',
        body: credentials,
      }),
      // Invalidate user cache on successful registration
      invalidatesTags: ['User'],
    }),

    // Login mutation
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      // Invalidate user cache on successful login
      invalidatesTags: ['User'],
    }),

    // Logout mutation
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      // Clear user cache on logout
      invalidatesTags: ['User'],
    }),

    // Get current user info
    getUserInfo: builder.query<UserInfoResponse, void>({
      query: () => '/auth/userinfo',
      // Cache user info with 'User' tag
      providesTags: ['User'],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetUserInfoQuery,
  useLazyGetUserInfoQuery,
} = authApi;
