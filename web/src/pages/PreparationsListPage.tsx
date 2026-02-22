import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSetPageTitle } from '@/contexts/PageTitleContext'
import { useListPreparationsQuery, useCreatePreparationMutation } from '@/store/api/endpoints/preparationApi'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus } from 'lucide-react'

export function PreparationsListPage() {
  const navigate = useNavigate()
  const setPageTitle = useSetPageTitle()
  const { data: preparations = [], isLoading } = useListPreparationsQuery()
  const [createPreparation, { isLoading: isCreating }] = useCreatePreparationMutation()

  useEffect(() => {
    setPageTitle(
      'Các lần chuẩn bị',
      'Xem lại JD, Memory Scan, Roadmap và Self-check của từng lần chuẩn bị',
    )
  }, [setPageTitle])

  const handleNewPreparation = async () => {
    try {
      const prep = await createPreparation().unwrap()
      navigate(`/preparations/${prep.id}/jd`)
    } catch {
      // Error handled by mutation
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full space-y-3">
      {preparations.length === 0 ? (
        <Card className="py-8">
          <CardContent className="py-0 text-center text-muted-foreground">
            <p className="mb-3 text-sm">Bạn chưa có lần chuẩn bị nào.</p>
            <Button
              onClick={handleNewPreparation}
              disabled={isCreating}
              size="sm"
            >
              {isCreating ? 'Đang tạo...' : 'Bắt đầu chuẩn bị (nhập JD)'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          <li>
            <button
              type="button"
              onClick={handleNewPreparation}
              disabled={isCreating}
              className="w-full rounded-lg border border-dashed border-muted-foreground/30 p-3 text-left transition-colors hover:border-primary/50 hover:bg-muted/30 disabled:opacity-50"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Plus className="size-4 shrink-0" />
                {isCreating ? 'Đang tạo...' : 'Chuẩn bị mới'}
              </span>
            </button>
          </li>
          {preparations.map((prep) => (
            <li key={prep.id}>
              <Link to={`/preparations/${prep.id}/jd`} className="block">
                <Card className="rounded-lg border p-3 shadow-none transition-colors hover:bg-muted/40">
                  <CardHeader className="flex-row items-center justify-between gap-3 border-0 p-0">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-baseline gap-2">
                        <CardTitle className="truncate text-sm font-medium leading-tight">
                          {prep.company_name?.trim() || `Chuẩn bị #${prep.id}`}
                        </CardTitle>
                        {prep.status === 'roadmap_ready' && (
                          <span className="shrink-0 text-[10px] font-normal text-muted-foreground">
                            Đã có roadmap
                          </span>
                        )}
                      </div>
                      <CardDescription className="truncate text-xs leading-snug text-muted-foreground">
                        {[prep.job_title?.trim(), `Tạo ${new Date(prep.created_at).toLocaleDateString('vi-VN')}`]
                          .filter(Boolean)
                          .join(' · ')}
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}

    </div>
  )
}
