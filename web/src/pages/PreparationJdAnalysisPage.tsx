import { useParams, Link } from 'react-router-dom'
import { useGetPreparationJdAnalysisQuery } from '@/store/api/endpoints/preparationApi'
import { JdAnalysisResultCard } from '@/components/JdAnalysisResultCard'
import { Skeleton } from '@/components/ui/skeleton'

export function PreparationJdAnalysisPage() {
  const { preparationId } = useParams<{ preparationId: string }>()
  const id = Number(preparationId)

  const { data, isLoading, isError } = useGetPreparationJdAnalysisQuery(id, {
    skip: !preparationId || Number.isNaN(id),
  })

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Không tải được kết quả phân tích JD. <Link to={`/preparations/${id}/memory-scan`} className="underline">Quay lại Memory Scan</Link>
      </div>
    )
  }

  return (
    <JdAnalysisResultCard
      preparationId={data.preparation_id}
      extracted_keywords={data.extracted_keywords}
      primaryAction={{ label: 'Tiếp tục → Memory Scan', to: 'memory-scan' }}
      secondaryAction={{ label: 'Danh sách chuẩn bị', to: '/preparations' }}
    />
  )
}
