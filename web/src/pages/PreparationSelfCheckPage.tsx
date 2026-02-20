import { useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useGetSelfCheckQuestionsQuery } from '@/store/api/endpoints/preparationApi'
import { QuestionCard } from '@/components/QuestionCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'

export function PreparationSelfCheckPage() {
  const { preparationId } = useParams<{ preparationId: string }>()
  const id = Number(preparationId)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const { data: questions = [], isLoading } = useGetSelfCheckQuestionsQuery(id, {
    skip: !id || Number.isNaN(id),
  })

  const currentQuestion = questions[currentIndex]
  const selectedAnswer = currentQuestion
    ? answers[currentQuestion.id] ?? null
    : null
  const total = questions.length
  const answeredCount = Object.keys(answers).length
  const allAnswered = total > 0 && answeredCount === total

  const handleSelect = useCallback((questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }, [])

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!total) {
    return (
      <div className="mx-auto w-full max-w-md">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>Chưa có câu hỏi self-check. Hoàn thành roadmap trước.</p>
            <Button asChild variant="outline" className="mt-4">
              <Link to={`/preparations/${id}/roadmap`}>Xem Roadmap</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const cardQuestion = {
    id: currentQuestion.id,
    title: '',
    content: currentQuestion.question_text,
    question_type: currentQuestion.question_type,
    options: currentQuestion.options,
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Self-check: câu hỏi phỏng vấn có thể có
        </h1>
        <span className="text-sm text-muted-foreground">
          Câu {currentIndex + 1} / {total}
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
        />
      </div>

      <div className="min-h-[200px]">
        <QuestionCard
          question={cardQuestion}
          selectedAnswer={selectedAnswer}
          onSelectAnswer={(value) => handleSelect(currentQuestion.id, value)}
        />
      </div>

      <div className="flex flex-wrap justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="size-4" />
          Trước
        </Button>
        {currentIndex < total - 1 ? (
          <Button size="sm" onClick={() => setCurrentIndex((i) => i + 1)}>
            Sau <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button asChild size="sm">
            <Link to={`/preparations/${id}/roadmap`}>Xong · Về Roadmap</Link>
          </Button>
        )}
      </div>

      {currentIndex === total - 1 && allAnswered && (
        <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
          <CardContent className="flex flex-col gap-2 py-4">
            <span className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle2 className="size-5 shrink-0" />
              Bạn đã xem hết bộ câu self-check.
            </span>
          </CardContent>
        </Card>
      )}

      <Button asChild variant="ghost" size="sm">
        <Link to="/">Dashboard</Link>
      </Button>
    </div>
  )
}
