import type { SharedData, User } from '@/types'
import { usePage } from '@inertiajs/react'

export function useAuth() {
  const { props } = usePage<SharedData>()

  const user: User | null = props.auth?.user ?? null
  const isGuest = !user
  const isAuthenticated = !!user

  return {
    user,
    isGuest,
    isAuthenticated,
  }
}
