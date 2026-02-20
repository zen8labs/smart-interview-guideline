import { Link } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'
import type {
  SkillItem,
  DomainItem,
  KeywordItem,
  ExtractedKeywords,
} from '@/store/api/endpoints/analysisApi'

function formatSkill(s: string | SkillItem): string {
  if (typeof s === 'string') return s
  const parts = [s.name]
  if (s.level) parts.push(s.level)
  if (s.constraints) parts.push(s.constraints)
  if (parts.length === 1) return s.name
  return `${s.name} (${parts.slice(1).join(', ')})`
}

function formatDomain(d: string | DomainItem): string {
  if (typeof d === 'string') return d
  if (d.description) return `${d.name} — ${d.description}`
  return d.name
}

function formatKeyword(k: string | KeywordItem): string {
  if (typeof k === 'string') return k
  if (k.context) return `${k.term} (${k.context})`
  return k.term
}

export interface JdAnalysisResultCardProps {
  preparationId: number
  extracted_keywords: ExtractedKeywords
  /** Nút chính: label và path. Mặc định "Tiếp tục → Memory Scan" -> memory-scan */
  primaryAction?: { label: string; to: string }
  /** Nút phụ (vd: Dashboard). Ẩn nếu không truyền */
  secondaryAction?: { label: string; to: string }
}

export function JdAnalysisResultCard({
  preparationId,
  extracted_keywords,
  primaryAction = { label: 'Tiếp tục → Memory Scan', to: 'memory-scan' },
  secondaryAction = { label: 'Dashboard', to: '/' },
}: JdAnalysisResultCardProps) {
  const base = `/preparations/${preparationId}`

  return (
    <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
      <CardHeader>
        <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
          <CheckCircle2 className="size-5" />
          <CardTitle>Kết quả phân tích JD</CardTitle>
        </div>
        <CardDescription>
          Đã trích xuất kỹ năng, domain và yêu cầu từ JD. Bạn có thể xem lại và tiếp tục các bước sau.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {extracted_keywords.requirements_summary ? (
          <div>
            <p className="mb-1 text-sm font-medium text-muted-foreground">Tóm tắt yêu cầu</p>
            <p className="text-sm whitespace-pre-wrap">{extracted_keywords.requirements_summary}</p>
          </div>
        ) : null}
        {extracted_keywords.skills?.length ? (
          <div>
            <p className="mb-1 text-sm font-medium text-muted-foreground">Skills (mức độ / ràng buộc)</p>
            <ul className="text-sm list-disc list-inside space-y-0.5">
              {extracted_keywords.skills.map((s, i) => (
                <li key={i}>{formatSkill(s)}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {extracted_keywords.domains?.length ? (
          <div>
            <p className="mb-1 text-sm font-medium text-muted-foreground">Domains</p>
            <ul className="text-sm list-disc list-inside space-y-0.5">
              {extracted_keywords.domains.map((d, i) => (
                <li key={i}>{formatDomain(d)}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {extracted_keywords.keywords?.length ? (
          <div>
            <p className="mb-1 text-sm font-medium text-muted-foreground">Keywords</p>
            <p className="text-sm">
              {extracted_keywords.keywords.map(formatKeyword).join(', ')}
            </p>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button asChild>
            <Link to={primaryAction.to.startsWith('/') ? primaryAction.to : `${base}/${primaryAction.to}`}>
              {primaryAction.label}
            </Link>
          </Button>
          {secondaryAction && (
            <Button variant="outline" asChild>
              <Link to={secondaryAction.to}>{secondaryAction.label}</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
