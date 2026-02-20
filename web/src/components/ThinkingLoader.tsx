import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

interface ThinkingLoaderProps {
  /** Các câu hiển thị luân phiên để tạo cảm giác hệ thống đang "suy nghĩ" */
  messages: string[]
  /** Khoảng thời gian (ms) đổi câu. Mặc định 2200 */
  intervalMs?: number
  /** default = khung lớn giữa trang, inline = một dòng (spinner + text) */
  variant?: 'default' | 'inline'
  className?: string
}

export function ThinkingLoader({
  messages,
  intervalMs = 2200,
  variant = 'default',
  className = '',
}: ThinkingLoaderProps) {
  const [index, setIndex] = useState(0)
  const displayMessage = messages[index % messages.length]

  useEffect(() => {
    if (messages.length <= 1) return
    const t = setInterval(() => {
      setIndex((i) => i + 1)
    }, intervalMs)
    return () => clearInterval(t)
  }, [messages.length, intervalMs])

  if (variant === 'inline') {
    return (
      <div
        className={
          'flex items-center justify-center gap-2 text-sm text-muted-foreground ' + className
        }
      >
        <Loader2 className="size-4 animate-spin shrink-0" />
        <span>{displayMessage}</span>
      </div>
    )
  }

  return (
    <div
      className={
        'flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-lg border bg-muted/20 p-8 ' +
        className
      }
    >
      <Loader2 className="size-10 animate-spin text-primary" />
      <p className="max-w-sm text-center text-sm font-medium text-foreground">
        {displayMessage}
      </p>
      <span className="inline-flex gap-1">
        {messages.map((_, i) => (
          <span
            key={i}
            className={
              'size-1.5 rounded-full bg-primary/40 transition-opacity ' +
              (i === index % messages.length ? 'opacity-100' : 'opacity-40')
            }
          />
        ))}
      </span>
    </div>
  )
}
