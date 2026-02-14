import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Users,
  Settings,
  User,
  BrainCircuit,
  type LucideIcon,
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'

interface NavItem {
  label: string
  icon: LucideIcon
  href: string
  description?: string
}

const mainNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/',
    description: 'Overview and quick actions',
  },
  {
    label: 'Interview Prep',
    icon: FileText,
    href: '/interviews',
    description: 'JD analysis and roadmaps',
  },
  {
    label: 'Knowledge Base',
    icon: BookOpen,
    href: '/knowledge',
    description: 'Visual learning cards',
  },
  {
    label: 'Community',
    icon: Users,
    href: '/community',
    description: 'Crowdsourced questions',
  },
]

const bottomNavItems: NavItem[] = [
  { label: 'Profile', icon: User, href: '/profile' },
  { label: 'Settings', icon: Settings, href: '/settings' },
]

interface NavLinkProps {
  item: NavItem
  onClick?: () => void
}

function NavLink({ item, onClick }: NavLinkProps) {
  const location = useLocation()
  const isActive = location.pathname === item.href

  return (
    <Link
      to={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        isActive
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-sidebar-foreground/70'
      )}
    >
      <item.icon className="size-5 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  )
}

interface AppSidebarContentProps {
  onNavigate?: () => void
}

export function AppSidebarContent({ onNavigate }: AppSidebarContentProps) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo / Brand */}
      <div className="flex h-16 items-center gap-3 px-4">
        <BrainCircuit className="size-7 shrink-0 text-sidebar-primary" />
        <div className="flex flex-col overflow-hidden">
          <span className="truncate text-base font-bold tracking-tight">
            S.I.G
          </span>
          <span className="truncate text-[10px] text-sidebar-foreground/50">
            Smart Interview Guideline
          </span>
        </div>
      </div>

      <Separator />

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        <div className="mb-2 px-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
            Main
          </span>
        </div>
        {mainNavItems.map((item) => (
          <NavLink key={item.href} item={item} onClick={onNavigate} />
        ))}
      </nav>

      <Separator />

      {/* Bottom Navigation */}
      <nav className="space-y-1 p-2">
        {bottomNavItems.map((item) => (
          <NavLink key={item.href} item={item} onClick={onNavigate} />
        ))}
      </nav>
    </div>
  )
}
