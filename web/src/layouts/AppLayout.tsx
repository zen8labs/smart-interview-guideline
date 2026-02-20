import { Outlet } from 'react-router-dom'
import { SidebarProvider, useSidebar } from '@/hooks/useSidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { AppHeader } from '@/components/AppHeader'
import { I18nSync } from '@/components/I18nSync'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'
import { AppSidebarContent } from '@/components/AppSidebarContent'
import { VisuallyHidden } from 'radix-ui'

function AppLayoutInner() {
  const { isCollapsed, isMobileOpen, closeMobile } = useSidebar()

  return (
    <div className="flex min-h-screen bg-background">
      <I18nSync />
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AppSidebar />
      </div>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={isMobileOpen} onOpenChange={closeMobile}>
        <SheetContent side="left" className="w-72 p-0">
          <VisuallyHidden.Root>
            <SheetTitle>Navigation</SheetTitle>
          </VisuallyHidden.Root>
          <AppSidebarContent onNavigate={closeMobile} />
        </SheetContent>
      </Sheet>

      {/* Main content area */}
      <div
        className={cn(
          'flex flex-1 flex-col transition-all duration-300 ease-in-out',
          isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        )}
      >
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function AppLayout() {
  return (
    <SidebarProvider>
      <AppLayoutInner />
    </SidebarProvider>
  )
}
