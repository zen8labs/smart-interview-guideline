import { z } from 'zod'

/**
 * Allowed user roles — must match backend UserRole enum values.
 */
export const USER_ROLES = [
  { value: 'backend', label: 'Backend Developer' },
  { value: 'frontend', label: 'Frontend Developer' },
  { value: 'fullstack', label: 'Full-Stack Developer' },
  { value: 'tester', label: 'QA / Tester' },
  { value: 'ba', label: 'Business Analyst' },
  { value: 'devops', label: 'DevOps Engineer' },
  { value: 'data', label: 'Data Engineer / Scientist' },
  { value: 'mobile', label: 'Mobile Developer' },
] as const

export const roleValues = USER_ROLES.map((r) => r.value)

/**
 * Profile form validation schema
 */
export const profileSchema = z.object({
  role: z
    .string()
    .min(1, 'Please select a role')
    .refine((val) => roleValues.includes(val as typeof roleValues[number]), {
      message: 'Invalid role selected',
    }),
  experience_years: z
    .number({ invalid_type_error: 'Must be a number' })
    .int('Must be a whole number')
    .min(0, 'Cannot be negative')
    .max(50, 'Maximum 50 years'),
})

export type ProfileFormData = z.infer<typeof profileSchema>
