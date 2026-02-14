import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Define the base URL for your API
// You can use environment variables for different environments
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

/**
 * Base API configuration for RTK Query
 * All API endpoints will be injected into this base API
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    // Add default headers here if needed
    prepareHeaders: (headers) => {
      // Add authentication token if available
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      // Note: Do NOT set Content-Type here.
      // fetchBaseQuery sets it to application/json automatically for JSON bodies.
      // For FormData (file uploads), the browser must set it with the boundary.
      return headers;
    },
  }),
  // Define tag types for cache invalidation
  tagTypes: ['User', 'Interview', 'Question'],
  // Endpoints will be injected in separate files
  endpoints: () => ({}),
});
