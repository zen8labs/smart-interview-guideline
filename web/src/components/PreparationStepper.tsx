import { Link } from 'react-router-dom'
import { FileText, ListTodo, MessageCircleQuestion, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  { key: 'jd', label: 'Nhập JD', path: 'jd', icon: FileText },
  { key: 'memory-scan', label: 'Memory Scan', path: 'memory-scan', icon: ClipboardList },
  { key: 'roadmap', label: 'Roadmap', path: 'roadmap', icon: ListTodo },
  { key: 'self-check', label: 'Self-check', path: 'self-check', icon: MessageCircleQuestion },
] as const

export interface PreparationStepperProps {
  /** 0 = Nhập JD, 1 = Memory Scan, 2 = Roadmap, 3 = Self-check */
  currentStep: 0 | 1 | 2 | 3
  /** Khi null (đang tạo preparation), chỉ bước 1 active, các bước sau disabled */
  preparationId: number | null
}

export function PreparationStepper({ currentStep, preparationId }: PreparationStepperProps) {
  const activeIndex = currentStep

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <nav aria-label="Các bước chuẩn bị" className="flex flex-col">
        <div className="flex w-full items-center">
          {STEPS.map((step, index) => {
            const isCompleted = preparationId != null && index < activeIndex
            const isCurrent = index === activeIndex
            const base = preparationId != null ? `/preparations/${preparationId}` : null
            const href = base && step.path ? `${base}/${step.path}` : null
            const isDisabled = preparationId == null && index > 0
            const Icon = step.icon
            const leftActive = index > 0 && index <= activeIndex
            const rightActive = index < activeIndex

            return (
              <div key={step.key} className="flex min-w-0 flex-1 items-center">
                {/* Connector trái: luôn có flex-1 (step đầu dùng để căn giữa pill) */}
                <div
                  className={cn(
                    'h-0.5 min-w-[8px] flex-1 transition-colors self-center',
                    index > 0 ? (leftActive ? 'bg-primary' : 'bg-muted') : 'bg-transparent'
                  )}
                  aria-hidden
                />
                {/* Step pill */}
                <div className="flex shrink-0 flex-col items-center">
                  {href && !isDisabled ? (
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
                {/* Connector phải: luôn có flex-1 (step cuối dùng để căn giữa pill) */}
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
      </nav>
    </div>
  )
}
