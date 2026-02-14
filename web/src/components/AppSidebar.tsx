import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/hooks/useSidebar'
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Users,
  Settings,
  User,
  ChevronLeft,
  BrainCircuit,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface NavItem {
  label: string
  icon: LucideIcon
  href: string
}

const mainNavItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { label: 'Interview Prep', icon: FileText, href: '/interviews' },
  { label: 'Knowledge Base', icon: BookOpen, href: '/knowledge' },
  { label: 'Community', icon: Users, href: '/community' },
]

const bottomNavItems: NavItem[] = [
  { label: 'Profile', icon: User, href: '/profile' },
  { label: 'Settings', icon: Settings, href: '/settings' },
]

function NavLink({
  item,
  isCollapsed,
}: {
  item: NavItem
  isCollapsed: boolean
}) {
  const location = useLocation()
  const isActive = location.pathname === item.href

  const linkContent = (
    <Link
      to={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        isActive
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-sidebar-foreground/70',
        isCollapsed && 'justify-center px-2'
      )}
    >
      <item.icon className="size-5 shrink-0" />
      {!isCollapsed && <span className="truncate">{item.label}</span>}
    </Link>
  )

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    )
  }

  return linkContent
}

export function AppSidebar() {
  const { isCollapsed, toggleCollapsed } = useSidebar()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo / Brand */}
      <div className="flex h-16 items-center gap-3 px-4">
        <BrainCircuit className="size-7 shrink-0 text-sidebar-primary" />
        {!isCollapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-base font-bold tracking-tight">
              S.I.G
            </span>
            <span className="truncate text-[10px] text-sidebar-foreground/50">
              Smart Interview Guideline
            </span>
          </div>
        )}
      </div>

      <Separator />

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        <div className={cn('mb-2', !isCollapsed && 'px-2')}>
          {!isCollapsed && (
            <span className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
              Main
            </span>
          )}
        </div>
        {mainNavItems.map((item) => (
          <NavLink key={item.href} item={item} isCollapsed={isCollapsed} />
        ))}
      </nav>

      <Separator />

      {/* Bottom Navigation */}
      <nav className="space-y-1 p-2">
        {bottomNavItems.map((item) => (
          <NavLink key={item.href} item={item} isCollapsed={isCollapsed} />
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t p-2">
        <Button
          variant="ghost"
          size={isCollapsed ? 'icon' : 'sm'}
          onClick={toggleCollapsed}
          className={cn('w-full', !isCollapsed && 'justify-start gap-2')}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft
            className={cn(
              'size-4 transition-transform duration-300',
              isCollapsed && 'rotate-180'
            )}
          />
          {!isCollapsed && (
            <span className="text-xs text-sidebar-foreground/60">
              Collapse
            </span>
          )}
        </Button>
      </div>
    </aside>
  )
}
