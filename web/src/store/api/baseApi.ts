import type { BaseQueryFn } from '@reduxjs/toolkit/query'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getRefreshToken, removeTokens, saveToken } from '@/utils/authStorage'

// Define the base URL for your API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('token')
    if (token) {
      headers.set('authorization', `Bearer ${token}`)
    }
    return headers
  },
})

/**
 * On 401, try to refresh the access token and retry the request once.
 * If refresh fails or no refresh token, clear tokens and redirect to login.
 */
const baseQueryWithReauth: BaseQueryFn = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions)
  if (result.error?.status === 401) {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        })
        const data = await refreshRes.json().catch(() => ({}))
        if (refreshRes.ok && data.access_token) {
          saveToken(data.access_token)
          result = await baseQuery(args, api, extraOptions)
          return result
        }
      } catch {
        // ignore
      }
    }
    removeTokens()
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }
  return result
}

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Interview', 'Question', 'Company', 'Contribution', 'AdminContribution'],
  endpoints: () => ({}),
})
