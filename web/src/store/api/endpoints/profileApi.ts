import { baseApi } from '../baseApi'
import type { UserInfoResponse } from './authApi'

// Request types

export interface UpdateProfileRequest {
  full_name?: string | null
  phone?: string | null
  linkedin_url?: string | null
  current_company?: string | null
  skills_summary?: string | null
  education_summary?: string | null
  role?: string
  experience_years?: number | null
  preferred_language?: string | null
}

/**
 * Profile management API endpoints
 * Injected into the base API
 */
export const profileApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Update profile (role & experience)
    updateProfile: builder.mutation<UserInfoResponse, UpdateProfileRequest>({
      query: (data) => ({
        url: '/user/profile',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    // Upload CV file
    uploadCv: builder.mutation<UserInfoResponse, File>({
      query: (file) => {
        const formData = new FormData()
        formData.append('file', file)
        return {
          url: '/user/cv',
          method: 'POST',
          body: formData,
          // Do not set Content-Type — browser handles multipart boundary
          formData: true,
        }
      },
      invalidatesTags: ['User'],
    }),

    // Download CV file (returns blob)
    getCvFile: builder.query<Blob, void>({
      query: () => ({
        url: '/user/cv',
        responseHandler: (response: Response) => response.blob(),
      }),
    }),

    // Delete CV file
    deleteCv: builder.mutation<void, void>({
      query: () => ({
        url: '/user/cv',
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
  }),
})

export const {
  useUpdateProfileMutation,
  useUploadCvMutation,
  useLazyGetCvFileQuery,
  useDeleteCvMutation,
} = profileApi
