import { useState, useCallback, useMemo, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  useGetPreparationQuery,
  useGetMemoryScanQuestionsQuery,
  useSubmitMemoryScanMutation,
  useCreateRoadmapMutation,
  useResetMemoryScanMutation,
} from '@/store/api/endpoints/preparationApi'
import { usePreparationFlowProgress } from '@/contexts/PreparationFlowContext'
import type { KnowledgeAreaAssessment, LastMemoryScanResult } from '@/store/api/endpoints/preparationApi'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { QuestionCard } from '@/components/QuestionCard'
import { ThinkingLoader } from '@/components/ThinkingLoader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Trophy, RotateCcw, Map } from 'lucide-react'

function ScoreGauge({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent))
  const rotation = (clamped / 100) * 180 // half circle 0-180deg
  const isHigh = clamped >= 70
  const isLow = clamped < 40
  return (
    <div className="relative mx-auto w-44 h-44">
      <svg viewBox="0 0 120 80" className="w-full h-full">
        <defs>
          <linearGradient id="gaugeBg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--muted))" />
            <stop offset="100%" stopColor="hsl(var(--muted))" />
          </linearGradient>
          <linearGradient id="gaugeFill" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={isLow ? 'hsl(var(--destructive))' : 'hsl(var(--chart-2))'} />
            <stop offset="100%" stopColor={isHigh ? 'hsl(var(--primary))' : 'hsl(var(--chart-1))'} />
          </linearGradient>
        </defs>
        <path
          d="M 10 70 A 50 50 0 0 1 110 70"
          fill="none"
          stroke="url(#gaugeBg)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M 10 70 A 50 50 0 0 1 110 70"
          fill="none"
          stroke="url(#gaugeFill)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${(rotation / 180) * 157} 157`}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-4">
        <span className="text-3xl font-bold tabular-nums">{Math.round(percent)}%</span>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Điểm số</span>
      </div>
    </div>
  )
}

