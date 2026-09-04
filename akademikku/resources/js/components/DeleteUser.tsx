import { useForm } from '@inertiajs/react'
import { useRef, useState } from 'react'
import { HeadingSmall } from '@/components/HeadingSmall'
import { InputError } from '@/components/InputError'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function DeleteUser() {
  const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false)
  const passwordInput = useRef<HTMLInputElement>(null)

  const form = useForm({
    password: '',
  })

  const deleteUser = (e: React.FormEvent) => {
    e.preventDefault()

    form.delete(route('profile.destroy'), {
      preserveScroll: true,
      onSuccess: () => setConfirmingUserDeletion(false),
      onError: () => passwordInput.current?.focus(),
      onFinish: () => form.reset(),
    })
  }

  return (
    <div className="space-y-6">
      <HeadingSmall
        title="Delete Account"
        description="Delete your account and all of its resources"
      />

      <div className="space-y-4 rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-200/10 dark:bg-red-900/10">
        <div className="relative space-y-0.5 text-red-600 dark:text-red-100">
          <p className="font-medium">Warning</p>
          <p className="text-sm">Please proceed with caution, this cannot be undone.</p>
        </div>
      </div>

      <Dialog open={confirmingUserDeletion} onOpenChange={setConfirmingUserDeletion}>
        <DialogTrigger asChild>
          <Button variant="destructive">Delete Account</Button>
        </DialogTrigger>

        <DialogContent>
          <form onSubmit={deleteUser}>
            <DialogHeader>
              <DialogTitle>Are you sure you want to delete your account?</DialogTitle>
              <DialogDescription>
                Once your account is deleted, all of its resources and data will be permanently deleted.
                Please enter your password to confirm you would like to permanently delete your account.
              </DialogDescription>
            </DialogHeader>

            <div className="my-6 space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                name="password"
                ref={passwordInput}
                value={form.data.password}
                onChange={e => form.setData('password', e.target.value)}
                placeholder="Password"
              />
              <InputError message={form.errors.password} />
            </div>

            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="secondary" onClick={() => form.reset()}>
                  Cancel
                </Button>
              </DialogClose>
              <Button variant="destructive" disabled={form.processing}>
                Delete Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
