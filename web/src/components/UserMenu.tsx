import { useNavigate } from 'react-router-dom'
import { removeTokens } from '@/utils/authStorage'
import { useGetUserInfoQuery } from '@/store/api/endpoints/authApi'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, Settings, User, ChevronsUpDown } from 'lucide-react'

export function UserMenu() {
  const navigate = useNavigate()
  const { data: user } = useGetUserInfoQuery()

  const handleLogout = () => {
    removeTokens()
    navigate('/login')
  }

  const initials = user?.email
    ? user.email.charAt(0).toUpperCase()
    : '?'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="gap-2 px-2"
          aria-label="User menu"
        >
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden flex-col items-start md:flex">
            <span className="max-w-[150px] truncate text-sm font-medium">
              {user?.email ?? 'Loading...'}
            </span>
          </div>
          <ChevronsUpDown className="ml-1 hidden size-4 text-muted-foreground md:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user?.email ?? 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.is_active ? 'Active account' : 'Inactive account'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate('/profile')}>
            <User />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/settings')}>
            <Settings />
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
