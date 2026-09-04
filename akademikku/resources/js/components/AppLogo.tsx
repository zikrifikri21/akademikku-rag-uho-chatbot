import { AppLogoIcon } from './AppLogoIcon'

export function AppLogo() {
  return (
    <div className="flex items-center gap-2 font-semibold">
      <AppLogoIcon className="size-6 text-primary" />
      <span className="text-base font-bold tracking-tight">Akademikku</span>
    </div>
  )
}
