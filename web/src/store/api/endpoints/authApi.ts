import { baseApi } from '../baseApi';

// Define types for your API requests and responses
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface UserInfoResponse {
  id: string;
  email: string;
  name: string;
  role: string;
}

/**
 * Authentication API endpoints
 * Injected into the base API
 */
export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Login mutation
    login: builder.mutation<LoginResponse, LoginRequest>({
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
  useLoginMutation,
  useLogoutMutation,
  useGetUserInfoQuery,
  useLazyGetUserInfoQuery,
} = authApi;
