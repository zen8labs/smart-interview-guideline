import { Outlet, useNavigate } from 'react-router-dom'
import { Shield, Users, LogOut, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function AdminLayout() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('isAdmin')
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <header className="border-b bg-white dark:bg-gray-950 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin Portal</h1>
              <p className="text-xs text-muted-foreground">Smart Interview Guideline</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          <aside className="col-span-12 md:col-span-3 lg:col-span-2">
            <Card className="p-4">
              <nav className="space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate('/admin/users')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Users
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  disabled
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                  <span className="ml-auto text-xs text-muted-foreground">Soon</span>
                </Button>
              </nav>
            </Card>
          </aside>

          <main className="col-span-12 md:col-span-9 lg:col-span-10">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
