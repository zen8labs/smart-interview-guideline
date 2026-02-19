import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  useListQuestionsQuery,
  useDeleteQuestionMutation,
  type QuestionFilterParams,
  type Question,
} from '@/store/api/endpoints/questionsApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import {
  Plus,
  Search,
  Trash2,
  Edit,
  Eye,
  Loader2,
  Upload,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const DIFFICULTY_DISPLAY: Record<string, { label: string; className: string }> = {
  beginner: { label: 'Easy', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  intermediate: { label: 'Medium', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  advanced: { label: 'Hard', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  expert: { label: 'Hard', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
}

const ROLE_OPTIONS = ['Frontend', 'Backend', 'Fullstack', 'DevOps']
const TOPIC_OPTIONS = ['React Core', 'System Design', 'Node.js', 'Terraform', 'General']

function formatUpdatedAt(updatedAt: string) {
  return dayjs(updatedAt).fromNow()
}

function getDifficultyDisplay(difficulty: string) {
  return DIFFICULTY_DISPLAY[difficulty] ?? { label: difficulty, className: 'bg-gray-500/20 text-gray-400' }
}

export default function QuestionsListPage() {
  const [filters, setFilters] = useState<QuestionFilterParams>({
    page: 1,
    page_size: 10,
    sort_by: 'updated_at',
    sort_order: 'desc',
    status: undefined,
    difficulty: undefined,
    search: '',
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
  const [topicFilter, setTopicFilter] = useState<string>('all')

  const { data, isLoading, error } = useListQuestionsQuery(filters)
  const [deleteQuestion] = useDeleteQuestionMutation()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setFilters({ ...filters, search: searchTerm, page: 1 })
  }

  const handleDifficultySelect = (value: string) => {
    setDifficultyFilter(value)
    const mapping: Record<string, string[] | undefined> = {
      all: undefined,
      easy: ['beginner'],
      medium: ['intermediate'],
      hard: ['advanced', 'expert'],
    }
    setFilters({
      ...filters,
      difficulty: mapping[value],
      page: 1,
    })
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this question?')) return
    try {
      await deleteQuestion(id).unwrap()
    } catch (err) {
      console.error('Failed to delete question', err)
    }
  }

  const total = data?.total ?? 0
  const pageSize = filters.page_size ?? 10
  const page = filters.page ?? 1
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  const items = data?.items ?? []
  const easyCount = items.filter((q) => q.difficulty === 'beginner').length
  const mediumCount = items.filter((q) => q.difficulty === 'intermediate').length
  const hardCount = items.filter((q) => q.difficulty === 'advanced' || q.difficulty === 'expert').length
  const totalOnPage = items.length
  const easyPct = totalOnPage ? (easyCount / totalOnPage) * 100 : 33
  const mediumPct = totalOnPage ? (mediumCount / totalOnPage) * 100 : 45
  const hardPct = totalOnPage ? (hardCount / totalOnPage) * 100 : 22

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-[50vh]">
        <XCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Failed to load questions</h3>
        <p className="text-slate-500 dark:text-gray-400 mb-4">Please try again later.</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
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
        <span className="text-foreground dark:text-white">Questions</span>
      </nav>

      {/* Title & description */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Interview Questions
        </h1>
        <p className="text-muted-foreground mt-1">
          Curate and manage technical assessment questions for various tracks.
        </p>
      </div>

      {/* Search, filters, actions - single row */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search questions..."
            className="pl-9 bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[130px] bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-700">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Role</SelectItem>
              {ROLE_OPTIONS.map((r) => (
                <SelectItem key={r} value={r.toLowerCase()}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={difficultyFilter} onValueChange={handleDifficultySelect}>
            <SelectTrigger className="w-[130px] bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-700">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Difficulty</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
          <Select value={topicFilter} onValueChange={setTopicFilter}>
            <SelectTrigger className="w-[130px] bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-700">
              <SelectValue placeholder="Topic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Topic</SelectItem>
              {TOPIC_OPTIONS.map((t) => (
                <SelectItem key={t} value={t.toLowerCase().replace(/\s+/g, '-')}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="border-slate-200 dark:border-gray-700">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
            <Link to="/admin/questions/create">
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Link>
          </Button>
        </div>
      </div>

      {/* Table card */}
      <Card className="border-slate-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-950">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="border-b border-slate-200 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Question text
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-28">
                    Role
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-32">
                    Topic
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-28">
                    Difficulty
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right w-24">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      No questions found. Try adjusting filters or add a new question.
                    </td>
                  </tr>
                ) : (
                  items.map((question) => (
                    <QuestionRow
                      key={question.id}
                      question={question}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="border-t border-slate-200 dark:border-gray-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-gray-900/30">
          <p className="text-sm text-muted-foreground order-2 sm:order-1">
            Showing <span className="font-medium text-foreground">{start}</span> to{' '}
            <span className="font-medium text-foreground">{end}</span> of{' '}
            <span className="font-medium text-foreground">{total}</span> questions.
          </p>
          <div className="flex items-center gap-1 order-1 sm:order-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({ ...filters, page: page - 1 })}
              disabled={page <= 1}
              className="h-8"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            {totalPages > 0 &&
              Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = i + 1
                return (
                  <Button
                    key={p}
                    variant={page === p ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setFilters({ ...filters, page: p })}
                  >
                    {p}
                  </Button>
                )
              })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({ ...filters, page: page + 1 })}
              disabled={page >= totalPages}
              className="h-8"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Footer stats */}
      <Card className="border-slate-200 dark:border-gray-800 p-6 bg-white dark:bg-gray-950">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total questions
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">{total.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-0.5">↑ breakdown from current page</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Easy
            </p>
            <p className="text-xl font-bold text-blue-500 mt-1">{easyCount}</p>
            <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${easyPct}%` }}
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Medium
            </p>
            <p className="text-xl font-bold text-orange-500 mt-1">{mediumCount}</p>
            <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-orange-500"
                style={{ width: `${mediumPct}%` }}
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Hard
            </p>
            <p className="text-xl font-bold text-red-500 mt-1">{hardCount}</p>
            <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-red-500"
                style={{ width: `${hardPct}%` }}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

function QuestionRow({
  question,
  onDelete,
}: {
  question: Question
  onDelete: (id: number) => void
}) {
  const displayText = question.content || question.title
  const { label: difficultyLabel, className: difficultyClass } = getDifficultyDisplay(question.difficulty)
  const roleDisplay = question.tags?.[0] ?? '—'
  const topicDisplay = question.tags?.[1] ?? question.tags?.[0] ?? '—'

  return (
    <tr className="hover:bg-slate-50/80 dark:hover:bg-gray-800/50 transition-colors group">
      <td className="px-6 py-4">
        <div className="flex flex-col gap-0.5">
          <Link
            to={`/admin/questions/${question.id}`}
            className="font-medium text-foreground hover:text-primary line-clamp-2"
          >
            {displayText}
          </Link>
          <span className="text-xs text-muted-foreground">
            Updated {formatUpdatedAt(question.updated_at)}
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 border border-slate-200 dark:border-gray-700">
          {roleDisplay}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 border border-slate-200 dark:border-gray-700">
          {topicDisplay}
        </span>
      </td>
      <td className="px-6 py-4">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium border',
            difficultyClass
          )}
        >
          <span className="size-1.5 rounded-full bg-current opacity-80" />
          {difficultyLabel}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button asChild size="icon" variant="ghost" className="h-8 w-8">
            <Link to={`/admin/questions/${question.id}/edit`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="icon" variant="ghost" className="h-8 w-8">
            <Link to={`/admin/questions/${question.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
            onClick={() => onDelete(question.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  )
}
