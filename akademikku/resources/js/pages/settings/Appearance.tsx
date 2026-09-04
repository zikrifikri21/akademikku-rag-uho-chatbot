import { Head } from '@inertiajs/react'
import { AppearanceTabs } from '@/components/AppearanceTabs'
import { HeadingSmall } from '@/components/HeadingSmall'
import SettingsLayout from '@/layouts/settings/Layout'

export default function Appearance() {
  return (
    <SettingsLayout>
      <Head title="Appearance Settings" />

      <div className="space-y-6">
        <HeadingSmall
          title="Appearance Settings"
          description="Update your account's appearance settings and theme preferences"
        />

        <AppearanceTabs />
      </div>
    </SettingsLayout>
  )
}
