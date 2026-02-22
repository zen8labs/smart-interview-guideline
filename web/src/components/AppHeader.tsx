import { useSidebar } from '@/hooks/useSidebar'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/components/UserMenu'
import { Menu, BrainCircuit } from 'lucide-react'

export function AppHeader() {
  const { toggleMobile } = useSidebar()
  const { title, subtitle } = usePageTitle()

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 px-4 md:px-6">
      {/* Mobile menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMobile}
        className="lg:hidden"
        aria-label="Toggle sidebar"
      >
        <Menu className="size-5" />
      </Button>

      {/* Mobile brand - only shown on small screens */}
      <div className="flex items-center gap-2 lg:hidden">
        <BrainCircuit className="size-5 text-primary" />
        <span className="text-sm font-bold tracking-tight">S.I.G</span>
      </div>

      {/* Page title - visible when set by current page */}
      {title ? (
        <div className="min-w-0 flex-1 truncate py-2">
          <h1 className="truncate text-lg font-semibold tracking-tight">
            {title}
          </h1>
          {subtitle ? (
            <p className="truncate text-xs text-muted-foreground mt-0.5">
              {subtitle}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="flex-1" />
      )}

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        <UserMenu />
      </div>
    </header>
  )
}
