import { Head, useForm } from '@inertiajs/react'
import { TextLink } from '@/components/TextLink'
import { Button } from '@/components/ui/button'
import AuthLayout from '@/layouts/AuthLayout'

interface VerifyEmailProps {
  status?: string
}

export default function VerifyEmail({ status }: VerifyEmailProps) {
  const form = useForm({})

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    form.post(route('verification.send'))
  }

  return (
    <AuthLayout
      title="Verify email"
      description="Thanks for signing up! Before getting started, could you verify your email address by clicking on the link we just emailed to you?"
    >
      <Head title="Email Verification" />

      {status === 'verification-link-sent' && (
        <div className="mb-4 text-center text-sm font-medium text-green-600">
          A new verification link has been sent to the email address you provided during registration.
        </div>
      )}

      <form onSubmit={submit} className="flex flex-col gap-6">
        <Button type="submit" className="w-full" disabled={form.processing}>
          Resend Verification Email
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          <TextLink href={route('logout')} method="post" as="button">
            Log out
          </TextLink>
        </div>
      </form>
    </AuthLayout>
  )
}
