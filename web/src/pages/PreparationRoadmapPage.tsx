import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { usePreparationFlowProgress } from '@/contexts/PreparationFlowContext'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useGetPreparationRoadmapQuery } from '@/store/api/endpoints/preparationApi'
import { useCompleteTaskMutation } from '@/store/api/endpoints/roadmapApi'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  CheckCircle2,
  Circle,
  BookOpen,
  ChevronRight,
  ExternalLink,
  Youtube,
  FileText,
  GraduationCap,
  BookOpenIcon,
  BookOpen as BookOpenIconAlt,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  RoadmapTask,
  RoadmapTaskReference,
} from '@/store/api/endpoints/preparationApi'
import { ThinkingLoader } from '@/components/ThinkingLoader'

/** Minimal markdown components: clear spacing, border-collapse tables, compact code */
const markdownComponents = {
  p({ children, ...props }: React.ComponentProps<'p'>) {
    return (
      <p className="my-1.5 leading-relaxed tracking-[0.01em] text-foreground" {...props}>
        {children}
      </p>
    )
  },
  ul({ children, ...props }: React.ComponentProps<'ul'>) {
    return (
      <ul className="my-1.5 list-disc pl-5 space-y-0.5 leading-relaxed" {...props}>
        {children}
      </ul>
    )
  },
  ol({ children, ...props }: React.ComponentProps<'ol'>) {
    return (
      <ol className="my-1.5 list-decimal pl-5 space-y-0.5 leading-relaxed" {...props}>
        {children}
      </ol>
    )
  },
  li({ children, ...props }: React.ComponentProps<'li'>) {
    return (
      <li className="pl-0.5 leading-relaxed tracking-[0.01em]" {...props}>
        {children}
      </li>
    )
  },
  h1({ children, ...props }: React.ComponentProps<'h1'>) {
    return (
      <h1 className="mt-3 mb-1 font-semibold text-lg tracking-tight text-foreground first:mt-0" {...props}>
        {children}
      </h1>
    )
  },
  h2({ children, ...props }: React.ComponentProps<'h2'>) {
    return (
      <h2 className="mt-3 mb-1 font-semibold text-base tracking-tight text-foreground first:mt-0" {...props}>
        {children}
      </h2>
    )
  },
  h3({ children, ...props }: React.ComponentProps<'h3'>) {
    return (
      <h3 className="mt-2.5 mb-0.5 font-semibold text-sm tracking-tight text-foreground first:mt-0" {...props}>
        {children}
      </h3>
    )
  },
  h4({ children, ...props }: React.ComponentProps<'h4'>) {
    return (
      <h4 className="mt-2 mb-0.5 font-medium text-sm text-foreground first:mt-0" {...props}>
        {children}
      </h4>
    )
  },
  table({ children, ...props }: React.ComponentProps<'table'>) {
    return (
      <div className="my-2 overflow-x-auto rounded-md border border-border">
        <table className="w-full border-collapse text-sm" {...props}>
          {children}
        </table>
      </div>
    )
  },
  thead({ children, ...props }: React.ComponentProps<'thead'>) {
    return (
      <thead className="bg-muted/50" {...props}>
        {children}
      </thead>
    )
  },
  tbody({ children, ...props }: React.ComponentProps<'tbody'>) {
    return <tbody className="text-foreground" {...props}>{children}</tbody>
  },
  tr({ children, ...props }: React.ComponentProps<'tr'>) {
    return (
      <tr className="border-b border-border last:border-b-0" {...props}>
        {children}
      </tr>
    )
  },
  th({ children, ...props }: React.ComponentProps<'th'>) {
    return (
      <th
        className="border-b border-border px-3 py-2 text-left font-medium text-foreground"
        {...props}
      >
        {children}
      </th>
    )
  },
  td({ children, ...props }: React.ComponentProps<'td'>) {
    return (
      <td className="px-3 py-2 text-muted-foreground" {...props}>
        {children}
      </td>
    )
  },
  blockquote({ children, ...props }: React.ComponentProps<'blockquote'>) {
    return (
      <blockquote
        className="my-1.5 border-l-2 border-muted-foreground/40 pl-3 text-muted-foreground italic"
        {...props}
      >
        {children}
      </blockquote>
    )
  },
  hr({ ...props }: React.ComponentProps<'hr'>) {
    return <hr className="my-2 border-border" {...props} />
  },
  a({ children, href, ...props }: React.ComponentProps<'a'>) {
    return (
      <a
        href={href}
        className="text-primary underline underline-offset-2 hover:no-underline"
        {...props}
      >
        {children}
      </a>
    )
  },
  strong({ children, ...props }: React.ComponentProps<'strong'>) {
    return <strong className="font-semibold text-foreground" {...props}>{children}</strong>
  },
  code(props: React.ComponentProps<'code'> & { node?: unknown }) {
    const { className, children } = props
    const match = /language-(\w+)/.exec(className ?? '')
    const code = String(children ?? '').replace(/\n$/, '')
    return match ? (
      <SyntaxHighlighter
        PreTag="div"
        language={match[1]}
        style={oneDark}
        customStyle={{
          margin: '0.25rem 0',
          borderRadius: '0.375rem',
          fontSize: '0.8125rem',
          padding: '0.75rem',
        }}
        codeTagProps={{ className: 'font-mono' }}
      >
        {code}
      </SyntaxHighlighter>
    ) : (
      <code className="rounded bg-muted px-1 py-0.5 font-mono text-sm">{children}</code>
    )
  },
}

