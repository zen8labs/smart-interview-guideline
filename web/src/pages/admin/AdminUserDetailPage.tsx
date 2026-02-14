import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield, Mail, Calendar, Briefcase, Award, FileText, Ban, CheckCircle, AlertCircle } from 'lucide-react'
import { useGetUserDetailQuery, useBanUserMutation, useUnbanUserMutation } from '@/store/api/endpoints/adminApi'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'

export function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  
  const { data: user, isLoading, error } = useGetUserDetailQuery(Number(userId))
  const [banUser, { isLoading: isBanning }] = useBanUserMutation()
  const [unbanUser, { isLoading: isUnbanning }] = useUnbanUserMutation()

  const handleBanUser = async () => {
    if (!user) return
    
    if (user.is_active) {
      if (!confirm('Are you sure you want to ban this user?')) return
      try {
        await banUser({ userId: user.id }).unwrap()
      } catch (err) {
        alert('Failed to ban user')
      }
    } else {
      try {
        await unbanUser(user.id).unwrap()
      } catch (err) {
        alert('Failed to unban user')
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load user details. The user may not exist.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/admin/users')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/admin/users')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">User Details</h1>
          <p className="text-muted-foreground mt-1">
            View and manage user information
          </p>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-[300px]" />
            <Skeleton className="h-4 w-[200px] mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-6 w-[250px]" />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : user ? (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-2xl">{user.email}</CardTitle>
                    {user.is_admin && (
                      <Badge variant="secondary">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                    {!user.is_active && (
                      <Badge variant="destructive">Banned</Badge>
                    )}
                  </div>
                  <CardDescription>User ID: {user.id}</CardDescription>
                </div>
                {!user.is_admin && (
                  <Button
                    variant={user.is_active ? 'destructive' : 'default'}
                    onClick={handleBanUser}
                    disabled={isBanning || isUnbanning}
                  >
                    {user.is_active ? (
                      <>
                        <Ban className="h-4 w-4 mr-2" />
                        Ban User
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Unban User
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </div>
                  <div className="font-medium">{user.email}</div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    Status
                  </div>
                  <div className="font-medium">
                    {user.is_active ? (
                      <span className="text-green-600 dark:text-green-400">Active</span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">Banned</span>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Briefcase className="h-4 w-4 mr-2" />
                      Role
                    </div>
                    <div className="font-medium">
                      {user.role ? (
                        <Badge variant="outline" className="capitalize">
                          {user.role}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Award className="h-4 w-4 mr-2" />
                      Experience
                    </div>
                    <div className="font-medium">
                      {user.experience_years !== null ? (
                        `${user.experience_years} years`
                      ) : (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <FileText className="h-4 w-4 mr-2" />
                      CV
                    </div>
                    <div className="font-medium">
                      {user.cv_filename ? (
                        <div className="flex items-center gap-2">
                          <span className="truncate">{user.cv_filename}</span>
                          <Badge variant="secondary">Uploaded</Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not uploaded</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Account Metadata</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      Created At
                    </div>
                    <div className="font-medium text-sm">
                      {formatDate(user.created_at)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      Last Updated
                    </div>
                    <div className="font-medium text-sm">
                      {formatDate(user.updated_at)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
