import { Head, useForm } from '@inertiajs/react'
import { InputError } from '@/components/InputError'
import { TextLink } from '@/components/TextLink'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AuthLayout from '@/layouts/AuthLayout'

interface ForgotPasswordProps {
  status?: string
}

export default function ForgotPassword({ status }: ForgotPasswordProps) {
  const form = useForm({
    email: '',
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    form.post(route('password.email'))
  }

  return (
    <AuthLayout
      title="Forgot password"
      description="Enter your email to receive a password reset link"
    >
      <Head title="Forgot Password" />

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
              autoComplete="email"
              value={form.data.email}
              onChange={e => form.setData('email', e.target.value)}
              placeholder="email@example.com"
            />
            <InputError message={form.errors.email} />
          </div>

          <Button type="submit" className="w-full" disabled={form.processing}>
            Email password reset link
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Or return to{' '}
          <TextLink href={route('login')}>Log in</TextLink>
        </div>
      </form>
    </AuthLayout>
  )
}
