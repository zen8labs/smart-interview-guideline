import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { FileText, Upload, CheckCircle2, Link as LinkIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type InputTab = 'text' | 'file' | 'url'

export function NewJourneyPage() {
  const navigate = useNavigate()
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
        <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
          <CardHeader>
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle2 className="size-5" />
              <CardTitle>Phân tích xong</CardTitle>
            </div>
            <CardDescription>
              Đã trích xuất kỹ năng và domain từ JD. Tiếp tục bước Memory Scan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.extracted_keywords.skills?.length ? (
              <div>
                <p className="mb-1 text-sm font-medium text-muted-foreground">Skills</p>
                <p className="text-sm">{data.extracted_keywords.skills.join(', ')}</p>
              </div>
            ) : null}
            {data.extracted_keywords.domains?.length ? (
              <div>
                <p className="mb-1 text-sm font-medium text-muted-foreground">Domains</p>
                <p className="text-sm">{data.extracted_keywords.domains.join(', ')}</p>
              </div>
            ) : null}
            {data.extracted_keywords.keywords?.length ? (
              <div>
                <p className="mb-1 text-sm font-medium text-muted-foreground">Keywords</p>
                <p className="text-sm">{data.extracted_keywords.keywords.join(', ')}</p>
              </div>
            ) : null}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() =>
                  navigate(`/preparations/${data.preparation_id}/memory-scan`)
                }
              >
                Tiếp tục → Memory Scan
              </Button>
              <Button variant="outline" onClick={() => navigate('/')}>
                Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
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

            {error && (
              <p className="text-sm text-destructive">
                {'status' in error && error.status === 400
                  ? (error.data as { detail?: string })?.detail ?? 'Invalid input'
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
