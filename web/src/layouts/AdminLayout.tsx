import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Shield, LogOut, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const navItems = [
  { path: '/admin', label: 'Dashboard', match: (p: string) => p === '/admin' || p === '/admin/' || p.startsWith('/admin/users') },
  { path: '/admin/questions', label: 'Questions', match: (p: string) => p.startsWith('/admin/questions') },
  { path: '/admin/candidates', label: 'Candidates', match: (p: string) => p.startsWith('/admin/candidates') },
  { path: '/admin/settings', label: 'Settings', match: (p: string) => p.startsWith('/admin/settings') },
]

export function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('isAdmin')
    localStorage.removeItem('adminUser')
    navigate('/admin/login')
  }

  const adminUser = (() => {
    try {
      const raw = localStorage.getItem('adminUser')
      if (!raw) return null
      const parsed = JSON.parse(raw) as { email?: string }
      return parsed?.email ? parsed : null
    } catch {
      return null
    }
  })()

  const displayName = adminUser ?? 'Admin'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <header className="border-b bg-white dark:bg-gray-950 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <span className="text-lg font-semibold dark:text-white">S.I.G Admin</span>
            </div>
            <nav className="flex items-center gap-1">
              {navItems.map(({ path, label, match }) => {
                const isActive = match(location.pathname)
                return (
                  <button
                    key={path}
                    onClick={() => navigate(path)}
                    className={`
                      px-4 py-2 text-sm font-medium rounded-md transition-colors
                      ${isActive
                        ? 'text-primary dark:text-primary border-b-2 border-primary bg-transparent'
                        : 'text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white'}
                    `}
                  >
                    {label}
                  </button>
                )
              })}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </Button>
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/20 text-primary text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium dark:text-white hidden sm:inline truncate max-w-[140px]" title={displayName}>
                {displayName}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
