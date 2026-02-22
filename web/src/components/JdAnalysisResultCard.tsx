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
import { CheckCircle2, Building2, MapPin, Briefcase, Calendar, Target, Layers, Hash } from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  SkillItem,
  ExtractedKeywords,
  JdMeta,
  ProfileFit,
} from '@/store/api/endpoints/analysisApi'

/** Mức ưu tiên để sắp xếp; tag đơn giản với màu nhẹ */
const SKILL_LEVEL_CONFIG: Record<
  string,
  { label: string; priority: 1 | 2 | 3; tagClass: string }
> = {
  required: { label: 'Bắt buộc', priority: 1, tagClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' },
  expert: { label: 'Chuyên sâu', priority: 1, tagClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' },
  preferred: { label: 'Ưu tiên', priority: 2, tagClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' },
  proficient: { label: 'Thành thạo', priority: 2, tagClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' },
  'nice-to-have': { label: 'Có thì tốt', priority: 3, tagClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-400' },
  basic: { label: 'Cơ bản', priority: 3, tagClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-400' },
}

function normalizeSkillLevel(level: string | null | undefined): string {
  if (!level) return ''
  const lower = level.toLowerCase().replace(/\s+/g, '-')
  if (SKILL_LEVEL_CONFIG[lower]) return lower
  if (lower.includes('required') || lower.includes('bắt buộc')) return 'required'
  if (lower.includes('prefer') || lower.includes('ưu tiên')) return 'preferred'
  if (lower.includes('nice') || lower.includes('tốt') || lower.includes('khá muốn') || lower.includes('muốn')) return 'nice-to-have'
  return lower
}

const DEFAULT_TAG_CLASS = 'bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-400'

function SkillRow({ skill }: { skill: string | SkillItem }) {
  const item: SkillItem = typeof skill === 'string' ? { name: skill } : skill
  const levelKey = normalizeSkillLevel(item.level)
  const levelConfig = levelKey ? SKILL_LEVEL_CONFIG[levelKey] : null
  const levelLabel = levelConfig?.label ?? (item.level ? String(item.level) : null)
  const tagClass = levelConfig?.tagClass ?? DEFAULT_TAG_CLASS
  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-background/80 px-3 py-2 text-sm hover:bg-muted/30 transition-colors">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-foreground">{item.name}</span>
        {levelLabel && (
          <span
            className={cn(
              'shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium',
              tagClass
            )}
          >
            {levelLabel}
          </span>
        )}
        {item.constraints && (
          <span className="text-muted-foreground text-xs font-medium">
            {item.constraints}
          </span>
        )}
      </div>
      {item.notes && (
        <p className="text-muted-foreground text-xs leading-snug">{item.notes}</p>
      )}
    </div>
  )
}

function skillSortOrder(s: string | SkillItem): number {
  if (typeof s === 'string') return 3
  const key = normalizeSkillLevel(s.level)
  const config = key ? SKILL_LEVEL_CONFIG[key] : null
  return config?.priority ?? 3
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
  secondaryAction = undefined,
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
      <CardContent className="space-y-5">
        {extracted_keywords.meta && Object.keys(extracted_keywords.meta).length > 0 ? (
          <JdMetaBlock meta={extracted_keywords.meta} />
        ) : null}
        {extracted_keywords.profile_fit ? (
          <ProfileFitBadge fit={extracted_keywords.profile_fit} />
        ) : null}
        {extracted_keywords.requirements_summary ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-800 dark:bg-amber-950/30">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Tóm tắt yêu cầu
            </p>
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
              {extracted_keywords.requirements_summary}
            </p>
          </div>
        ) : null}
        {extracted_keywords.skills?.length ? (
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Target className="size-4 text-green-600 dark:text-green-500" />
              Kỹ năng cốt lõi JD yêu cầu
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {[...extracted_keywords.skills]
                .sort((a, b) => skillSortOrder(a) - skillSortOrder(b))
                .map((s, i) => (
                  <SkillRow key={i} skill={s} />
                ))}
            </div>
          </div>
        ) : null}
        {extracted_keywords.domains?.length ? (
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Layers className="size-3.5" />
              Lĩnh vực
            </div>
            <div className="flex flex-wrap gap-1.5">
              {extracted_keywords.domains.map((d, i) => {
                const name = typeof d === 'string' ? d : d.name
                const desc = typeof d === 'string' ? null : d.description
                return (
                  <Badge key={i} variant="secondary" className="font-normal">
                    {name}
                    {desc ? ` — ${desc}` : ''}
                  </Badge>
                )
              })}
            </div>
          </div>
        ) : null}
        {extracted_keywords.keywords?.length ? (
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Hash className="size-3.5" />
              Từ khóa
            </div>
            <div className="flex flex-wrap gap-1.5">
              {extracted_keywords.keywords.map((k, i) => {
                const term = typeof k === 'string' ? k : k.term
                const ctx = typeof k === 'string' ? null : k.context
                return (
                  <span key={i} className="rounded-md bg-muted/70 px-2 py-0.5 text-xs text-muted-foreground">
                    {term}
                    {ctx ? ` (${ctx})` : ''}
                  </span>
                )
              })}
            </div>
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
