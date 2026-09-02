import { Head, useForm } from '@inertiajs/react'
import { useRef } from 'react'
import { HeadingSmall } from '@/components/HeadingSmall'
import { InputError } from '@/components/InputError'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import SettingsLayout from '@/layouts/settings/Layout'

export default function Password() {
  const passwordInput = useRef<HTMLInputElement>(null)
  const currentPasswordInput = useRef<HTMLInputElement>(null)

  const form = useForm({
    current_password: '',
    password: '',
    password_confirmation: '',
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()

    form.put(route('password.update'), {
      preserveScroll: true,
      onSuccess: () => form.reset(),
      onError: (errors) => {
        if (errors.password) {
          form.reset('password', 'password_confirmation')
          passwordInput.current?.focus()
        }
        if (errors.current_password) {
          form.reset('current_password')
          currentPasswordInput.current?.focus()
        }
      },
    })
  }

  return (
    <SettingsLayout>
      <Head title="Password Settings" />

      <div className="space-y-6">
        <HeadingSmall
          title="Update Password"
          description="Ensure your account is using a long, random password to stay secure"
        />

        <form onSubmit={submit} className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="current_password">Current Password</Label>
            <Input
              id="current_password"
              type="password"
              ref={currentPasswordInput}
              value={form.data.current_password}
              onChange={e => form.setData('current_password', e.target.value)}
              placeholder="Current password"
              autoComplete="current-password"
            />
            <InputError message={form.errors.current_password} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              ref={passwordInput}
              value={form.data.password}
              onChange={e => form.setData('password', e.target.value)}
              placeholder="New password"
              autoComplete="new-password"
            />
            <InputError message={form.errors.password} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password_confirmation">Confirm Password</Label>
            <Input
              id="password_confirmation"
              type="password"
              value={form.data.password_confirmation}
              onChange={e => form.setData('password_confirmation', e.target.value)}
              placeholder="Confirm new password"
              autoComplete="new-password"
            />
            <InputError message={form.errors.password_confirmation} />
          </div>

          <div className="flex items-center gap-4">
            <Button type="submit" disabled={form.processing}>
              Save
            </Button>

            {form.recentlySuccessful && (
              <p className="text-sm text-muted-foreground">Saved.</p>
            )}
          </div>
        </form>
      </div>
    </SettingsLayout>
  )
}
