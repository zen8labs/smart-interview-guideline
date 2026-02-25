import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useGetUserInfoQuery } from '@/store/api/endpoints/authApi'
import { useListPreparationsQuery } from '@/store/api/endpoints/preparationApi'
import { useGetDailyRoadmapQuery } from '@/store/api/endpoints/roadmapApi'
import { useSetPageTitle } from '@/contexts/PageTitleContext'
import { USER_ROLES } from '@/schemas/profileSchemas'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Briefcase,
  BrainCircuit,
  BookOpen,
  FileText,
  Target,
  User,
} from 'lucide-react'

const RECENT_PREPS_LIMIT = 5

function getRoleLabel(roleValue: string | null): string {
  if (!roleValue) return '—'
  const found = USER_ROLES.find((r) => r.value === roleValue)
  return found ? found.label : roleValue
}

export function DashboardPage() {
  const { t } = useTranslation()
  const setPageTitle = useSetPageTitle()
  const { data: user, isLoading } = useGetUserInfoQuery()
  const { data: allPreparations = [] } = useListPreparationsQuery()
  const preparations = useMemo(
    () => (user?.id != null ? allPreparations.filter((p) => p.user_id === user.id) : []),
    [user, allPreparations]
  )
  const { data: dailyRoadmap } = useGetDailyRoadmapQuery()

  useEffect(() => {
    const welcome = isLoading
      ? t('dashboard.title')
      : `${t('dashboard.welcome')}${user?.email ? `, ${user.email.split('@')[0]}` : ''}`
    setPageTitle(welcome, t('dashboard.subtitleReady'))
  }, [setPageTitle, t, isLoading, user?.email])

  const recentPreps = preparations.slice(0, RECENT_PREPS_LIMIT)
  const hasCareerInfo =
    user?.full_name?.trim() ||
    user?.role ||
    (user?.experience_years != null && user.experience_years > 0) ||
    user?.current_company?.trim() ||
    user?.skills_summary?.trim()
  const todayTasks = dailyRoadmap?.tasks ?? []
  const todayDone = todayTasks.filter((t) => t.is_completed).length

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Top strip: career summary + CTA — one card, balanced layout */}
      <Card className="overflow-hidden">
        <div className="grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:p-5">
          {/* Left: career summary */}
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <span className="flex size-8 items-center justify-center rounded-full bg-muted">
                  <User className="size-4 text-muted-foreground" />
                </span>
                {t('dashboard.careerSummary')}
              </h2>
              <Button asChild variant="outline" size="sm" className="shrink-0">
                <Link to="/profile">{t('dashboard.editProfile')}</Link>
              </Button>
            </div>
            {hasCareerInfo || user?.full_name?.trim() ? (
              <div className="space-y-1.5">
                {user?.full_name?.trim() && (
                  <p className="text-base font-medium leading-tight text-foreground">
                    {user.full_name.trim()}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                  {user?.role && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="size-3.5 shrink-0" />
                      {getRoleLabel(user.role)}
                    </span>
                  )}
                  {user?.experience_years != null && user.experience_years > 0 && (
                    <span>{user.experience_years} {t('profile.experienceYears')}</span>
                  )}
                  {user?.current_company?.trim() && (
                    <span className="truncate" title={user.current_company}>
                      {user.current_company}
                    </span>
                  )}
                </div>
                {user?.skills_summary?.trim() && (
                  <p
                    className="line-clamp-2 text-xs leading-relaxed text-muted-foreground"
                    title={user.skills_summary}
                  >
                    {user.skills_summary.trim()}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('dashboard.careerSummaryDesc')}{' '}
                <Link to="/profile" className="font-medium text-primary underline-offset-4 hover:underline">
                  {t('dashboard.editProfile')}
                </Link>
              </p>
            )}
          </div>

          {/* Right: readiness CTA — same visual weight, no empty space */}
          <div className="flex flex-col justify-center border-t border-border pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
            <div className="flex flex-col gap-3 sm:min-w-[200px]">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                  <Target className="size-4 text-primary" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {t('dashboard.readinessScore')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('dashboard.readinessDesc')}
                  </p>
                </div>
              </div>
              <Button asChild size="sm" className="w-full sm:w-auto">
                <Link to="/preparations">
                  <BrainCircuit className="mr-2 size-4" />
                  {t('dashboard.startPreparation')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Recent preparations */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {t('dashboard.recentPreparations')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('dashboard.recentPreparationsDesc')}
            </p>
          </div>
          {preparations.length > RECENT_PREPS_LIMIT && (
            <Button asChild variant="ghost" size="sm">
              <Link to="/preparations">{t('dashboard.viewAll')}</Link>
            </Button>
          )}
        </div>

        {recentPreps.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              {t('dashboard.noPreparationsYet')}
              <Button asChild variant="link" size="sm" className="mt-2">
                <Link to="/preparations">{t('dashboard.startPreparation')}</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-2">
            {recentPreps.map((prep) => (
              <li key={prep.id}>
                <Link to={`/preparations/${prep.id}/jd`} className="block">
                  <Card className="rounded-lg border p-3 shadow-none transition-colors hover:bg-muted/40">
                    <CardHeader className="flex-row items-center justify-between gap-3 border-0 p-0">
                      <div className="min-w-0 flex-1 space-y-1">
                        <CardTitle className="text-sm font-medium">
                          {prep.company_name?.trim() || `Chuẩn bị #${prep.id}`}
                          {prep.status === 'roadmap_ready' && (
                            <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
                              · Đã có roadmap
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription className="truncate text-xs leading-snug text-muted-foreground">
                          {[prep.job_title?.trim(), `Tạo ${new Date(prep.created_at).toLocaleDateString('vi-VN')}`]
                            .filter(Boolean)
                            .join(' · ')}
                        </CardDescription>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Today's tasks + Stats */}
      <section className="grid gap-4 sm:grid-cols-2">
        <Card className="transition-shadow hover:shadow-md">
          <Link to="/preparations" className="block">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <FileText className="size-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-bold">
                  {preparations.length}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.preparationsCount')}
                </p>
              </div>
            </CardContent>
          </Link>
        </Card>

        {todayTasks.length > 0 && (
          <Card className="transition-shadow hover:shadow-md">
            <Link to="/preparations" className="block">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-lg bg-green-500/10 p-2.5">
                  <BookOpen className="size-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-2xl font-bold">
                    {todayDone}/{todayTasks.length}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('dashboard.todayTasks')} · {t('dashboard.tasksDone')}
                  </p>
                </div>
              </CardContent>
            </Link>
          </Card>
        )}
      </section>
    </div>
  )
}
