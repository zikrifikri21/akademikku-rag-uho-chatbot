import { Head, useForm } from '@inertiajs/react'
import { InputError } from '@/components/InputError'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AuthLayout from '@/layouts/AuthLayout'

export default function ConfirmPassword() {
  const form = useForm({
    password: '',
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    form.post(route('password.confirm'), {
      onFinish: () => form.reset(),
    })
  }

  return (
    <AuthLayout
      title="Confirm your password"
      description="This is a secure area of the application. Please confirm your password before continuing."
    >
      <Head title="Confirm Password" />

      <form onSubmit={submit} className="flex flex-col gap-6">
        <div className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              autoFocus
              autoComplete="current-password"
              value={form.data.password}
              onChange={e => form.setData('password', e.target.value)}
              placeholder="Password"
            />
            <InputError message={form.errors.password} />
          </div>

          <Button type="submit" className="w-full" disabled={form.processing}>
            Confirm Password
          </Button>
        </div>
      </form>
    </AuthLayout>
  )
}
