import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useListCompaniesQuery,
  useCreateCompanyMutation,
} from '@/store/api/endpoints/companiesApi'
import {
  useListMyContributionsQuery,
  useCreateContributionMutation,
} from '@/store/api/endpoints/contributionApi'
import { useListPreparationsQuery } from '@/store/api/endpoints/preparationApi'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Gift,
  Building2,
  FileText,
  MessageSquare,
  CheckCircle2,
  Calendar,
  MessageCircleQuestion,
  ChevronRight,
  Upload,
  Link as LinkIcon,
} from 'lucide-react'
import { useExtractJdTextMutation } from '@/store/api/endpoints/analysisApi'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Contribution, ContributionStatus } from '@/store/api/endpoints/contributionApi'

const STATUS_LABEL: Record<ContributionStatus, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
}

function StatusBadge({ status }: { status: ContributionStatus }) {
  return (
    <Badge
      variant={status === 'rejected' ? 'destructive' : status === 'approved' ? 'default' : 'secondary'}
      className={cn(
        status === 'approved' && 'border-green-500/50 bg-green-500/20 text-green-700 dark:text-green-400'
      )}
    >
      {STATUS_LABEL[status]}
    </Badge>
  )
}

function ContributionDetailSheet({ contribution }: { contribution: Contribution; onClose: () => void }) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 border-b bg-muted/30 px-6 pt-12 pb-5">
        <SheetHeader className="text-left space-y-0">
          <SheetTitle className="text-xl font-semibold text-foreground flex flex-wrap items-baseline gap-2">
            <span>{contribution.company_name ?? `Công ty #${contribution.company_id}`}</span>
            {contribution.job_position && (
              <span className="text-base font-normal text-muted-foreground">
                · {contribution.job_position}
              </span>
            )}
          </SheetTitle>
          <CardDescription className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              {new Date(contribution.created_at).toLocaleString('vi-VN')}
            </span>
            <span>#{contribution.id}</span>
          </CardDescription>
        </SheetHeader>
        <div className="mt-4">
          <StatusBadge status={contribution.status} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        <section>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
            <FileText className="size-4 text-muted-foreground" />
            Job description
          </h3>
          <div className="rounded-lg border bg-muted/20 p-4 text-sm leading-relaxed whitespace-pre-wrap max-h-52 overflow-y-auto">
            {contribution.jd_content}
          </div>
        </section>
        {contribution.question_info?.length > 0 && (
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
              <MessageCircleQuestion className="size-4 text-muted-foreground" />
              Câu hỏi phỏng vấn ({contribution.question_info.length})
            </h3>
            <ol className="rounded-lg border bg-muted/20 p-4 space-y-2.5 max-h-44 overflow-y-auto list-decimal list-inside text-sm leading-relaxed [&>li]:pl-1">
              {contribution.question_info.map((q, i) => (
                <li key={i}>
                  {typeof q.question_text === 'string' ? q.question_text : JSON.stringify(q)}
                </li>
              ))}
            </ol>
          </section>
        )}
        {contribution.candidate_responses && (
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
              <MessageSquare className="size-4 text-muted-foreground" />
              Câu trả lời / phản hồi
            </h3>
            <div className="rounded-lg border bg-muted/20 p-4 text-sm leading-relaxed whitespace-pre-wrap max-h-44 overflow-y-auto">
              {contribution.candidate_responses}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export function ContributePage() {
  const [searchParams] = useSearchParams()
  const preparationIdParam = searchParams.get('preparation_id')

  const [companyId, setCompanyId] = useState<number | ''>('')
  const [newCompanyName, setNewCompanyName] = useState('')
  const [useNewCompany, setUseNewCompany] = useState(false)
  const [preparationId, setPreparationId] = useState<number | ''>(
    preparationIdParam ? Number(preparationIdParam) : ''
  )
  const [jobPosition, setJobPosition] = useState('')
  const [jdContent, setJdContent] = useState('')
  type JdInputMode = 'text' | 'file' | 'url'
  const [jdInputMode, setJdInputMode] = useState<JdInputMode>('text')
  const [jdFile, setJdFile] = useState<File | null>(null)
  const [jdLinkedInUrl, setJdLinkedInUrl] = useState('')
  const [questionsText, setQuestionsText] = useState('')
  const [candidateResponses, setCandidateResponses] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const [extractJdText, { isLoading: extractingJd }] = useExtractJdTextMutation()
  const { data: companies = [], isLoading: loadingCompanies } = useListCompaniesQuery(
    { limit: 100 }
  )
  const { data: preparations = [] } = useListPreparationsQuery()
  const [createCompany, { isLoading: creatingCompany }] = useCreateCompanyMutation()
  const [createContribution, { isLoading: submitting, error }] =
    useCreateContributionMutation()

  const { data: contributions = [], isLoading: loadingList } =
    useListMyContributionsQuery()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const selected = contributions.find((c) => c.id === selectedId) ?? null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    let cid: number
    if (useNewCompany && newCompanyName.trim()) {
      try {
        const created = await createCompany({ name: newCompanyName.trim() }).unwrap()
        cid = created.id
      } catch {
        return
      }
    } else if (typeof companyId === 'number') {
      cid = companyId
    } else {
      return
    }
    const questionInfo = questionsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((question_text) => ({ question_text }))
    try {
      await createContribution({
        company_id: cid,
        preparation_id: preparationId || null,
        job_position: jobPosition.trim() || null,
        jd_content: jdContent.trim(),
        question_info: questionInfo,
        candidate_responses: candidateResponses.trim() || null,
      }).unwrap()
      setSubmitted(true)
      setJdContent('')
      setJdInputMode('text')
      setJdFile(null)
      setJdLinkedInUrl('')
      setJobPosition('')
      setQuestionsText('')
      setCandidateResponses('')
    } catch {
      // error from mutation
    }
  }

  const showForm = !submitted
  const isLoading = loadingCompanies || submitting

  const handleExtractJd = async () => {
    if (jdInputMode === 'file' && !jdFile) return
    if (jdInputMode === 'url' && !jdLinkedInUrl.trim()) return
    try {
      const result = await extractJdText({
        text: jdInputMode === 'text' ? jdContent : undefined,
        file: jdInputMode === 'file' ? jdFile ?? undefined : undefined,
        linkedin_url: jdInputMode === 'url' ? jdLinkedInUrl.trim() : undefined,
      }).unwrap()
      setJdContent(result.raw_text)
      setJdInputMode('text')
    } catch {
      // Error shown by mutation
    }
  }

  return (
    <div className="mx-auto w-full space-y-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Đóng góp thông tin phỏng vấn
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chia sẻ JD, tên công ty, câu hỏi và câu trả lời sau cuộc phỏng vấn để hệ thống
          hỗ trợ chuẩn bị tốt hơn cho mọi người.
        </p>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="space-y-1.5">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gift className="size-5 text-primary" />
              Form đóng góp
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Điền thông tin cuộc phỏng vấn. Bạn có thể gắn với một lần chuẩn bị nếu đã dùng S.I.G.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <form id="contribute-form" onSubmit={handleSubmit} className="space-y-0">
              {/* Section: Thông tin công ty & vị trí */}
              <fieldset className="space-y-4 pb-6">
                <legend className="text-sm font-medium text-foreground flex items-center gap-2 mb-1">
                  <Building2 className="size-4 text-muted-foreground" />
                  Công ty & vị trí
                </legend>

                <div className="space-y-3">
                  <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                    Công ty
                  </Label>
                  <div className="inline-flex p-0.5 rounded-lg border bg-muted/30 border-input">
                    <button
                      type="button"
                      onClick={() => setUseNewCompany(false)}
                      className={cn(
                        'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                        !useNewCompany
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      Chọn công ty có sẵn
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseNewCompany(true)}
                      className={cn(
                        'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                        useNewCompany
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      Thêm công ty mới
                    </button>
                  </div>
                  {useNewCompany ? (
                    <Input
                      placeholder="Nhập tên công ty mới"
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                      required={useNewCompany}
                      className="mt-1"
                    />
                  ) : (
                    <Select
                      value={companyId === '' ? undefined : String(companyId)}
                      onValueChange={(v) => setCompanyId(v === '' ? '' : Number(v))}
                      required={!useNewCompany}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Chọn công ty" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="job-position" className="text-sm">
                      Vị trí tuyển dụng
                    </Label>
                    <span className="text-xs text-muted-foreground ml-1">(tùy chọn)</span>
                    <Input
                      id="job-position"
                      placeholder="VD: Backend Engineer"
                      value={jobPosition}
                      onChange={(e) => setJobPosition(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Gắn với lần chuẩn bị</Label>
                    <span className="text-xs text-muted-foreground ml-1">(tùy chọn)</span>
                    <Select
                      value={
                        preparationId === ''
                          ? 'none'
                          : String(preparationId)
                      }
                      onValueChange={(v) =>
                        setPreparationId(v === 'none' ? '' : Number(v))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Không gắn" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Không gắn</SelectItem>
                        {preparations.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            Chuẩn bị #{p.id} ({new Date(p.created_at).toLocaleDateString('vi-VN')})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </fieldset>

              <Separator className="my-6" />

              {/* Section: Nội dung phỏng vấn */}
              <fieldset className="space-y-4 pb-6">
                <legend className="text-sm font-medium text-foreground flex items-center gap-2 mb-1">
                  <FileText className="size-4 text-muted-foreground" />
                  Nội dung phỏng vấn
                </legend>

                <div className="space-y-3">
                  <Label className="text-sm">
                    Job description <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex flex-wrap gap-2 rounded-lg border p-1 bg-muted/30">
                    <button
                      type="button"
                      onClick={() => setJdInputMode('text')}
                      className={cn(
                        'flex min-w-0 flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        jdInputMode === 'text'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <FileText className="size-4 shrink-0" />
                      Dán text
                    </button>
                    <button
                      type="button"
                      onClick={() => setJdInputMode('file')}
                      className={cn(
                        'flex min-w-0 flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        jdInputMode === 'file'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Upload className="size-4 shrink-0" />
                      Upload file
                    </button>
                    <button
                      type="button"
                      onClick={() => setJdInputMode('url')}
                      className={cn(
                        'flex min-w-0 flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        jdInputMode === 'url'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <LinkIcon className="size-4 shrink-0" />
                      LinkedIn URL
                    </button>
                  </div>

                  {jdInputMode === 'text' ? (
                    <textarea
                      id="jd-content"
                      className={cn(
                        'border-input placeholder:text-muted-foreground min-h-[140px] w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none',
                        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'
                      )}
                      placeholder="Dán hoặc nhập nội dung JD..."
                      value={jdContent}
                      onChange={(e) => setJdContent(e.target.value)}
                      required={jdInputMode === 'text'}
                    />
                  ) : jdInputMode === 'file' ? (
                    <div className="space-y-2">
                      <Input
                        id="jd-file"
                        type="file"
                        accept=".pdf,.docx,.txt"
                        onChange={(e) => setJdFile(e.target.files?.[0] ?? null)}
                        disabled={extractingJd}
                      />
                      {jdFile && (
                        <p className="text-sm text-muted-foreground">
                          Đã chọn: {jdFile.name}
                        </p>
                      )}
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleExtractJd}
                        disabled={!jdFile || extractingJd}
                      >
                        {extractingJd ? 'Đang trích xuất...' : 'Trích xuất JD'}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        id="jd-url"
                        type="url"
                        value={jdLinkedInUrl}
                        onChange={(e) => setJdLinkedInUrl(e.target.value)}
                        placeholder="https://www.linkedin.com/jobs/view/..."
                        disabled={extractingJd}
                      />
                      <p className="text-xs text-muted-foreground">
                        Dán link bài tuyển dụng LinkedIn.
                      </p>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleExtractJd}
                        disabled={!jdLinkedInUrl.trim() || extractingJd}
                      >
                        {extractingJd ? 'Đang trích xuất...' : 'Trích xuất JD'}
                      </Button>
                    </div>
                  )}

                  {jdInputMode !== 'text' && jdContent.trim() && (
                    <p className="text-xs text-muted-foreground">
                      Đã có nội dung JD ({jdContent.length} ký tự). Bạn có thể chuyển sang tab &quot;Dán text&quot; để chỉnh sửa hoặc gửi đóng góp.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="questions" className="flex items-center gap-2 text-sm">
                    <MessageCircleQuestion className="size-4 text-muted-foreground" />
                    Câu hỏi phỏng vấn
                  </Label>
                  <p className="text-xs text-muted-foreground">Mỗi dòng một câu hỏi.</p>
                  <textarea
                    id="questions"
                    className={cn(
                      'border-input placeholder:text-muted-foreground min-h-[100px] w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none',
                      'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'
                    )}
                    placeholder="VD: Câu hỏi kỹ thuật? Kinh nghiệm làm việc nhóm? (mỗi dòng một câu)"
                    value={questionsText}
                    onChange={(e) => setQuestionsText(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responses" className="flex items-center gap-2 text-sm">
                    <MessageSquare className="size-4 text-muted-foreground" />
                    Câu trả lời / phản hồi
                  </Label>
                  <span className="text-xs text-muted-foreground">(tùy chọn)</span>
                  <textarea
                    id="responses"
                    className={cn(
                      'border-input placeholder:text-muted-foreground min-h-[100px] w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none',
                      'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'
                    )}
                    placeholder="Ghi lại câu trả lời của bạn hoặc phản hồi từ người phỏng vấn..."
                    value={candidateResponses}
                    onChange={(e) => setCandidateResponses(e.target.value)}
                  />
                </div>
              </fieldset>

              {Boolean(error) && (
                <p className="text-sm text-destructive mb-4">
                  {typeof error === 'object' && error !== null && 'data' in error &&
                   typeof (error as { data?: { detail?: string } }).data?.detail === 'string'
                    ? (error as { data: { detail: string } }).data.detail
                    : 'Gửi thất bại. Vui lòng thử lại.'}
                </p>
              )}
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 border-t pt-6">
            <Button
              type="submit"
              form="contribute-form"
              disabled={isLoading || creatingCompany || !jdContent.trim()}
              className="w-full sm:w-auto min-w-[140px]"
            >
              {submitting || creatingCompany ? 'Đang gửi...' : 'Gửi đóng góp'}
            </Button>
          </CardFooter>
        </Card>
      )}

      {submitted && (
        <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
          <CardHeader>
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle2 className="size-5" />
              <CardTitle>Đã gửi đóng góp</CardTitle>
            </div>
          </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Cảm ơn bạn đã đóng góp. Thông tin sẽ giúp hệ thống hỗ trợ chuẩn bị phỏng
                vấn tốt hơn.
              </p>
              <Button
                variant="outline"
                className="mt-3"
                onClick={() => {
                  setSubmitted(false)
                  setCompanyId('')
                  setNewCompanyName('')
                  setJdContent('')
                  setJdInputMode('text')
                  setJdFile(null)
                  setJdLinkedInUrl('')
                }}
              >
                Đóng góp thêm
              </Button>
            </CardContent>
        </Card>
      )}

      {/* My contributions list */}
      <Card>
        <CardHeader>
          <CardTitle>Đóng góp của tôi</CardTitle>
          <CardDescription>
            Các đóng góp bạn đã gửi. Đóng góp cần được admin duyệt trước khi được dùng cho hệ thống.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingList ? (
            <Skeleton className="h-24 w-full" />
          ) : contributions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Chưa có đóng góp nào.
            </p>
          ) : (
            <>
              <ul className="space-y-2">
                {contributions.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      className={cn(
                        'w-full rounded-lg border p-3 text-left text-sm transition-colors',
                        'hover:bg-muted/50 active:bg-muted/70',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset'
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">
                          {c.company_name ?? `Công ty #${c.company_id}`}
                        </span>
                        {c.job_position && (
                          <span className="text-muted-foreground">· {c.job_position}</span>
                        )}
                        <StatusBadge status={c.status} />
                        <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground" />
                      </div>
                      <div className="mt-1 text-muted-foreground line-clamp-2">
                        {c.jd_content.slice(0, 120)}…
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>
                          {new Date(c.created_at).toLocaleString('vi-VN')}
                        </span>
                        {c.preparation_id != null && (
                          <span>· Chuẩn bị #{c.preparation_id}</span>
                        )}
                        {c.question_info?.length > 0 && (
                          <span>· {c.question_info.length} câu hỏi</span>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
              <Sheet open={!!selected} onOpenChange={(open) => !open && setSelectedId(null)}>
                <SheetContent className="flex w-full flex-col p-0 sm:max-w-xl overflow-hidden">
                  {selected && (
                    <ContributionDetailSheet contribution={selected} onClose={() => setSelectedId(null)} />
                  )}
                </SheetContent>
              </Sheet>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
