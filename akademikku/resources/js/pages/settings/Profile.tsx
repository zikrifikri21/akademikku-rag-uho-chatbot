import type { User } from '@/types'
import { Head, Link, useForm, usePage } from '@inertiajs/react'
import { DeleteUser } from '@/components/DeleteUser'
import { HeadingSmall } from '@/components/HeadingSmall'
import { InputError } from '@/components/InputError'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import SettingsLayout from '@/layouts/settings/Layout'

interface ProfileProps {
  mustVerifyEmail?: boolean
  status?: string
}

export default function Profile({ mustVerifyEmail = false, status }: ProfileProps) {
  const user = usePage().props.auth.user as User

  const form = useForm({
    name: user.name,
    email: user.email,
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    form.patch(route('profile.update'), {
      preserveScroll: true,
    })
  }

  return (
    <SettingsLayout>
      <Head title="Profile Settings" />

      <div className="space-y-6">
        <HeadingSmall
          title="Profile Information"
          description="Update your account's profile information and email address"
        />

        <form onSubmit={submit} className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              required
              value={form.data.name}
              onChange={e => form.setData('name', e.target.value)}
              placeholder="Full name"
            />
            <InputError message={form.errors.name} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              required
              value={form.data.email}
              onChange={e => form.setData('email', e.target.value)}
              placeholder="email@example.com"
            />
            <InputError message={form.errors.email} />
          </div>

          {mustVerifyEmail && user.email_verified_at === null && (
            <div>
              <p className="text-sm mt-2 text-muted-foreground">
                Your email address is unverified.{' '}
                <Link
                  href={route('verification.send')}
                  method="post"
                  as="button"
                  className="underline text-sm text-foreground hover:text-primary"
                >
                  Click here to re-send the verification email.
                </Link>
              </p>

              {status === 'verification-link-sent' && (
                <div className="mt-2 font-medium text-sm text-green-600">
                  A new verification link has been sent to your email address.
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-4">
            <Button type="submit" disabled={form.processing}>
              Save
            </Button>

            {form.recentlySuccessful && (
              <p className="text-sm text-muted-foreground">Saved.</p>
            )}
          </div>
        </form>

        <DeleteUser />
      </div>
    </SettingsLayout>
  )
}
