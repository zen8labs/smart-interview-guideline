import { baseApi } from '../baseApi';

// Define types for Interview entities
export interface Interview {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface CreateInterviewRequest {
  title: string;
  description: string;
}

export interface UpdateInterviewRequest {
  id: string;
  title?: string;
  description?: string;
  status?: 'draft' | 'active' | 'completed';
}

/**
 * Interview API endpoints
 * Example CRUD operations for interviews
 */
export const interviewApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all interviews
    getInterviews: builder.query<Interview[], void>({
      query: () => '/interviews',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Interview' as const, id })),
              { type: 'Interview', id: 'LIST' },
            ]
          : [{ type: 'Interview', id: 'LIST' }],
    }),

    // Get single interview by ID
    getInterviewById: builder.query<Interview, string>({
      query: (id) => `/interviews/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Interview', id }],
    }),

    // Create new interview
    createInterview: builder.mutation<Interview, CreateInterviewRequest>({
      query: (body) => ({
        url: '/interviews',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Interview', id: 'LIST' }],
    }),

    // Update existing interview
    updateInterview: builder.mutation<Interview, UpdateInterviewRequest>({
      query: ({ id, ...patch }) => ({
        url: `/interviews/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Interview', id }],
    }),

    // Delete interview
    deleteInterview: builder.mutation<void, string>({
      query: (id) => ({
        url: `/interviews/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Interview', id }],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetInterviewsQuery,
  useGetInterviewByIdQuery,
  useCreateInterviewMutation,
  useUpdateInterviewMutation,
  useDeleteInterviewMutation,
} = interviewApi;