export function PreparationRoadmapPage() {
  const { preparationId } = useParams<{ preparationId: string }>()
  const id = Number(preparationId)
  const [modalTask, setModalTask] = useState<RoadmapTask | null>(null)

  const { data: roadmapData, isLoading } = useGetPreparationRoadmapQuery(id, {
    skip: !id || Number.isNaN(id),
  })
  const [completeTask, { isLoading: isCompleting }] = useCompleteTaskMutation()
  const { setStepProgress, clearStepProgress } = usePreparationFlowProgress()

  useEffect(() => {
    if (isLoading) setStepProgress(2, 'Đang tải roadmap của bạn...')
    else clearStepProgress()
  }, [isLoading, setStepProgress, clearStepProgress])

  if (!id || Number.isNaN(id)) {
    return (
      <div className="mx-auto max-w-md">
        <p className="text-muted-foreground">Preparation không hợp lệ.</p>
        <Button asChild variant="outline">
          <Link to="/preparations">Danh sách chuẩn bị</Link>
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <ThinkingLoader
        messages={[
          'Đang tải roadmap của bạn...',
          'Đang chuẩn bị nội dung học tập...',
        ]}
      />
    )
  }

  const tasks = roadmapData?.tasks ?? []
  const hasRoadmap = roadmapData?.roadmap_id != null
  const completedCount = tasks.filter((t) => t.is_completed).length

  if (!hasRoadmap) {
    return (
      <div className="mx-auto max-w-md">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>Chưa có roadmap. Hoàn thành Memory Scan trước.</p>
            <Button asChild variant="outline" className="mt-4">
              <Link to={`/preparations/${id}/memory-scan`}>Làm Memory Scan</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full space-y-5">
      <p className="text-sm text-muted-foreground">
        {completedCount}/{tasks.length} item đã đánh dấu hiểu
      </p>

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
          <CardContent className="py-10 text-center text-muted-foreground">
            <BookOpen className="mx-auto mb-2 size-10 opacity-50" />
            <p>Chưa có item nào trong roadmap.</p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <RoadmapListItem
              key={task.id}
              task={task}
              onOpen={() => setModalTask(task)}
            />
          ))}
        </ul>
      )}

      <Sheet open={!!modalTask} onOpenChange={(open) => !open && setModalTask(null)}>
        <SheetContent
          side="right"
          className="flex h-full w-full max-w-none flex-col border-l p-0 sm:max-w-[min(90vw,52rem)]"
        >
          {modalTask && (
            <RoadmapDetailSheet
              task={modalTask}
              onComplete={() => {
                completeTask(modalTask.id)
                setModalTask(null)
              }}
              isCompleting={isCompleting}
            />
          )}
        </SheetContent>
      </Sheet>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="default" size="sm">
          <Link to={`/preparations/${id}/self-check`}>
            Tiếp tục → Self-check câu hỏi <ChevronRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

function RoadmapListItem({
  task,
  onOpen,
}: {
  task: RoadmapTask
  onOpen: () => void
}) {
  return (
    <Card
      className={cn(
        'transition-colors hover:bg-muted/40',
        task.is_completed &&
          'border-green-200 bg-green-50/20 dark:border-green-900 dark:bg-green-950/10'
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        {task.is_completed ? (
          <CheckCircle2 className="size-5 shrink-0 text-green-600 dark:text-green-400" />
        ) : (
          <Circle className="size-5 shrink-0 text-muted-foreground" />
        )}
        <span className="min-w-0 flex-1 truncate font-medium">{task.title}</span>
        <BookOpenIconAlt className="size-4 shrink-0 text-muted-foreground" />
      </button>
    </Card>
  )
}

function RoadmapDetailSheet({
  task,
  onComplete,
  isCompleting,
}: {
  task: RoadmapTask
  onComplete: () => void
  isCompleting: boolean
}) {
  return (
    <>
      <SheetHeader className="shrink-0 border-b px-6 py-4">
        <SheetTitle className="text-left text-lg">{task.title}</SheetTitle>
      </SheetHeader>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-none text-sm">
          {task.content_type === 'markdown' ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {task.content}
            </ReactMarkdown>
          ) : (
            <p className="whitespace-pre-wrap text-sm text-foreground">{task.content}</p>
          )}
        </div>
        {task.meta?.image_url && (
          <div className="mt-4">
            <img
              src={task.meta.image_url}
              alt=""
              className="max-h-64 w-full rounded-md object-cover"
            />
          </div>
        )}
        {task.meta?.references && task.meta.references.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Tài liệu tham khảo
            </p>
            <ul className="space-y-2">
              {task.meta.references.map((reference, i) => (
                <ReferenceLink key={i} reference={reference} />
              ))}
            </ul>
          </div>
        )}
        {!task.is_completed && (
          <Button
            variant="outline"
            size="sm"
            className="mt-6"
            disabled={isCompleting}
            onClick={onComplete}
          >
            Đã hiểu
          </Button>
        )}
      </div>
    </>
  )
}

function ReferenceLink({ reference: r }: { reference: RoadmapTaskReference }) {
  const icon =
    r.type === 'youtube' ? (
      <Youtube className="size-4 shrink-0" />
    ) : r.type === 'course' ? (
      <GraduationCap className="size-4 shrink-0" />
    ) : r.type === 'docs' ? (
      <FileText className="size-4 shrink-0" />
    ) : (
      <BookOpenIcon className="size-4 shrink-0" />
    )
  return (
    <li>
      <a
        href={r.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm transition-colors hover:bg-muted/50"
      >
        {icon}
        <span className="flex-1 truncate">{r.title}</span>
        <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
      </a>
    </li>
  )
}
