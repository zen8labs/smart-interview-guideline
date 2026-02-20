import { useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  useGetMemoryScanQuestionsQuery,
  useSubmitMemoryScanMutation,
} from '@/store/api/endpoints/preparationApi'
import { QuestionCard } from '@/components/QuestionCard'
import { ThinkingLoader } from '@/components/ThinkingLoader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Loader2, Trophy } from 'lucide-react'

export function PreparationMemoryScanPage() {
  const { preparationId } = useParams<{ preparationId: string }>()
  const id = Number(preparationId)
  const navigate = useNavigate()

  const { data: questions = [], isLoading } = useGetMemoryScanQuestionsQuery(
    { preparationId: id, source: 'auto' },
    { skip: !id || Number.isNaN(id) }
  )
  const [submitMemoryScan, { isLoading: isSubmitting }] =
    useSubmitMemoryScanMutation()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<{
    score_percent: number
    total_questions: number
    correct_count: number
    roadmap_ready: boolean
  } | null>(null)

  const currentQuestion = questions[currentIndex]
  const selectedAnswer = currentQuestion
    ? answers[currentQuestion.id] ?? null
    : null
  const total = questions.length
  const answeredCount = Object.keys(answers).length
  const canSubmit = total > 0 && answeredCount === total

  const handleSelect = useCallback((questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }, [])

  const handleNext = useCallback(() => {
    if (currentIndex < total - 1) setCurrentIndex((i) => i + 1)
  }, [currentIndex, total])

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1)
  }, [currentIndex])

  const handleSubmit = async () => {
    if (!canSubmit || Number.isNaN(id)) return
    try {
      const res = await submitMemoryScan({
        preparationId: id,
        body: {
          answers: questions.map((q) => ({
            question_id: q.id,
            selected_answer: answers[q.id] ?? '',
          })),
        },
      }).unwrap()
      setResult({
        score_percent: res.score_percent,
        total_questions: res.total_questions,
        correct_count: res.correct_count,
        roadmap_ready: res.roadmap_ready,
      })
    } catch {
      // Error handled by mutation
    }
  }

  if (isLoading) {
    return (
      <ThinkingLoader
        messages={[
          'Đang phân tích skill của bạn...',
          'Đang tạo bộ câu hỏi phù hợp với JD...',
          'Đang cá nhân hoá câu hỏi Memory Scan...',
        ]}
      />
    )
  }

  if (result) {
    return (
      <div className="mx-auto w-full max-w-md space-y-5">
        <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
          <CardHeader>
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <Trophy className="size-6" />
              <CardTitle>Memory Scan xong</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-3xl font-bold">{result.score_percent}%</p>
            <p className="text-muted-foreground">
              Bạn đúng {result.correct_count}/{result.total_questions} câu.
            </p>
            {result.roadmap_ready ? (
              <Button
                onClick={() => navigate(`/preparations/${id}/roadmap`)}
              >
                Xem Roadmap chuẩn bị
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => navigate('/')}>
              Về Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!total) {
    return (
      <div className="mx-auto w-full max-w-md">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>Chưa có câu hỏi. Thử tải lại hoặc chọn nguồn khác (warehouse / AI).</p>
            <Button className="mt-4" variant="outline" onClick={() => navigate('/interviews')}>
              Về Interview Prep
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
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Memory Scan</h1>
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

      <div className="min-h-[220px]">
        <QuestionCard
          question={cardQuestion}
          selectedAnswer={selectedAnswer}
          onSelectAnswer={(value) => handleSelect(currentQuestion.id, value)}
        />
      </div>

      <div className="flex flex-wrap justify-between gap-2">
        <Button variant="outline" size="sm" onClick={handlePrev} disabled={currentIndex === 0}>
          <ChevronLeft className="size-4" />
          Trước
        </Button>
        {currentIndex < total - 1 ? (
          <Button size="sm" onClick={handleNext}>
            Sau <ChevronRight className="size-4" />
          </Button>
        ) : isSubmitting ? (
          <ThinkingLoader
            variant="inline"
            messages={[
              'Đang chấm điểm...',
              'Đang phân tích kết quả của bạn...',
              'Đang tạo roadmap cá nhân hoá...',
            ]}
          />
        ) : (
          <Button size="sm" onClick={handleSubmit} disabled={!canSubmit}>
            Nộp bài
          </Button>
        )}
      </div>
    </div>
  )
}
