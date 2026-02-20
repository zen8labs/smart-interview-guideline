import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGetPracticeQuestionsQuery, useSubmitPracticeAnswersMutation } from '@/store/api/endpoints/practiceQuestionsApi'
import { QuestionCard } from '@/components/QuestionCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight, Loader2, Trophy } from 'lucide-react'
import type { UserQuestionItem } from '@/store/api/endpoints/practiceQuestionsApi'

const MODE = 'memory_scan'

export function AssessmentPage() {
  const navigate = useNavigate()
  const { data: questions = [], isLoading } = useGetPracticeQuestionsQuery({
    mode: MODE,
    limit: 10,
  })
  const [submitAnswers, { isLoading: isSubmitting }] = useSubmitPracticeAnswersMutation()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [result, setResult] = useState<{
    score_percent: number
    total_questions: number
    correct_count: number
  } | null>(null)

  const currentQuestion = questions[currentIndex]
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] ?? null : null
  const total = questions.length
  const answeredCount = Object.keys(answers).length
  const canSubmit = total > 0 && answeredCount === total

  const handleSelect = useCallback((questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }, [])

  const handleNext = useCallback(() => {
    if (currentIndex < total - 1) setCurrentIndex((i) => i + 1)
  }, [currentIndex, total])

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1)
  }, [currentIndex])

  const handleSubmit = async () => {
    if (!canSubmit) return
    try {
      const res = await submitAnswers({
        session_type: MODE,
        answers: questions.map((q) => ({
          question_id: q.id,
          selected_answer: answers[q.id] ?? '',
        })),
      }).unwrap()
      setResult({
        score_percent: res.score_percent,
        total_questions: res.total_questions,
        correct_count: res.correct_count,
      })
    } catch {
      // Error handled by mutation
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  if (result) {
    return (
      <div className="mx-auto max-w-md space-y-6">
        <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
          <CardHeader>
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <Trophy className="size-6" />
              <CardTitle>Assessment complete</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-3xl font-bold">{result.score_percent}%</p>
            <p className="text-muted-foreground">
              You got {result.correct_count} out of {result.total_questions} questions
              correct.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/')}>Dashboard</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null)
                  setAnswers({})
                  setCurrentIndex(0)
                  window.location.reload()
                }}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!total) {
    return (
      <div className="mx-auto max-w-md">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>No questions available for this assessment yet.</p>
            <Button className="mt-4" variant="outline" onClick={() => navigate('/')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Memory Scan</h1>
        <span className="text-sm text-muted-foreground">
          Question {currentIndex + 1} of {total}
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
        />
      </div>

      <QuestionCard
        question={currentQuestion as UserQuestionItem}
        selectedAnswer={selectedAnswer}
        onSelectAnswer={(value) => handleSelect(currentQuestion.id, value)}
      />

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="size-4" />
          Previous
        </Button>
        {currentIndex < total - 1 ? (
          <Button onClick={handleNext}>
            Next <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              'Submit answers'
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
