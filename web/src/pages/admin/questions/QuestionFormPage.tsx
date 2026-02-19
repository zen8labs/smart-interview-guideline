import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  useCreateQuestionMutation,
  useUpdateQuestionMutation,
  useGetQuestionQuery,
  type QuestionCreate,
  type QuestionUpdate,
} from '@/store/api/endpoints/questionsApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Save,
  Loader2,
  FileText,
  ListChecks,
  Sparkles,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const DIFFICULTY_OPTIONS = [
  { value: 'beginner' as const, label: 'Easy' },
  { value: 'intermediate' as const, label: 'Medium' },
  { value: 'advanced' as const, label: 'Hard' },
]

const CHOICE_LETTERS = ['A', 'B', 'C', 'D']

type ChoiceRow = { id: string; text: string; is_correct: boolean }

function getChoicesFromOptions(options: Record<string, unknown>): ChoiceRow[] {
  const raw = options?.choices
  if (!Array.isArray(raw) || raw.length === 0) {
    return CHOICE_LETTERS.map((letter, i) => ({
      id: letter.toLowerCase(),
      text: '',
      is_correct: i === 0,
    }))
  }
  const out: ChoiceRow[] = []
  for (let i = 0; i < 4; i++) {
    const c = raw[i] as { id?: string; text?: string; is_correct?: boolean } | undefined
    const isCorrect = Boolean(c?.is_correct)
    out.push({
      id: typeof c?.id === 'string' ? c.id : CHOICE_LETTERS[i].toLowerCase(),
      text: typeof c?.text === 'string' ? c.text : '',
      is_correct: isCorrect,
    })
  }
  const hasCorrect = out.some(c => c.is_correct)
  if (!hasCorrect) out[0].is_correct = true
  return out
}

function optionsFromChoices(choices: ChoiceRow[]): Record<string, unknown> {
  return {
    choices: choices.map(c => ({ id: c.id, text: c.text, is_correct: c.is_correct })),
    multiple_correct: false,
    shuffle: true,
  }
}

function OtherOptionsEditor({
  options,
  onChange,
}: {
  options: Record<string, unknown>
  onChange: (opts: Record<string, unknown>) => void
}) {
  const [raw, setRaw] = useState(() => JSON.stringify(options, null, 2))
  const [error, setError] = useState<string | null>(null)

  const handleChange = (value: string) => {
    setRaw(value)
    try {
      const parsed = JSON.parse(value || '{}') as Record<string, unknown>
      setError(null)
      onChange(parsed)
    } catch {
      setError('Invalid JSON')
    }
  }

  return (
    <Card className="border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden">
      <CardHeader className="border-b border-slate-200 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-900/50">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-muted-foreground" />
          Options
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <textarea
          value={raw}
          onChange={e => handleChange(e.target.value)}
          rows={6}
          className="flex w-full rounded-md border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder='{"key": "value"}'
        />
        <p className="text-xs text-muted-foreground mt-2">
          Enter valid JSON for this question type (e.g. true_false, scenario, coding).
          {error && <span className="text-destructive ml-1">{error}</span>}
        </p>
      </CardContent>
    </Card>
  )
}

