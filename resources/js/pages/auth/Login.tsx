import { Head, useForm } from '@inertiajs/react'
import { InputError } from '@/components/InputError'
import { TextLink } from '@/components/TextLink'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AuthLayout from '@/layouts/AuthLayout'

interface LoginProps {
  status?: string
  canResetPassword?: boolean
}

export default function Login({ status, canResetPassword }: LoginProps) {
  const form = useForm({
    email: '',
    password: '',
    remember: false,
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    form.post(route('login'), {
      onFinish: () => form.reset('password'),
    })
  }

  return (
    <AuthLayout
      title="Log in to your account"
      description="Enter your email and password below to log in"
    >
      <Head title="Log in" />

      {status && (
        <div className="mb-4 text-center text-sm font-medium text-green-600">
          {status}
        </div>
      )}

      <form onSubmit={submit} className="flex flex-col gap-6">
        <div className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              required
              autoFocus
              tabIndex={1}
              autoComplete="email"
              value={form.data.email}
              onChange={e => form.setData('email', e.target.value)}
              placeholder="email@example.com"
            />
            <InputError message={form.errors.email} />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              {canResetPassword && (
                <TextLink href={route('password.request')} tabIndex={5}>
                  Forgot password?
                </TextLink>
              )}
            </div>
            <Input
              id="password"
              type="password"
              required
              tabIndex={2}
              autoComplete="current-password"
              value={form.data.password}
              onChange={e => form.setData('password', e.target.value)}
              placeholder="Password"
            />
            <InputError message={form.errors.password} />
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="remember"
              tabIndex={3}
              checked={form.data.remember}
              onCheckedChange={checked => form.setData('remember', !!checked)}
            />
            <Label htmlFor="remember" className="font-normal cursor-pointer">
              Remember me
            </Label>
          </div>

          <Button type="submit" className="mt-4 w-full" tabIndex={4} disabled={form.processing}>
            Log in
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <TextLink href={route('register')} tabIndex={6}>
            Sign up
          </TextLink>
        </div>
      </form>
    </AuthLayout>
  )
}
