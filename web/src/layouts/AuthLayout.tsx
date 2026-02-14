import { Outlet, Link } from 'react-router-dom'
import { BrainCircuit } from 'lucide-react'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-linear-to-br from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <Link to="/" className="block text-center space-y-3">
          <BrainCircuit className="mx-auto size-10 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Smart Interview Guideline
          </h1>
          <p className="text-sm text-muted-foreground">
            Your AI-powered interview preparation companion
          </p>
        </Link>

        {/* Page content from child route */}
        <Outlet />
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-muted-foreground/60">
        &copy; {new Date().getFullYear()} S.I.G &mdash; Smart Interview Guideline
      </footer>
    </div>
  )
}
