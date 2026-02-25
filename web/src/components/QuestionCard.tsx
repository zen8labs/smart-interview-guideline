import { cn } from '@/lib/utils'

export interface QuestionCardData {
  id: number | string
  title?: string
  content: string
  question_type: string
  options: Record<string, unknown>
  difficulty?: string
  estimated_time_seconds?: number | null
  tags?: string[]
}

interface QuestionCardProps {
  question: QuestionCardData
  selectedAnswer: string | null
  onSelectAnswer: (value: string) => void
  disabled?: boolean
}

function choiceLabel(obj: unknown): string {
  if (obj == null) return ''
  if (typeof obj === 'string') return obj
  if (typeof obj !== 'object') return String(obj)
  const o = obj as Record<string, unknown>
  const s = (o.label ?? o.text ?? o.content ?? o.value ?? o.key ?? o.title) as string | undefined
  return typeof s === 'string' ? s : String(obj)
}

function choiceValue(obj: unknown, index: number): string {
  if (obj == null) return String(index)
  if (typeof obj === 'string') return obj
  if (typeof obj !== 'object') return String(obj)
  const o = obj as Record<string, unknown>
  const v = (o.value ?? o.key ?? o.id) as string | undefined
  return typeof v === 'string' ? v : String(index)
}

function getChoiceList(options: Record<string, unknown>): { value: string; label: string }[] {
  if (Array.isArray(options.choices)) {
    return (options.choices as unknown[]).map((c, i) => ({
      value: choiceValue(c, i),
      label: choiceLabel(c),
    }))
  }
  const entries = Object.entries(options).filter(
    ([k]) => k !== 'correct_answer' && k !== 'correct_index'
  )
  return entries.map(([value, label]) => ({
    value,
    label: typeof label === 'string' ? label : value,
  }))
}

export function QuestionCard({
  question,
  selectedAnswer,
  onSelectAnswer,
  disabled = false,
}: QuestionCardProps) {
  const isBoolean =
    question.question_type === 'true_false' || question.question_type === 'boolean'

  const choices = isBoolean
    ? [
        { value: 'true', label: 'True' },
        { value: 'false', label: 'False' },
      ]
    : getChoiceList(question.options || {})

  return (
    <div className="space-y-4 rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
      <div>
        {question.title ? (
          <h3 className="text-sm font-medium text-muted-foreground">{question.title}</h3>
        ) : null}
        <p className="mt-1 text-base font-medium">{question.content}</p>
      </div>
      <div className="space-y-2">
        {choices.map((choice) => (
          <button
            key={choice.value}
            type="button"
            disabled={disabled}
            onClick={() => onSelectAnswer(choice.value)}
            className={cn(
              'flex w-full items-center rounded-lg border px-4 py-3 text-left text-sm transition-colors',
              selectedAnswer === choice.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-input hover:bg-muted/50',
              disabled && 'cursor-not-allowed opacity-70'
            )}
          >
            <span className="mr-2 inline-flex size-4 shrink-0 items-center justify-center rounded-full border">
              {selectedAnswer === choice.value ? (
                <span className="size-2 rounded-full bg-primary" />
              ) : null}
            </span>
            {choice.label}
          </button>
        ))}
      </div>
    </div>
  )
}
