import { Outlet, Link, useNavigate } from 'react-router-dom'
import { getToken, removeToken } from './utils/authStorage'
import { Button } from '@/components/ui/button'
import { LogOut, Home, LogIn, UserPlus } from 'lucide-react'

export function App() {
  const navigate = useNavigate()
  const isAuthenticated = !!getToken()

  const handleLogout = () => {
    removeToken()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight">
              Smart Interview Guideline
            </h1>
          </Link>
          <nav className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/">
                    <Home className="mr-2 h-4 w-4" />
                    Home
                  </Link>
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </Link>
                </Button>
                <Button asChild variant="default" size="sm">
                  <Link to="/register">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Register
                  </Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
