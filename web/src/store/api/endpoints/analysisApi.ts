import { baseApi } from '../baseApi'

export interface SkillItem {
  name: string
  level?: string | null
  constraints?: string | null
  notes?: string | null
}

export interface DomainItem {
  name: string
  description?: string | null
}

export interface KeywordItem {
  term: string
  context?: string | null
}

export interface ExtractedKeywords {
  skills?: (string | SkillItem)[]
  domains?: (string | DomainItem)[]
  keywords?: (string | KeywordItem)[]
  requirements_summary?: string | null
}

export interface JDAnalysisResult {
  id: number
  raw_text: string
  extracted_keywords: ExtractedKeywords
  created_at: string
  preparation_id: number
}

export interface SubmitAnalysisParams {
  text?: string
  file?: File
  linkedin_url?: string
}

export interface ExtractTextResult {
  raw_text: string
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
    extractJdText: builder.mutation<ExtractTextResult, SubmitAnalysisParams>({
      query: (params) => {
        const formData = new FormData()
        if (params.text) formData.append('text', params.text)
        if (params.file) formData.append('file', params.file)
        if (params.linkedin_url) formData.append('linkedin_url', params.linkedin_url)
        return {
          url: '/analysis/extract-text',
          method: 'POST',
          body: formData,
        }
      },
    }),
  }),
})

export const { useSubmitAnalysisMutation, useExtractJdTextMutation } = analysisApi