export default function QuestionFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditMode = Boolean(id)

  const { data: existingQuestion, isLoading: isLoadingQuestion } = useGetQuestionQuery(
    Number(id),
    { skip: !isEditMode }
  )
  const [createQuestion, { isLoading: isCreating }] = useCreateQuestionMutation()
  const [updateQuestion, { isLoading: isUpdating }] = useUpdateQuestionMutation()

  const [formData, setFormData] = useState<QuestionCreate>(() =>
    existingQuestion
      ? {
          title: existingQuestion.title,
          content: existingQuestion.content,
          question_type: existingQuestion.question_type,
          options: existingQuestion.options,
          difficulty: existingQuestion.difficulty,
          estimated_time_seconds: existingQuestion.estimated_time_seconds || 300,
          explanation: existingQuestion.explanation || '',
          tags: existingQuestion.tags ?? [],
          skill_ids: [],
        }
      : {
          title: '',
          content: '',
          question_type: 'multiple_choice',
          options: { choices: [] },
          difficulty: 'intermediate',
          estimated_time_seconds: 300,
          explanation: '',
          tags: [],
          skill_ids: [],
        }
  )

  const [tagInput, setTagInput] = useState('')

  const choices = useMemo(() => getChoicesFromOptions(formData.options), [formData.options])

  useEffect(() => {
    if (!existingQuestion) return
    const payload = {
      title: existingQuestion.title,
      content: existingQuestion.content,
      question_type: existingQuestion.question_type,
      options: existingQuestion.options,
      difficulty: existingQuestion.difficulty,
      estimated_time_seconds: existingQuestion.estimated_time_seconds || 300,
      explanation: existingQuestion.explanation || '',
      tags: existingQuestion.tags ?? [],
      skill_ids: [],
    }
    const t = setTimeout(() => setFormData(payload), 0)
    return () => clearTimeout(t)
  }, [existingQuestion])

  const setChoices = (next: ChoiceRow[] | ((prev: ChoiceRow[]) => ChoiceRow[])) => {
    const nextChoices = typeof next === 'function' ? next(choices) : next
    setFormData(prev => ({ ...prev, options: optionsFromChoices(nextChoices) }))
  }

  const setChoiceText = (index: number, text: string) => {
    setChoices(prev => {
      const p = [...prev]
      p[index] = { ...p[index], text }
      return p
    })
  }

  const setCorrectIndex = (index: number) => {
    setChoices(prev =>
      prev.map((c, i) => ({ ...c, is_correct: i === index }))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const options =
        formData.question_type === 'multiple_choice'
          ? optionsFromChoices(choices)
          : formData.options

      const dataToSubmit = { ...formData, options }

      if (isEditMode) {
        await updateQuestion({ id: Number(id), data: dataToSubmit as QuestionUpdate }).unwrap()
      } else {
        await createQuestion(dataToSubmit).unwrap()
      }
      navigate('/admin/questions')
    } catch (err: unknown) {
      console.error(err)
      alert(`Failed to ${isEditMode ? 'update' : 'create'} question`)
    }
  }

  const handleAddTag = () => {
    const t = tagInput.trim()
    if (t && !formData.tags?.includes(t)) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), t],
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(x => x !== tag) || [],
    }))
  }

  const difficultyUi = formData.difficulty === 'expert' ? 'advanced' : formData.difficulty
  const setDifficulty = (value: 'beginner' | 'intermediate' | 'advanced') => {
    setFormData(prev => ({ ...prev, difficulty: value }))
  }

  if (isEditMode && isLoadingQuestion) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground">
        <Link to="/admin" className="hover:text-foreground dark:hover:text-white">
          Admin
        </Link>
        <span className="mx-2">/</span>
        <Link to="/admin/questions" className="hover:text-foreground dark:hover:text-white">
          Questions
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground dark:text-white">
          {isEditMode ? 'Edit' : 'Create New'}
        </span>
      </nav>

      {/* Page title & actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Question Editor
          </h1>
          <p className="text-muted-foreground mt-1">
            Design high-quality interview questions for technical and trading roles.
          </p>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={isCreating || isUpdating}
          className="gap-2 shrink-0"
        >
          {isCreating || isUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isCreating || isUpdating ? 'Saving...' : 'Save Question'}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Question Details */}
        <Card className="border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden">
          <CardHeader className="border-b border-slate-200 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-900/50">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Question Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div className="space-y-2">
              <Label>Question Type</Label>
              <select
                value={formData.question_type}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    question_type: e.target.value as QuestionCreate['question_type'],
                  }))
                }
                className="flex h-10 w-full max-w-xs rounded-md border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="multiple_choice">Multiple Choice</option>
                <option value="true_false">True / False</option>
                <option value="scenario">Scenario</option>
                <option value="coding">Coding</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Question Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Invert a Binary Tree"
                  maxLength={255}
                  className="bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="topic">Tags</Label>
                <Input
                  id="topic"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="e.g. Probability, React — press Enter to add"
                  className="bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-700"
                />
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {formData.tags?.map(tag => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="pl-2 pr-1 py-0.5 text-xs font-normal gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="rounded-full p-0.5 hover:bg-muted"
                        aria-label={`Remove ${tag}`}
                      >
                        <XCircle className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Difficulty Level</Label>
              <div className="flex rounded-lg border border-slate-200 dark:border-gray-700 p-1 bg-slate-50/50 dark:bg-gray-900/50">
                {DIFFICULTY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDifficulty(opt.value)}
                    className={cn(
                      'flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors',
                      difficultyUi === opt.value
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white dark:hover:bg-gray-800'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Question Content</Label>
              <textarea
                id="content"
                value={formData.content}
                onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                required
                rows={8}
                className="flex w-full rounded-md border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Formulate the interview question here. Support for markdown is enabled..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Multiple Choice Options — only when type is multiple_choice */}
        {formData.question_type === 'multiple_choice' && (
          <Card className="border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden">
            <CardHeader className="border-b border-slate-200 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-900/50 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-muted-foreground" />
                Multiple Choice Options
              </CardTitle>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Select the correct option below
              </span>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {choices.map((choice, index) => (
                <div
                  key={choice.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                    choice.is_correct
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setCorrectIndex(index)}
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                      choice.is_correct
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground/40 hover:border-primary/50'
                    )}
                    aria-label={`Option ${CHOICE_LETTERS[index]} is ${choice.is_correct ? 'correct' : 'incorrect'}`}
                  >
                    {choice.is_correct && <span className="size-2 rounded-full bg-current" />}
                  </button>
                  <span className="text-sm font-medium w-6 shrink-0">{CHOICE_LETTERS[index]}</span>
                  <Input
                    value={choice.text}
                    onChange={e => setChoiceText(index, e.target.value)}
                    placeholder="Enter option text..."
                    className="flex-1 bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-700"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Other question types: minimal options editor */}
        {formData.question_type !== 'multiple_choice' && (
          <OtherOptionsEditor
            key={`other-opts-${formData.question_type}-${isEditMode && existingQuestion ? 'loaded' : 'init'}`}
            options={formData.options}
            onChange={opts => setFormData(prev => ({ ...prev, options: opts }))}
          />
        )}

        {/* Card 3: Solution Explanation */}
        <Card className="border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden">
          <CardHeader className="border-b border-slate-200 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-900/50">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              Solution Explanation
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            <p className="text-sm text-muted-foreground">
              Provide the reasoning behind the correct answer. This content is used for candidate feedback and AI-assisted grading.
            </p>
            <textarea
              id="explanation"
              value={formData.explanation ?? ''}
              onChange={e => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
              rows={6}
              className="flex w-full rounded-md border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Explain the logic, edge cases, and typical pitfalls..."
            />
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
