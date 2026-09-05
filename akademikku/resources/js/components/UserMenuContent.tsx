import type { User } from '@/types'
import { Link, router } from '@inertiajs/react'
import { LogIn, LogOut, Settings } from 'lucide-react'
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'
import { UserInfo } from './UserInfo'

interface UserMenuContentProps {
  user: User
}

export function UserMenuContent({ user }: UserMenuContentProps) {
  const { isGuest } = useAuth()

  const handleLogout = () => {
    router.post(route('logout'))
  }

  if (isGuest) {
    return (
      <>
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <UserInfo user={user} showEmail={false} />
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={route('login')} className="w-full cursor-pointer flex items-center">
            <LogIn className="mr-2 size-4" />
            <span>Log in</span>
          </Link>
        </DropdownMenuItem>
      </>
    )
  }

  return (
    <>
      <DropdownMenuLabel className="p-0 font-normal">
        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
          <UserInfo user={user} showEmail />
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem asChild>
          <Link href={route('profile.edit')} className="w-full cursor-pointer">
            <Settings className="mr-2 size-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
        <LogOut className="mr-2 size-4" />
        <span>Log out</span>
      </DropdownMenuItem>
    </>
  )
}

