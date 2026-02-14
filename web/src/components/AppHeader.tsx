import { useSidebar } from '@/hooks/useSidebar'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/components/UserMenu'
import { Menu, BrainCircuit } from 'lucide-react'

export function AppHeader() {
  const { toggleMobile } = useSidebar()

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

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        <UserMenu />
      </div>
    </header>
  )
}
