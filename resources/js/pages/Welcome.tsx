import { Head, Link } from '@inertiajs/react'
import { AppLogo } from '@/components/AppLogo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

export default function Welcome() {
  const { isAuthenticated } = useAuth()

  return (
    <>
      <Head title="Welcome to Akademikku" />
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
        <div className="flex max-w-md flex-col items-center gap-6">
          <AppLogo />
          <h1 className="text-3xl font-bold tracking-tight">Akademikku AI Assistant</h1>
          <p className="text-muted-foreground text-sm">
            Experience intelligent conversations, code analysis, and creative writing powered by AI.
          </p>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Button asChild size="lg">
                <Link href={route('chats.index')}>Go to Chat</Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg">
                  <Link href={route('login')}>Log In</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href={route('register')}>Register</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