function LevelBar({ knowledge_area, level, correct_count, total_count }: KnowledgeAreaAssessment) {
  const pct = (level / 5) * 100
  const color =
    level >= 4
      ? 'bg-emerald-500'
      : level >= 3
        ? 'bg-amber-500'
        : level >= 2
          ? 'bg-orange-500'
          : 'bg-red-500'
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="font-medium truncate pr-2">{knowledge_area}</span>
        <span className="shrink-0 text-muted-foreground">
          Mức {level}/5 · {correct_count}/{total_count}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function ResultView({
  result,
  preparationId,
  roadmapReady,
  onCreateRoadmap,
  onRedo,
  isCreatingRoadmap,
  isResetting,
}: {
  result: LastMemoryScanResult
  preparationId: number
  roadmapReady: boolean
  onCreateRoadmap: () => void
  onRedo: () => void
  isCreatingRoadmap: boolean
  isResetting: boolean
}) {
  const score = result.score_percent
  const isHigh = score >= 70
  const isLow = score < 40
  const headline = isHigh
    ? 'Kết quả rất tốt!'
    : isLow
      ? 'Còn nhiều điểm cần cải thiện'
      : 'Bạn đang trên đúng hướng'

  return (
    <div className="mx-auto w-full space-y-6">
      <Card
        className={
          isHigh
            ? 'border-emerald-200 bg-linear-to-b from-emerald-50/80 to-background dark:border-emerald-800 dark:from-emerald-950/30'
            : isLow
              ? 'border-amber-200 bg-linear-to-b from-amber-50/50 to-background dark:border-amber-900 dark:from-amber-950/20'
              : 'border-primary/20 bg-linear-to-b from-primary/5 to-background'
        }
      >
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center">
            <div
              className={`rounded-full p-3 ${
                isHigh
                  ? 'bg-emerald-100 dark:bg-emerald-900/50'
                  : isLow
                    ? 'bg-amber-100 dark:bg-amber-900/50'
                    : 'bg-primary/10'
              }`}
            >
              <Trophy
                className={`size-10 ${
                  isHigh
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : isLow
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-primary'
                }`}
              />
            </div>
          </div>
          <CardTitle className="text-xl mt-2">Memory Scan — Kết quả</CardTitle>
          <p className="text-muted-foreground font-medium">{headline}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <ScoreGauge percent={score} />
          <p className="text-center text-sm text-muted-foreground">
            Bạn đúng <strong>{result.correct_count}</strong> / {result.total_questions} câu
          </p>

          {result.knowledge_assessment && result.knowledge_assessment.length > 0 && (
            <div className="rounded-xl border bg-background/60 p-4 space-y-4">
              <p className="text-sm font-semibold text-muted-foreground">
                Mức độ kiến thức theo vùng (thang 1–5)
              </p>
              <div className="space-y-4">
                {result.knowledge_assessment.map((a, i) => (
                  <LevelBar key={i} {...a} />
                ))}
              </div>
            </div>
          )}

          {result.llm_report && (
            <div className="rounded-xl border bg-background/60 p-4 space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">
                Đánh giá từ AI
              </p>
              <div
                className={
                  'prose prose-sm dark:prose-invert max-w-none text-foreground ' +
                  'prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 prose-headings:mt-2 prose-headings:mb-1'
                }
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.llm_report}</ReactMarkdown>
              </div>
            </div>
          )}

          <footer className="flex flex-col sm:flex-row gap-3 pt-2">
            {!roadmapReady && (
              <Button
                className="flex-1"
                onClick={onCreateRoadmap}
                disabled={isCreatingRoadmap}
              >
                <Map className="mr-2 size-4" />
                {isCreatingRoadmap ? 'Đang tạo roadmap...' : 'Tiếp tục tạo roadmap'}
              </Button>
            )}
            {roadmapReady && (
              <Button className="flex-1" asChild>
                <Link to={`/preparations/${preparationId}/roadmap`}>Xem Roadmap</Link>
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1"
              onClick={onRedo}
              disabled={isResetting}
            >
              <RotateCcw className="mr-2 size-4" />
              {isResetting ? 'Đang reset...' : 'Làm lại scan memory'}
            </Button>
          </footer>
        </CardContent>
      </Card>
    </div>
  )
}

export function PreparationMemoryScanPage() {
  const { preparationId } = useParams<{ preparationId: string }>()
  const id = Number(preparationId)
  const navigate = useNavigate()

  const { data: preparation } = useGetPreparationQuery(id, { skip: !id || Number.isNaN(id) })
  const { data: questions = [], isLoading } = useGetMemoryScanQuestionsQuery(
    { preparationId: id, source: 'auto' },
    { skip: !id || Number.isNaN(id) }
  )
  const [submitMemoryScan, { isLoading: isSubmitting }] = useSubmitMemoryScanMutation()
  const [createRoadmap, { isLoading: isCreatingRoadmap }] = useCreateRoadmapMutation()
  const [resetMemoryScan, { isLoading: isResetting }] = useResetMemoryScanMutation()
  const { setStepProgress, clearStepProgress } = usePreparationFlowProgress()

  const [localResult, setLocalResult] = useState<LastMemoryScanResult | null>(null)

  useEffect(() => {
    if (isCreatingRoadmap) setStepProgress(2, 'Đang tạo roadmap học tập cho bạn...')
    else if (isSubmitting) setStepProgress(1, 'Đang chấm điểm và phân tích kết quả...')
    else if (isLoading) setStepProgress(1, 'Đang chuẩn bị câu hỏi Memory Scan...')
    else clearStepProgress()
  }, [isLoading, isSubmitting, isCreatingRoadmap, setStepProgress, clearStepProgress])

  const result: LastMemoryScanResult | null = useMemo(
    () => localResult ?? preparation?.last_memory_scan_result ?? null,
    [localResult, preparation?.last_memory_scan_result]
  )
  const roadmapReady = Boolean(preparation?.roadmap_id)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const currentQuestion = questions[currentIndex]
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] ?? null : null
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
      setLocalResult({
        score_percent: res.score_percent,
        correct_count: res.correct_count,
        total_questions: res.total_questions,
        knowledge_assessment: res.knowledge_assessment,
        llm_report: res.llm_report ?? null,
      })
    } catch {
      // Error handled by mutation
    }
  }

  const handleCreateRoadmap = async () => {
    if (Number.isNaN(id)) return
    try {
      await createRoadmap(id).unwrap()
      navigate(`/preparations/${id}/roadmap`)
    } catch {
      // Error handled by mutation
    }
  }

  const handleRedo = async () => {
    if (Number.isNaN(id)) return
    try {
      await resetMemoryScan(id).unwrap()
      setLocalResult(null)
      setAnswers({})
      setCurrentIndex(0)
    } catch {
      // Error handled by mutation
    }
  }

  if (result) {
    return (
      <ResultView
        result={result}
        preparationId={id}
        roadmapReady={roadmapReady}
        onCreateRoadmap={handleCreateRoadmap}
        onRedo={handleRedo}
        isCreatingRoadmap={isCreatingRoadmap}
        isResetting={isResetting}
      />
    )
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

  if (!total) {
    return (
      <div className="mx-auto w-full max-w-md">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>Chưa có câu hỏi. Thử tải lại hoặc chọn nguồn khác (warehouse / AI).</p>
            <Button className="mt-4" variant="outline" onClick={() => navigate('/preparations')}>
              Về danh sách chuẩn bị
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
