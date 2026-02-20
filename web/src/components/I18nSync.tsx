import { useEffect } from 'react'
import { useGetUserInfoQuery } from '@/store/api/endpoints/authApi'
import i18n from '@/i18n'

/**
 * Syncs i18n language with the user's preferred_language from API.
 * Render inside a layout that has access to authenticated user (e.g. AppLayout).
 */
export function I18nSync() {
  const { data: user } = useGetUserInfoQuery(undefined, { skip: false })

  useEffect(() => {
    const lang = user?.preferred_language?.trim() || 'en'
    if (i18n.language !== lang && (lang === 'en' || lang === 'vi')) {
      i18n.changeLanguage(lang)
    }
  }, [user?.preferred_language])

  return null
}
