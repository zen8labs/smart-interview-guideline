import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useGetUserInfoQuery } from '@/store/api/endpoints/authApi'
import { useUpdateProfileMutation } from '@/store/api/endpoints/profileApi'
import { SUPPORTED_LANGUAGES } from '@/i18n'
import { Button } from '@/components/ui/button'
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
import { AlertCircle, Check } from 'lucide-react'

const settingsLanguageSchema = z.object({
  preferred_language: z.enum(['en', 'vi']),
})

type SettingsLanguageFormData = z.infer<typeof settingsLanguageSchema>

export function SettingsPage() {
  const { t } = useTranslation()
  const { data: user, isLoading: isLoadingUser } = useGetUserInfoQuery()
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation()
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<SettingsLanguageFormData>({
    resolver: zodResolver(settingsLanguageSchema),
    defaultValues: {
      preferred_language: 'en',
    },
  })

  useEffect(() => {
    if (user != null) {
      const lang = user.preferred_language?.trim()
      reset({
        preferred_language:
          lang === 'vi' || lang === 'en' ? (lang as 'en' | 'vi') : 'en',
      })
    }
  }, [user, reset])

  const onSubmit = useCallback(
    async (data: SettingsLanguageFormData) => {
      try {
        setMessage(null)
        await updateProfile({
          preferred_language: data.preferred_language,
        }).unwrap()
        setMessage({ type: 'success', text: t('settings.saved') })
      } catch (err: unknown) {
        const apiError = err as { data?: { detail?: string } }
        setMessage({
          type: 'error',
          text: apiError?.data?.detail ?? t('settings.saveFailed'),
        })
      }
    },
    [updateProfile, t],
  )

  if (isLoadingUser) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('settings.title')}
        </h1>
        <p className="text-muted-foreground">{t('settings.subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.preferences')}</CardTitle>
          <CardDescription>{t('settings.preferencesDesc')}</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 mb-4">
            {message && (
              <Alert
                variant={message.type === 'error' ? 'destructive' : 'default'}
              >
                {message.type === 'error' ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="preferred_language">
                {t('settings.language')}
              </Label>
              <Controller
                name="preferred_language"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => field.onChange(v)}
                  >
                    <SelectTrigger id="preferred_language">
                      <SelectValue placeholder={t('settings.language')} />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs text-muted-foreground">
                {t('settings.languageDesc')}
              </p>
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" disabled={isUpdating || !isDirty}>
              {isUpdating ? t('settings.saving') : t('settings.save')}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
