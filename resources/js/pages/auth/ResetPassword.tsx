import { Head, useForm } from '@inertiajs/react'
import { InputError } from '@/components/InputError'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AuthLayout from '@/layouts/AuthLayout'

interface ResetPasswordProps {
  token: string
  email: string
}

export default function ResetPassword({ token, email }: ResetPasswordProps) {
  const form = useForm({
    token,
    email,
    password: '',
    password_confirmation: '',
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    form.post(route('password.store'), {
      onFinish: () => form.reset('password', 'password_confirmation'),
    })
  }

  return (
    <AuthLayout
      title="Reset password"
      description="Enter your new password below"
    >
      <Head title="Reset Password" />

      <form onSubmit={submit} className="flex flex-col gap-6">
        <div className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              required
              readOnly
              autoComplete="email"
              value={form.data.email}
              onChange={e => form.setData('email', e.target.value)}
            />
            <InputError message={form.errors.email} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              required
              autoFocus
              autoComplete="new-password"
              value={form.data.password}
              onChange={e => form.setData('password', e.target.value)}
              placeholder="New password"
            />
            <InputError message={form.errors.password} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password_confirmation">Confirm New Password</Label>
            <Input
              id="password_confirmation"
              type="password"
              required
              autoComplete="new-password"
              value={form.data.password_confirmation}
              onChange={e => form.setData('password_confirmation', e.target.value)}
              placeholder="Confirm new password"
            />
            <InputError message={form.errors.password_confirmation} />
          </div>

          <Button type="submit" className="w-full" disabled={form.processing}>
            Reset password
          </Button>
        </div>
      </form>
    </AuthLayout>
  )
}
