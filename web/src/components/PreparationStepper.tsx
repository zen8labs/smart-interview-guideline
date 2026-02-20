import { Link } from 'react-router-dom'
import { FileText, ListTodo, MessageCircleQuestion, ClipboardList, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  { key: 'jd', label: 'Nhập JD', path: 'jd', icon: FileText },
  { key: 'memory-scan', label: 'Memory Scan', path: 'memory-scan', icon: ClipboardList },
  { key: 'roadmap', label: 'Roadmap', path: 'roadmap', icon: ListTodo },
  { key: 'self-check', label: 'Self-check', path: 'self-check', icon: MessageCircleQuestion },
] as const

export type PreparationStepIndex = 0 | 1 | 2 | 3

export interface PreparationStepperProps {
  /** 0 = Nhập JD, 1 = Memory Scan, 2 = Roadmap, 3 = Self-check */
  currentStep: PreparationStepIndex
  /** Khi null (đang tạo preparation), chỉ bước 1 active, các bước sau disabled */
  preparationId: number | null
  /** Step đang được xử lý (loading / creating) — hiển thị trạng thái "đang làm" trên stepper */
  stepInProgress?: PreparationStepIndex | null
  /** Câu mô tả ngắn hiển thị dưới stepper khi stepInProgress được set */
  stepProgressMessage?: string
  /** Các step đã có dữ liệu (từ API) — connector tới các step này không bị mute dù đang ở step trước */
  stepsWithData?: PreparationStepIndex[]
}

export function PreparationStepper({
  currentStep,
  preparationId,
  stepInProgress = null,
  stepProgressMessage = '',
  stepsWithData,
}: PreparationStepperProps) {
  const activeIndex = currentStep
  const inProgressIndex = stepInProgress ?? null
  const hasData = (i: number) => stepsWithData?.includes(i as PreparationStepIndex) ?? false

  /** Step i is "reached" when it's completed, current, in progress, or already has data — connector stays solid (not dimmed) */
  const stepReached = (i: number) =>
    i <= activeIndex ||
    (inProgressIndex !== null && i === inProgressIndex) ||
    hasData(i)

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <nav aria-label="Các bước chuẩn bị" className="flex flex-col gap-3">
        <div className="flex w-full items-center">
          {STEPS.map((step, index) => {
            const isCompleted =
              preparationId != null && (index < activeIndex || hasData(index))
            const isCurrent = index === activeIndex
            const isInProgress = inProgressIndex !== null && index === inProgressIndex
            const base = preparationId != null ? `/preparations/${preparationId}` : null
            const href = base && step.path ? `${base}/${step.path}` : null
            const isDisabled = preparationId == null && index > 0
            const Icon = step.icon
            const leftActive = index > 0 && stepReached(index)
            const rightActive = index < STEPS.length - 1 && stepReached(index + 1)
            const isConnectorLeadingToInProgress =
              inProgressIndex !== null && index === inProgressIndex - 1

            return (
              <div key={step.key} className="flex min-w-0 flex-1 items-center">
                {/* Connector trái */}
                <div
                  className={cn(
                    'relative h-0.5 min-w-[8px] flex-1 self-center overflow-hidden transition-colors',
                    index > 0 ? (leftActive ? 'bg-primary' : 'bg-muted') : 'bg-transparent'
                  )}
                  aria-hidden
                >
                  {isConnectorLeadingToInProgress && (
                    <span
                      className="stepper-flow-shimmer absolute inset-0 block rounded-full"
                      style={{
                        background:
                          'linear-gradient(90deg, transparent 0%, hsl(var(--primary)) 35%, transparent 70%)',
                        backgroundSize: '60% 100%',
                      }}
                    />
                  )}
                </div>
                {/* Step pill */}
                <div className="flex shrink-0 flex-col items-center">
                  {isInProgress ? (
                    <span
                      className={cn(
                        'relative flex shrink-0 items-center justify-center gap-1.5 rounded-full border-2 border-primary bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary',
                        'ring-2 ring-primary/30 ring-offset-2 ring-offset-card animate-pulse'
                      )}
                      aria-busy="true"
                      aria-live="polite"
                    >
                      <Loader2 className="size-3.5 shrink-0 animate-spin" />
                      <span className="hidden sm:inline">{step.label}</span>
                    </span>
                  ) : href && !isDisabled ? (
                    <Link
                      to={href}
                      className={cn(
                        'flex shrink-0 items-center justify-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-medium transition-colors',
                        isCurrent &&
                          'border-primary bg-primary text-primary-foreground',
                        isCompleted &&
                          'border-primary bg-primary/10 text-primary hover:bg-primary/20',
                        !isCurrent &&
                          !isCompleted &&
                          'border-muted-foreground/30 bg-muted/30 text-muted-foreground hover:border-muted-foreground/50'
                      )}
                    >
                      <Icon className="size-3.5" />
                      <span className="hidden sm:inline">{step.label}</span>
                    </Link>
                  ) : (
                    <span
                      className={cn(
                        'flex shrink-0 items-center justify-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-medium',
                        isCurrent &&
                          'border-primary bg-primary text-primary-foreground',
                        isCompleted && 'border-primary bg-primary/10 text-primary',
                        !isCurrent &&
                          !isCompleted &&
                          'border-muted-foreground/30 bg-muted/30 text-muted-foreground',
                        isDisabled && 'opacity-60'
                      )}
                    >
                      <Icon className="size-3.5" />
                      <span className="hidden sm:inline">{step.label}</span>
                    </span>
                  )}
                </div>
                {/* Connector phải */}
                <div
                  className={cn(
                    'h-0.5 min-w-[8px] flex-1 transition-colors self-center',
                    index < STEPS.length - 1
                      ? (rightActive ? 'bg-primary' : 'bg-muted')
                      : 'bg-transparent'
                  )}
                  aria-hidden
                />
              </div>
            )
          })}
        </div>

        {stepProgressMessage && inProgressIndex !== null && (
          <div
            className="flex items-center justify-center gap-2 rounded-md bg-muted/50 py-2 px-3 text-center text-sm text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            <span>{stepProgressMessage}</span>
          </div>
        )}
      </nav>

      <style>{`
        @keyframes stepper-flow {
          0% { background-position: 0% 0; }
          100% { background-position: 200% 0; }
        }
        .stepper-flow-shimmer {
          animation: stepper-flow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
