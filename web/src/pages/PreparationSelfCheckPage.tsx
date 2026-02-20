import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useGetSelfCheckQuestionsQuery } from '@/store/api/endpoints/preparationApi'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight, CheckCircle2, MessageCircleQuestion } from 'lucide-react'

export function PreparationSelfCheckPage() {
  const { preparationId } = useParams<{ preparationId: string }>()
  const id = Number(preparationId)
  const [currentIndex, setCurrentIndex] = useState(0)

  const { data: questions = [], isLoading } = useGetSelfCheckQuestionsQuery(id, {
    skip: !id || Number.isNaN(id),
  })

  const currentQuestion = questions[currentIndex]
  const total = questions.length
  const isLast = total > 0 && currentIndex === total - 1

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
            <p>Chưa có câu hỏi self-check. Vui lòng thử lại sau.</p>
            <Button asChild variant="outline" className="mt-4">
              <Link to={`/preparations/${id}/roadmap`}>Xem Roadmap</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Self-check: câu hỏi giả lập phỏng vấn
        </h1>
        <span className="text-sm text-muted-foreground">
          Câu {currentIndex + 1} / {total}
        </span>
      </div>

      <p className="text-sm text-muted-foreground">
        Các câu hỏi có thể xuất hiện trong buổi phỏng vấn. Tự luyện trả lời (nói hoặc viết) để chuẩn bị.
      </p>

      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
        />
      </div>

      <Card className="min-h-[180px]">
        <CardContent className="flex flex-col gap-3 pt-6">
          <div className="flex items-start gap-2">
            <MessageCircleQuestion className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <p className="text-base leading-relaxed">
              {currentQuestion.question_text}
            </p>
          </div>
        </CardContent>
      </Card>

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
        {!isLast ? (
          <Button size="sm" onClick={() => setCurrentIndex((i) => i + 1)}>
            Sau <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button asChild size="sm">
            <Link to={`/preparations/${id}/roadmap`}>Xong · Về Roadmap</Link>
          </Button>
        )}
      </div>

      {isLast && (
        <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
          <CardContent className="flex flex-col gap-2 py-4">
            <span className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle2 className="size-5 shrink-0" />
              Bạn đã xem hết bộ câu giả lập.
            </span>
            <p className="text-sm text-muted-foreground">
              Sau khi phỏng vấn, bạn có thể{' '}
              <Link
                to={`/contribute?preparation_id=${id}`}
                className="font-medium text-primary underline underline-offset-2"
              >
                đóng góp thông tin
              </Link>{' '}
              (JD, câu hỏi, câu trả lời) để giúp hệ thống tốt hơn.
            </p>
          </CardContent>
        </Card>
      )}

      <Button asChild variant="ghost" size="sm">
        <Link to="/">Dashboard</Link>
      </Button>
    </div>
  )
}
