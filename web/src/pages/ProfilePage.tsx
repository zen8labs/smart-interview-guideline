import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  profileSchema,
  type ProfileFormData,
  USER_ROLES,
} from '../schemas/profileSchemas'
import { useGetUserInfoQuery } from '../store/api/endpoints/authApi'
import {
  useUpdateProfileMutation,
  useUploadCvMutation,
  useDeleteCvMutation,
} from '../store/api/endpoints/profileApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, Check, FileText, Trash2, Upload } from 'lucide-react'

const ACCEPTED_CV_TYPES = '.pdf,.docx,.txt'
const MAX_CV_SIZE_MB = 10

export function ProfilePage() {
  const { data: user, isLoading: isLoadingUser } = useGetUserInfoQuery()
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation()
  const [uploadCv, { isLoading: isUploading }] = useUploadCvMutation()
  const [deleteCv, { isLoading: isDeleting }] = useDeleteCvMutation()

  const [profileMessage, setProfileMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [cvMessage, setCvMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      linkedin_url: '',
      current_company: '',
      skills_summary: '',
      education_summary: '',
      role: '',
      experience_years: 0,
    },
  })

  // Reset form when user data loads (including after CV upload + LLM auto-fill)
  useEffect(() => {
    if (user != null) {
      reset({
        full_name: user.full_name ?? '',
        phone: user.phone ?? '',
        linkedin_url: user.linkedin_url ?? '',
        current_company: user.current_company ?? '',
        skills_summary: user.skills_summary ?? '',
        education_summary: user.education_summary ?? '',
        role: user.role ?? '',
        experience_years: user.experience_years ?? 0,
      })
    }
  }, [user, reset])

  const onSubmitProfile = useCallback(
    async (data: ProfileFormData) => {
      try {
        setProfileMessage(null)
        await updateProfile({
          full_name: data.full_name || null,
          phone: data.phone || null,
          linkedin_url: data.linkedin_url || null,
          current_company: data.current_company || null,
          skills_summary: data.skills_summary || null,
          education_summary: data.education_summary || null,
          role: data.role,
          experience_years: data.experience_years,
        }).unwrap()
        setProfileMessage({ type: 'success', text: 'Profile updated successfully.' })
      } catch (err: unknown) {
        const apiError = err as { data?: { detail?: string } }
        setProfileMessage({
          type: 'error',
          text: apiError?.data?.detail || 'Failed to update profile.',
        })
      }
    },
    [updateProfile],
  )

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      // Client-side size check
      if (file.size > MAX_CV_SIZE_MB * 1024 * 1024) {
        setCvMessage({
          type: 'error',
          text: `File too large. Maximum size is ${MAX_CV_SIZE_MB} MB.`,
        })
        return
      }

      try {
        setCvMessage(null)
        await uploadCv(file).unwrap()
        setCvMessage({
          type: 'success',
          text: 'CV uploaded. Profile fields have been filled from your CV—please review and save.',
        })
      } catch (err: unknown) {
        const apiError = err as { data?: { detail?: string } }
        setCvMessage({
          type: 'error',
          text: apiError?.data?.detail || 'Failed to upload CV.',
        })
      }

      // Reset input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [uploadCv],
  )

  const handleDeleteCv = useCallback(async () => {
    try {
      setCvMessage(null)
      await deleteCv().unwrap()
      setCvMessage({ type: 'success', text: 'CV deleted.' })
    } catch (err: unknown) {
      const apiError = err as { data?: { detail?: string } }
      setCvMessage({
        type: 'error',
        text: apiError?.data?.detail || 'Failed to delete CV.',
      })
    }
  }, [deleteCv])

  if (isLoadingUser) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your professional profile to get tailored interview preparation.
        </p>
      </div>

      {/* Profile Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Professional Info</CardTitle>
          <CardDescription>
            Select your role and experience level so we can personalize your roadmap.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmitProfile)}>
          <CardContent className="space-y-4 mb-4">
            {profileMessage && (
              <Alert variant={profileMessage.type === 'error' ? 'destructive' : 'default'}>
                {profileMessage.type === 'error' ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                <AlertDescription>{profileMessage.text}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="full_name">Full name</Label>
              <Controller
                name="full_name"
                control={control}
                render={({ field }) => (
                  <Input
                    id="full_name"
                    type="text"
                    placeholder="e.g. Nguyen Van A"
                    {...field}
                    value={field.value ?? ''}
                    aria-invalid={errors.full_name ? 'true' : 'false'}
                  />
                )}
              />
              {errors.full_name && (
                <p className="text-sm text-destructive">{errors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="e.g. +84 123 456 789"
                    {...field}
                    value={field.value ?? ''}
                    aria-invalid={errors.phone ? 'true' : 'false'}
                  />
                )}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Controller
                name="linkedin_url"
                control={control}
                render={({ field }) => (
                  <Input
                    id="linkedin_url"
                    type="url"
                    placeholder="https://linkedin.com/in/yourprofile"
                    {...field}
                    value={field.value ?? ''}
                    aria-invalid={errors.linkedin_url ? 'true' : 'false'}
                  />
                )}
              />
              {errors.linkedin_url && (
                <p className="text-sm text-destructive">{errors.linkedin_url.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_company">Current company</Label>
              <Controller
                name="current_company"
                control={control}
                render={({ field }) => (
                  <Input
                    id="current_company"
                    type="text"
                    placeholder="e.g. ABC Technology"
                    {...field}
                    value={field.value ?? ''}
                    aria-invalid={errors.current_company ? 'true' : 'false'}
                  />
                )}
              />
              {errors.current_company && (
                <p className="text-sm text-destructive">{errors.current_company.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills_summary">Skills summary</Label>
              <Controller
                name="skills_summary"
                control={control}
                render={({ field }) => (
                  <textarea
                    id="skills_summary"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Main skills, technologies (e.g. Python, React, SQL)"
                    {...field}
                    value={field.value ?? ''}
                    rows={3}
                    aria-invalid={errors.skills_summary ? 'true' : 'false'}
                  />
                )}
              />
              {errors.skills_summary && (
                <p className="text-sm text-destructive">{errors.skills_summary.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="education_summary">Education summary</Label>
              <Controller
                name="education_summary"
                control={control}
                render={({ field }) => (
                  <textarea
                    id="education_summary"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Degree(s), school(s)"
                    {...field}
                    value={field.value ?? ''}
                    rows={3}
                    aria-invalid={errors.education_summary ? 'true' : 'false'}
                  />
                )}
              />
              {errors.education_summary && (
                <p className="text-sm text-destructive">{errors.education_summary.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value)}
                  >
                    <SelectTrigger
                      id="role"
                      aria-invalid={errors.role ? 'true' : 'false'}
                    >
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role && (
                <p className="text-sm text-destructive">{errors.role.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience_years">Years of Experience</Label>
              <Controller
                name="experience_years"
                control={control}
                render={({ field }) => (
                  <Input
                    id="experience_years"
                    type="number"
                    min={0}
                    max={50}
                    placeholder="e.g. 3"
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    onBlur={field.onBlur}
                    aria-invalid={errors.experience_years ? 'true' : 'false'}
                  />
                )}
              />
              {errors.experience_years && (
                <p className="text-sm text-destructive">
                  {errors.experience_years.message}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter>
            <Button
              type="submit"
              disabled={isUpdating || !isDirty}
            >
              {isUpdating ? 'Saving...' : 'Save Profile'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* CV Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle>CV / Resume</CardTitle>
          <CardDescription>
            Upload your CV so the AI can better match your skills with the job description.
            Accepted formats: PDF, DOCX, TXT (max {MAX_CV_SIZE_MB} MB).
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {cvMessage && (
            <Alert variant={cvMessage.type === 'error' ? 'destructive' : 'default'}>
              {cvMessage.type === 'error' ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              <AlertDescription>{cvMessage.text}</AlertDescription>
            </Alert>
          )}

          {/* Current CV display */}
          {user?.cv_filename ? (
            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{user.cv_filename}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteCv}
                disabled={isDeleting}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-1 h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Remove'}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No CV uploaded yet.</p>
          )}

          <Separator />

          {/* Upload button + hidden file input */}
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_CV_TYPES}
              onChange={handleFileSelect}
              className="hidden"
              id="cv-upload"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploading
                ? 'Uploading...'
                : user?.cv_filename
                  ? 'Replace CV'
                  : 'Upload CV'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
