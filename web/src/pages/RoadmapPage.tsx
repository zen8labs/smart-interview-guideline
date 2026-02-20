import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useGetDailyRoadmapQuery,
  useCompleteTaskMutation,
  type DailyTaskItem,
} from '@/store/api/endpoints/roadmapApi'
import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, BookOpen, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function RoadmapPage() {
  const { data, isLoading, error } = useGetDailyRoadmapQuery()
  const [completeTask, { isLoading: isCompleting }] = useCompleteTaskMutation()

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md">
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardContent className="flex flex-col items-center gap-2 py-8">
            <AlertCircle className="size-10 text-amber-600 dark:text-amber-400" />
            <p className="text-center text-muted-foreground">
              Something went wrong. Please try again.
            </p>
            <Button variant="outline" asChild>
              <Link to="/">Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { tasks, day_index, roadmap_id } = data ?? {
    tasks: [] as DailyTaskItem[],
    day_index: 0,
    roadmap_id: 0,
  }

  if (roadmap_id === 0 && tasks.length === 0) {
    return (
      <div className="mx-auto max-w-md">
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardContent className="flex flex-col items-center gap-2 py-8">
            <AlertCircle className="size-10 text-amber-600 dark:text-amber-400" />
            <p className="text-center text-muted-foreground">
              No roadmap yet. Submit a job description in Interview Prep to get
              your personalized daily tasks.
            </p>
            <Button variant="outline" asChild>
              <Link to="/interviews">Go to Interview Prep</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  const completedCount = tasks.filter((t) => t.is_completed).length

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Today&apos;s learning</h1>
        <p className="text-muted-foreground">
          Day {day_index + 1} · {completedCount} of {tasks.length} completed
        </p>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{
            width: tasks.length ? `${(completedCount / tasks.length) * 100}%` : '0%',
          }}
        />
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <BookOpen className="mx-auto mb-2 size-10 opacity-50" />
            <p>No tasks for today. Check back tomorrow or start a new journey.</p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-4">
          {tasks.map((task) => (
            <li key={task.id}>
              <Card
                className={cn(
                  task.is_completed && 'border-green-200 bg-green-50/30 dark:border-green-900 dark:bg-green-950/10'
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {task.is_completed ? (
                          <CheckCircle2 className="size-5 shrink-0 text-green-600 dark:text-green-400" />
                        ) : (
                          <Circle className="size-5 shrink-0 text-muted-foreground" />
                        )}
                        {task.title}
                      </CardTitle>
                      <CardDescription className="mt-1 whitespace-pre-wrap">
                        {task.content}
                      </CardDescription>
                    </div>
                    {!task.is_completed && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isCompleting}
                        onClick={() => completeTask(task.id)}
                      >
                        Mark as done
                      </Button>
                    )}
                  </div>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
