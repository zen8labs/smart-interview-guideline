import { useGetUserInfoQuery } from '../store/api/endpoints/authApi'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, User, Mail, Calendar, CheckCircle } from 'lucide-react'

export function HomePage() {
  const { data: user, isLoading, error } = useGetUserInfoQuery()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading user information. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-8 p-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome to Smart Interview Guideline
        </h1>
        <p className="text-lg text-muted-foreground">
          Your personalized interview preparation companion
        </p>
      </div>

      {user && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Your Profile
            </CardTitle>
            <CardDescription>
              Account information and status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Account Status</p>
                <p className="text-sm text-muted-foreground">
                  {user.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Member Since</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Get Started</CardTitle>
          <CardDescription>
            Begin your interview preparation journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Start preparing for your next interview with personalized guidance
            and practice questions tailored to your target role.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
