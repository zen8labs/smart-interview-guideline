import { useState } from 'react'
import {
  useListAdminContributionsQuery,
  useGetAdminContributionsCountQuery,
  useApproveContributionMutation,
  useRejectContributionMutation,
  type AdminContributionStatus,
} from '@/store/api/endpoints/adminApi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
import { Skeleton } from '@/components/ui/skeleton'
import {
  CheckCircle2,
  XCircle,
  Gift,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ChevronRightIcon,
  Building2,
  Briefcase,
  Calendar,
  User,
  FileText,
  MessageCircleQuestion,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_LABEL: Record<AdminContributionStatus, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
}

function StatusBadge({ status }: { status: AdminContributionStatus }) {
  return (
    <Badge
      variant={status === 'rejected' ? 'destructive' : status === 'approved' ? 'default' : 'secondary'}
      className={cn(
        'shrink-0 font-medium',
        status === 'approved' && 'border-green-500/40 bg-green-500/15 text-green-700 dark:text-green-400'
      )}
    >
      {STATUS_LABEL[status]}
    </Badge>
  )
}

export function AdminContributionsPage() {
  const [statusFilter, setStatusFilter] = useState<AdminContributionStatus | 'all'>('pending')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const pageSize = 15

  const { data: contributions = [], isLoading } = useListAdminContributionsQuery({
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    page_size: pageSize,
  })
  const { data: countData } = useGetAdminContributionsCountQuery({
    status: statusFilter === 'all' ? undefined : statusFilter,
  })
  const [approve, { isLoading: approving }] = useApproveContributionMutation()
  const [reject, { isLoading: rejecting }] = useRejectContributionMutation()

  const total = countData?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const selected = contributions.find((c) => c.id === selectedId) ?? null

  const handleApprove = async (id: number) => {
    try {
      await approve(id).unwrap()
      if (selectedId === id) setSelectedId(null)
    } catch (e) {
      console.error(e)
    }
  }

  const handleReject = async (id: number) => {
    if (!confirm('Từ chối đóng góp này?')) return
    try {
      await reject(id).unwrap()
      if (selectedId === id) setSelectedId(null)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-foreground">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Gift className="size-5" />
            </span>
            Đóng góp (kiểm duyệt)
          </h1>
          <CardDescription className="mt-1.5">
            Duyệt hoặc từ chối đóng góp thông tin phỏng vấn từ người dùng
          </CardDescription>
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as AdminContributionStatus | 'all')
            setPage(1)
            setSelectedId(null)
          }}
        >
          <SelectTrigger className="w-[180px] bg-background">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="pending">Chờ duyệt</SelectItem>
            <SelectItem value="approved">Đã duyệt</SelectItem>
            <SelectItem value="rejected">Từ chối</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : contributions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Gift className="size-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">
              Không có đóng góp nào
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {statusFilter !== 'all'
                ? `Thử đổi bộ lọc trạng thái hoặc quay lại sau.`
                : 'Chưa có đóng góp từ người dùng.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* List: card-style rows */}
          <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <div className="grid grid-cols-[1fr_1fr_140px_120px] gap-4 px-5 py-3.5 bg-muted/40 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Công ty</span>
              <span>Vị trí tuyển dụng</span>
              <span>Ngày tạo</span>
              <span className="text-right">Trạng thái</span>
            </div>
            <ul className="divide-y divide-border/80">
              {contributions.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={cn(
                      'w-full grid grid-cols-[1fr_1fr_140px_120px] gap-4 px-5 py-4 text-left transition-colors relative',
                      'hover:bg-muted/50 active:bg-muted/70',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset'
                    )}
                  >
                    <span className="font-medium text-foreground truncate flex items-center gap-2">
                      <Building2 className="size-4 shrink-0 text-muted-foreground" />
                      {c.company_name ?? `#${c.company_id}`}
                    </span>
                    <span className="text-muted-foreground truncate flex items-center gap-2">
                      <Briefcase className="size-4 shrink-0 text-muted-foreground/70" />
                      {c.job_position || '—'}
                    </span>
                    <span className="text-muted-foreground text-sm flex items-center gap-1.5">
                      <Calendar className="size-3.5 shrink-0" />
                      {new Date(c.created_at).toLocaleDateString('vi-VN')}
                    </span>
                    <span className="flex justify-end items-center gap-1">
                      <StatusBadge status={c.status} />
                      <ChevronRightIcon className="size-4 text-muted-foreground/50 shrink-0" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Trang <span className="font-medium text-foreground">{page}</span> / {totalPages}
                <span className="mx-2">·</span>
                Tổng <span className="font-medium text-foreground">{total}</span> đóng góp
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Detail Sheet */}
          <Sheet open={!!selected} onOpenChange={(open) => !open && setSelectedId(null)}>
            <SheetContent
              side="right"
              className="flex w-full flex-col p-0 sm:max-w-xl overflow-hidden"
            >
              {selected && (
                <div className="flex flex-col h-full overflow-hidden">
                  {/* Header block - pt-12 for sheet close button */}
                  <div className="shrink-0 border-b bg-muted/30 px-6 pt-12 pb-5">
                    <SheetHeader className="text-left space-y-0">
                      <SheetTitle className="text-xl font-semibold text-foreground flex flex-wrap items-baseline gap-2">
                        <span>{selected.company_name ?? `Công ty #${selected.company_id}`}</span>
                        {selected.job_position && (
                          <span className="text-base font-normal text-muted-foreground">
                            · {selected.job_position}
                          </span>
                        )}
                      </SheetTitle>
                      <CardDescription className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                        <span className="flex items-center gap-1.5">
                          <User className="size-3.5" />
                          {selected.user_email ?? `User #${selected.user_id}`}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="size-3.5" />
                          {new Date(selected.created_at).toLocaleString('vi-VN')}
                        </span>
                        <span>#{selected.id}</span>
                      </CardDescription>
                    </SheetHeader>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <StatusBadge status={selected.status} />
                      {selected.status === 'pending' && (
                        <>
                          <Separator orientation="vertical" className="h-6" />
                          <Button
                            size="sm"
                            onClick={() => handleApprove(selected.id)}
                            disabled={approving || rejecting}
                            className="gap-1.5"
                          >
                            <CheckCircle2 className="size-4" />
                            Duyệt
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(selected.id)}
                            disabled={approving || rejecting}
                            className="gap-1.5"
                          >
                            <XCircle className="size-4" />
                            Từ chối
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Scrollable content */}
                  <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                    {/* JD */}
                    <section>
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                        <FileText className="size-4 text-muted-foreground" />
                        Job description
                      </h3>
                      <div className="rounded-lg border bg-muted/20 p-4 text-sm leading-relaxed whitespace-pre-wrap max-h-52 overflow-y-auto">
                        {selected.jd_content}
                      </div>
                    </section>

                    {/* Questions */}
                    {selected.question_info?.length > 0 && (
                      <section>
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                          <MessageCircleQuestion className="size-4 text-muted-foreground" />
                          Câu hỏi phỏng vấn ({selected.question_info.length})
                        </h3>
                        <ol className="rounded-lg border bg-muted/20 p-4 space-y-2.5 max-h-44 overflow-y-auto list-decimal list-inside text-sm leading-relaxed text-foreground/90 [&>li]:pl-1">
                          {selected.question_info.map((q, i) => (
                            <li key={i}>
                              {typeof q.question_text === 'string'
                                ? q.question_text
                                : JSON.stringify(q)}
                            </li>
                          ))}
                        </ol>
                      </section>
                    )}

                    {/* Candidate responses */}
                    {selected.candidate_responses && (
                      <section>
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                          <MessageSquare className="size-4 text-muted-foreground" />
                          Câu trả lời / phản hồi
                        </h3>
                        <div className="rounded-lg border bg-muted/20 p-4 text-sm leading-relaxed whitespace-pre-wrap max-h-44 overflow-y-auto">
                          {selected.candidate_responses}
                        </div>
                      </section>
                    )}
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  )
}
