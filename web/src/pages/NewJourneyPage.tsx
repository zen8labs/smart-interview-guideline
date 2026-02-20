import { useState } from 'react'
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
import { ThinkingLoader } from '@/components/ThinkingLoader'
import { PreparationStepper } from '@/components/PreparationStepper'
import { useSubmitAnalysisMutation } from '@/store/api/endpoints/analysisApi'
import { JdAnalysisResultCard } from '@/components/JdAnalysisResultCard'
import { FileText, Upload, Link as LinkIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type InputTab = 'text' | 'file' | 'url'

export function NewJourneyPage() {
  const [submitAnalysis, { isLoading, isSuccess, data, error }] =
    useSubmitAnalysisMutation()

  const [activeTab, setActiveTab] = useState<InputTab>('text')
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [linkedInUrl, setLinkedInUrl] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (activeTab === 'text' && !text.trim()) return
    if (activeTab === 'file' && !file) return
    if (activeTab === 'url' && !linkedInUrl.trim()) return

    try {
      await submitAnalysis({
        text: activeTab === 'text' ? text : undefined,
        file: activeTab === 'file' ? file ?? undefined : undefined,
        linkedin_url: activeTab === 'url' ? linkedInUrl.trim() : undefined,
      }).unwrap()
    } catch {
      // Error handled by error state
    }
  }

  if (isSuccess && data) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-5">
        <PreparationStepper currentStep={0} preparationId={data.preparation_id} />
        <JdAnalysisResultCard
          preparationId={data.preparation_id}
          extracted_keywords={data.extracted_keywords}
          primaryAction={{ label: 'Tiếp tục → Memory Scan', to: `/preparations/${data.preparation_id}/memory-scan` }}
          secondaryAction={{ label: 'Dashboard', to: '/' }}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <PreparationStepper currentStep={0} preparationId={null} />
      <Card>
        <CardHeader>
          <CardTitle>Job description</CardTitle>
          <CardDescription>
            Enter the job description text or upload a PDF/DOCX/TXT file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Tabs */}
          <div className="mb-4 flex flex-wrap gap-2 rounded-lg border p-1 bg-muted/30">
            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={cn(
                'flex flex-1 min-w-0 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
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
                'flex flex-1 min-w-0 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
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
                'flex flex-1 min-w-0 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                activeTab === 'url'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <LinkIcon className="size-4 shrink-0" />
              LinkedIn URL
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === 'text' ? (
              <div className="space-y-2">
                <Label htmlFor="jd-text">Job description</Label>
                <textarea
                  id="jd-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste the full job description here..."
                  className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required={activeTab === 'text'}
                  disabled={isLoading}
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
                  disabled={isLoading}
                />
                {file && (
                  <p className="text-sm text-muted-foreground">Selected: {file.name}</p>
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
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Dán link bài tuyển dụng LinkedIn, ví dụ: linkedin.com/jobs/view/4375191000
                </p>
              </div>
            )}

            {Boolean(error) && (
              <p className="text-sm text-destructive">
                {typeof error === 'object' && error !== null && 'status' in error && (error as { status: number }).status === 400
                  ? (error as { data?: { detail?: string } }).data?.detail ?? 'Invalid input'
                  : 'Something went wrong. Please try again.'}
              </p>
            )}

            {isLoading ? (
              <ThinkingLoader
                messages={[
                  'Đang phân tích JD của bạn...',
                  'Đang trích xuất kỹ năng và domain...',
                  'Đang chuẩn bị bước tiếp theo...',
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
