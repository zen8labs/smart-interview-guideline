import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Users, Shield, AlertCircle, Ban, CheckCircle } from 'lucide-react'
import { useListUsersQuery, useBanUserMutation, useUnbanUserMutation } from '@/store/api/endpoints/adminApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'

export function AdminUsersPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [emailFilter, setEmailFilter] = useState('')
  const [searchEmail, setSearchEmail] = useState('')
  
  const { data, isLoading, error } = useListUsersQuery({
    page,
    page_size: 20,
    email: searchEmail,
  })

  const [banUser] = useBanUserMutation()
  const [unbanUser] = useUnbanUserMutation()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchEmail(emailFilter)
    setPage(1)
  }

  const handleBanUser = async (userId: number, currentlyActive: boolean) => {
    if (currentlyActive) {
      if (!confirm('Are you sure you want to ban this user?')) return
      try {
        await banUser({ userId }).unwrap()
      } catch (err) {
        alert('Failed to ban user')
      }
    } else {
      try {
        await unbanUser(userId).unwrap()
      } catch (err) {
        alert('Failed to unban user')
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage user accounts and permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {data?.total || 0} total users
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Users</CardTitle>
          <CardDescription>Filter users by email address</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Search by email..."
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Search</Button>
            {searchEmail && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEmailFilter('')
                  setSearchEmail('')
                  setPage(1)
                }}
              >
                Clear
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load users. Please try again.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            {searchEmail
              ? `Showing results for "${searchEmail}"`
              : 'All registered users'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[150px]" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : data?.users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No users found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data?.users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <button
                        onClick={() => navigate(`/admin/users/${user.id}`)}
                        className="font-medium hover:underline truncate"
                      >
                        {user.email}
                      </button>
                      {user.is_admin && (
                        <Badge variant="secondary" className="shrink-0">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                      {!user.is_active && (
                        <Badge variant="destructive" className="shrink-0">
                          Banned
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-4">
                      <span>ID: {user.id}</span>
                      {user.role && <span>Role: {user.role}</span>}
                      {user.experience_years !== null && (
                        <span>{user.experience_years} years exp</span>
                      )}
                      <span>Joined: {formatDate(user.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/admin/users/${user.id}`)}
                    >
                      View
                    </Button>
                    {!user.is_admin && (
                      <Button
                        size="sm"
                        variant={user.is_active ? 'destructive' : 'default'}
                        onClick={() => handleBanUser(user.id, user.is_active)}
                      >
                        {user.is_active ? (
                          <>
                            <Ban className="h-4 w-4 mr-1" />
                            Ban
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Unban
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {data && data.total > data.page_size && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * data.page_size + 1} to{' '}
                {Math.min(page * data.page_size, data.total)} of {data.total} users
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * data.page_size >= data.total}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
