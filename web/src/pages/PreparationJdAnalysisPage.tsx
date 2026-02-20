import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  useGetPreparationQuery,
  useGetPreparationJdAnalysisQuery,
  useSubmitJdForPreparationMutation,
} from '@/store/api/endpoints/preparationApi'
import { usePreparationFlowProgress } from '@/contexts/PreparationFlowContext'
import { JdAnalysisResultCard } from '@/components/JdAnalysisResultCard'
import { ThinkingLoader } from '@/components/ThinkingLoader'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText, Upload, Link as LinkIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { JDAnalysisResult } from '@/store/api/endpoints/analysisApi'

type InputTab = 'text' | 'file' | 'url'

export function PreparationJdAnalysisPage() {
  const { preparationId } = useParams<{ preparationId: string }>()
  const id = Number(preparationId)
  const isValidId = Boolean(preparationId && !Number.isNaN(id))

  const { data: preparation, isLoading: prepLoading, isError: prepError } = useGetPreparationQuery(
    id,
    { skip: !isValidId }
  )
  const isJdPending = preparation?.status === 'jd_pending'

  const {
    data: jdData,
    isLoading: jdLoading,
    isError: jdError,
  } = useGetPreparationJdAnalysisQuery(id, {
    skip: !isValidId || isJdPending,
  })

  const [submitJd, { isLoading: isSubmitting, data: submittedResult }] =
    useSubmitJdForPreparationMutation()
  const { setStepProgress, clearStepProgress } = usePreparationFlowProgress()

  const [activeTab, setActiveTab] = useState<InputTab>('text')
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [linkedInUrl, setLinkedInUrl] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Show result from either submitted mutation or fetched JD analysis
  const result: JDAnalysisResult | null = submittedResult ?? jdData ?? null

  useEffect(() => {
    if (isSubmitting) {
      setStepProgress(0, 'Đang phân tích JD và trích xuất từ khóa...')
    } else {
      clearStepProgress()
    }
  }, [isSubmitting, setStepProgress, clearStepProgress])

  const handleSubmitJd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    if (activeTab === 'text' && !text.trim()) return
    if (activeTab === 'file' && !file) return
    if (activeTab === 'url' && !linkedInUrl.trim()) return
    if (!isValidId) return

    try {
      await submitJd({
        preparationId: id,
        params: {
          text: activeTab === 'text' ? text : undefined,
          file: activeTab === 'file' ? file ?? undefined : undefined,
          linkedin_url: activeTab === 'url' ? linkedInUrl.trim() : undefined,
        },
      }).unwrap()
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' && err !== null && 'data' in err && typeof (err as { data?: { detail?: string } }).data?.detail === 'string'
          ? (err as { data: { detail: string } }).data.detail
          : 'Có lỗi xảy ra. Thử lại.'
      setSubmitError(msg)
    }
  }

  // Invalid or missing preparation id
  if (!isValidId) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Đường dẫn không hợp lệ. <Link to="/preparations" className="underline">Về danh sách chuẩn bị</Link>
      </div>
    )
  }

  // Loading preparation
  if (prepLoading || (prepError && !preparation)) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (prepError) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Không tìm thấy lần chuẩn bị. <Link to="/preparations" className="underline">Về danh sách chuẩn bị</Link>
      </div>
    )
  }

  // JD step: show result (from submit or from fetch)
  if (result) {
    return (
      <div className="mx-auto w-full space-y-5">
        <JdAnalysisResultCard
          preparationId={result.preparation_id}
          extracted_keywords={result.extracted_keywords}
          primaryAction={{ label: 'Tiếp tục → Memory Scan', to: 'memory-scan' }}
        />
      </div>
    )
  }

  // JD pending: show upload form
  if (isJdPending) {
    return (
      <div className="mx-auto w-full space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>Job description</CardTitle>
            <CardDescription>
              Nhập JD: dán text, upload file (PDF/DOCX/TXT) hoặc link LinkedIn.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-2 rounded-lg border p-1 bg-muted/30">
              <button
                type="button"
                onClick={() => setActiveTab('text')}
                className={cn(
                  'flex min-w-0 flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  activeTab === 'text'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <FileText className="size-4 shrink-0" />
                Dán text
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('file')}
                className={cn(
                  'flex min-w-0 flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  activeTab === 'file'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Upload className="size-4 shrink-0" />
                Upload file
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('url')}
                className={cn(
                  'flex min-w-0 flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  activeTab === 'url'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <LinkIcon className="size-4 shrink-0" />
                LinkedIn URL
              </button>
            </div>

            <form onSubmit={handleSubmitJd} className="space-y-4">
              {activeTab === 'text' ? (
                <div className="space-y-2">
                  <Label htmlFor="jd-text">Job description</Label>
                  <textarea
                    id="jd-text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Dán toàn bộ nội dung JD vào đây..."
                    className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required={activeTab === 'text'}
                    disabled={isSubmitting}
                  />
                </div>
              ) : activeTab === 'file' ? (
                <div className="space-y-2">
                  <Label htmlFor="jd-file">File (PDF, DOCX, TXT)</Label>
                  <Input
                    id="jd-file"
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    disabled={isSubmitting}
                  />
                  {file && (
                    <p className="text-sm text-muted-foreground">Đã chọn: {file.name}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="jd-url">LinkedIn Job URL</Label>
                  <Input
                    id="jd-url"
                    type="url"
                    value={linkedInUrl}
                    onChange={(e) => setLinkedInUrl(e.target.value)}
                    placeholder="https://www.linkedin.com/jobs/view/..."
                    required={activeTab === 'url'}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Dán link bài tuyển dụng LinkedIn, ví dụ: linkedin.com/jobs/view/4375191000
                  </p>
                </div>
              )}

              {submitError && (
                <p className="text-sm text-destructive">{submitError}</p>
              )}

              {isSubmitting ? (
                <ThinkingLoader
                  messages={[
                    'Đang phân tích JD của bạn...',
                    'Đang trích xuất kỹ năng và domain...',
                  ]}
                />
              ) : (
                <Button type="submit">Phân tích JD</Button>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Loading JD result (prep exists, not jd_pending, no result yet)
  if (jdLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (jdError) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Không tải được kết quả phân tích JD.{' '}
        <Link to={`/preparations/${id}/memory-scan`} className="underline">
          Chuyển sang Memory Scan
        </Link>
      </div>
    )
  }

  return null
}
