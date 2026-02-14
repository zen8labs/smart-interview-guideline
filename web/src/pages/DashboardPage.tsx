import { useGetUserInfoQuery } from '@/store/api/endpoints/authApi'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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

function WelcomeSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-5 w-96" />
    </div>
  )
}

interface QuickActionCardProps {
  title: string
  description: string
  icon: React.ReactNode
  href: string
  badge?: string
  badgeVariant?: 'default' | 'secondary' | 'outline'
}

function QuickActionCard({
  title,
  description,
  icon,
  href,
  badge,
  badgeVariant = 'secondary',
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
            Get started <ArrowRight className="size-3.5" />
          </span>
        </CardContent>
      </Card>
    </Link>
  )
}

export function DashboardPage() {
  const { data: user, isLoading } = useGetUserInfoQuery()

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Welcome Section */}
      <section className="space-y-1">
        {isLoading ? (
          <WelcomeSkeleton />
        ) : (
          <>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
            </h1>
            <p className="text-muted-foreground">
              Ready to ace your next interview? Here&apos;s your preparation hub.
            </p>
          </>
        )}
      </section>

      {/* Interview Readiness Score - Placeholder */}
      <Card className="bg-linear-to-r from-primary/5 via-primary/3 to-transparent border-primary/10">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Target className="size-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Interview Readiness Score</h3>
              <p className="text-sm text-muted-foreground">
                Start your first preparation journey to track your progress
              </p>
            </div>
          </div>
          <Button asChild>
            <Link to="/interviews">
              <BrainCircuit className="size-4" />
              Start Preparation
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Quick Actions Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            Quick Actions
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickActionCard
            title="Interview Prep"
            description="Analyze a Job Description and get a personalized study roadmap"
            icon={<FileText className="size-5" />}
            href="/interviews"
            badge="Core"
          />
          <QuickActionCard
            title="Knowledge Base"
            description="Browse visual learning cards and AI-generated study materials"
            icon={<BookOpen className="size-5" />}
            href="/knowledge"
            badge="Learn"
            badgeVariant="outline"
          />
          <QuickActionCard
            title="Community"
            description="Real interview questions from the community, anonymized and verified"
            icon={<Users className="size-5" />}
            href="/community"
            badge="Crowd"
            badgeVariant="outline"
          />
          <QuickActionCard
            title="Memory Scan"
            description="Quick adaptive quiz to assess your current knowledge level"
            icon={<BrainCircuit className="size-5" />}
            href="/interviews"
            badge="Quiz"
            badgeVariant="outline"
          />
        </div>
      </section>

      {/* Stats Placeholder */}
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
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-green-500/10 p-2.5">
                <BookOpen className="size-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">
                  Knowledge cards studied
                </p>
              </div>
            </CardContent>
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
