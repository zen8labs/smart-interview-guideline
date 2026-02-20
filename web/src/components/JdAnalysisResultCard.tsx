import { Link } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Building2, MapPin, Briefcase, Calendar } from 'lucide-react'
import type {
  SkillItem,
  DomainItem,
  KeywordItem,
  ExtractedKeywords,
  JdMeta,
  ProfileFit,
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

const PROFILE_FIT_LABELS: Record<number, string> = {
  1: 'Rất thấp',
  2: 'Thấp',
  3: 'Trung bình',
  4: 'Cao',
  5: 'Rất cao',
}

function ProfileFitBadge({ fit }: { fit: ProfileFit }) {
  const level = Math.max(1, Math.min(5, fit.level))
  const label = fit.label || PROFILE_FIT_LABELS[level] || `Mức ${level}`
  const variant = level >= 4 ? 'default' : level >= 3 ? 'secondary' : 'outline'
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Độ phù hợp với hồ sơ:</span>
        <Badge variant={variant}>Mức {level}/5 — {label}</Badge>
      </div>
      {fit.summary ? (
        <p className="text-sm text-muted-foreground">{fit.summary}</p>
      ) : null}
    </div>
  )
}

function JdMetaBlock({ meta }: { meta: JdMeta }) {
  const entries: { icon: React.ReactNode; value: string }[] = []
  if (meta.company_name) entries.push({ icon: <Building2 className="size-4" />, value: meta.company_name })
  if (meta.job_title) entries.push({ icon: <Briefcase className="size-4" />, value: meta.job_title })
  if (meta.location) entries.push({ icon: <MapPin className="size-4" />, value: meta.location })
  if (meta.posted_date) entries.push({ icon: <Calendar className="size-4" />, value: `Đăng: ${meta.posted_date}` })
  if (meta.application_deadline) entries.push({ icon: <Calendar className="size-4" />, value: `Hạn: ${meta.application_deadline}` })
  if (meta.employment_type) entries.push({ icon: null, value: meta.employment_type })
  if (entries.length === 0) return null
  return (
    <div className="rounded-md border bg-muted/30 p-3 space-y-1.5">
      <p className="mb-1.5 text-sm font-medium text-muted-foreground">Thông tin JD</p>
      <ul className="text-sm space-y-1">
        {entries.map((e, i) => (
          <li key={i} className="flex items-center gap-2">
            {e.icon ? <span className="shrink-0">{e.icon}</span> : null}
            <span>{e.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
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
        {extracted_keywords.meta && Object.keys(extracted_keywords.meta).length > 0 ? (
          <JdMetaBlock meta={extracted_keywords.meta} />
        ) : null}
        {extracted_keywords.profile_fit ? (
          <ProfileFitBadge fit={extracted_keywords.profile_fit} />
        ) : null}
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
