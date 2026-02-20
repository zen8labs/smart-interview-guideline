import { baseApi } from '../baseApi'

export interface JDAnalysisResult {
  id: number
  raw_text: string
  extracted_keywords: {
    skills?: string[]
    domains?: string[]
    keywords?: string[]
  }
  created_at: string
  preparation_id: number
}

export interface SubmitAnalysisParams {
  text?: string
  file?: File
  linkedin_url?: string
}

export const analysisApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    submitAnalysis: builder.mutation<JDAnalysisResult, SubmitAnalysisParams>({
      query: (params) => {
        const formData = new FormData()
        if (params.text) formData.append('text', params.text)
        if (params.file) formData.append('file', params.file)
        if (params.linkedin_url) formData.append('linkedin_url', params.linkedin_url)
        return {
          url: '/analysis/submit',
          method: 'POST',
          body: formData,
        }
      },
      invalidatesTags: ['Interview'],
    }),
  }),
})

export const { useSubmitAnalysisMutation } = analysisApi
