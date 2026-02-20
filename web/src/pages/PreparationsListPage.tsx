import { Link } from 'react-router-dom'
import { useListPreparationsQuery } from '@/store/api/endpoints/preparationApi'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText, ListTodo, MessageCircleQuestion, Plus } from 'lucide-react'

export function PreparationsListPage() {
  const { data: preparations = [], isLoading } = useListPreparationsQuery()

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Các lần chuẩn bị</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Xem lại JD, Memory Scan, Roadmap và Self-check của từng lần chuẩn bị
          </p>
        </div>
        <Button asChild>
          <Link to="/interviews">
            <Plus className="mr-2 size-4" />
            Chuẩn bị mới
          </Link>
        </Button>
      </div>

      {preparations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="mb-4">Bạn chưa có lần chuẩn bị nào.</p>
            <Button asChild>
              <Link to="/interviews">Bắt đầu chuẩn bị (nhập JD)</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-4">
          {preparations.map((prep) => (
            <li key={prep.id}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Chuẩn bị #{prep.id}
                    {prep.status === 'roadmap_ready' && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        · Đã có roadmap
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Tạo lúc {new Date(prep.created_at).toLocaleString('vi-VN')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/preparations/${prep.id}/memory-scan`}>
                      <FileText className="mr-1 size-4" />
                      Memory Scan
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/preparations/${prep.id}/roadmap`}>
                      <ListTodo className="mr-1 size-4" />
                      Roadmap
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/preparations/${prep.id}/self-check`}>
                      <MessageCircleQuestion className="mr-1 size-4" />
                      Self-check
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Button asChild variant="ghost">
        <Link to="/">Về Dashboard</Link>
      </Button>
    </div>
  )
}
