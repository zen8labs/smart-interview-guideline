import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useGetUserInfoQuery } from '@/store/api/endpoints/authApi'
import { useSetPageTitle } from '@/contexts/PageTitleContext'
import { useGetDailyRoadmapQuery } from '@/store/api/endpoints/roadmapApi'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  BookOpen,
  Users,
  BrainCircuit,
  ArrowRight,
  Target,
  TrendingUp,
  Clock,
} from 'lucide-react'
import { Link } from 'react-router-dom'

interface QuickActionCardProps {
  title: string
  description: string
  icon: React.ReactNode
  href: string
  badge?: string
  badgeVariant?: 'default' | 'secondary' | 'outline'
  ctaText?: string
}

function QuickActionCard({
  title,
  description,
  icon,
  href,
  badge,
  badgeVariant = 'secondary',
  ctaText = 'Get started',
}: QuickActionCardProps) {
  return (
    <Link to={href} className="group">
      <Card className="h-full transition-all hover:shadow-md hover:border-primary/20 group-hover:-translate-y-0.5">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
              {icon}
            </div>
            {badge && <Badge variant={badgeVariant}>{badge}</Badge>}
          </div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription className="text-sm">{description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <span className="inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
            {ctaText} <ArrowRight className="size-3.5" />
          </span>
        </CardContent>
      </Card>
    </Link>
  )
}

export function DashboardPage() {
  const { t } = useTranslation()
  const setPageTitle = useSetPageTitle()
  const { data: user, isLoading } = useGetUserInfoQuery()
  const { data: dailyRoadmap } = useGetDailyRoadmapQuery()

  useEffect(() => {
    const welcome = isLoading
      ? t('dashboard.title')
      : `${t('dashboard.welcome')}${user?.email ? `, ${user.email.split('@')[0]}` : ''}`
    setPageTitle(welcome, t('dashboard.subtitleReady'))
  }, [setPageTitle, t, isLoading, user?.email])

  return (
    <div className="mx-auto max-w-6xl space-y-8">

      {/* Interview Readiness Score - Placeholder */}
      <Card className="bg-linear-to-r from-primary/5 via-primary/3 to-transparent border-primary/10">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Target className="size-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{t('dashboard.readinessScore')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('dashboard.readinessDesc')}
              </p>
            </div>
          </div>
          <Button asChild>
            <Link to="/preparations">
              <BrainCircuit className="size-4" />
              {t('dashboard.startPreparation')}
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Quick Actions Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            {t('dashboard.quickActions')}
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickActionCard
            title={t('dashboard.interviewPrep')}
            description={t('dashboard.interviewPrepDesc')}
            icon={<FileText className="size-5" />}
            href="/preparations"
            badge={t('dashboard.badgeCore')}
            ctaText={t('dashboard.getStarted')}
          />
          <QuickActionCard
            title={t('dashboard.community')}
            description={t('dashboard.communityDesc')}
            icon={<Users className="size-5" />}
            href="/community"
            badge={t('dashboard.badgeCrowd')}
            badgeVariant="outline"
            ctaText={t('dashboard.getStarted')}
          />
          <QuickActionCard
            title={t('dashboard.memoryScan')}
            description={t('dashboard.memoryScanDesc')}
            icon={<BrainCircuit className="size-5" />}
            href="/assessment"
            badge={t('dashboard.badgeQuiz')}
            badgeVariant="outline"
            ctaText={t('dashboard.getStarted')}
          />
        </div>
      </section>

      {/* Today's tasks & Progress */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">
          Your Progress
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-blue-500/10 p-2.5">
                <TrendingUp className="size-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">
                  Preparations completed
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="transition-shadow hover:shadow-md">
            <Link to="/preparations">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="rounded-lg bg-green-500/10 p-2.5">
                  <BookOpen className="size-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {dailyRoadmap?.tasks
                      ? `${dailyRoadmap.tasks.filter((t) => t.is_completed).length}/${dailyRoadmap.tasks.length}`
                      : '0'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Today&apos;s tasks done
                  </p>
                </div>
              </CardContent>
            </Link>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-purple-500/10 p-2.5">
                <Clock className="size-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">0h</p>
                <p className="text-sm text-muted-foreground">
                  Total study time
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
