import { Icon } from '@/components/Icon'

export function Greeting() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-2xl mx-auto my-auto space-y-4">
      <div className="rounded-full bg-primary/10 p-4 text-primary">
        <Icon icon="lucide:sparkles" className="size-8" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight">Halo! Ada yang bisa Akademikku bantu?</h1>
      <p className="text-muted-foreground text-sm max-w-md">
        Asisten AI & RAG Resmi Universitas Halu Oleo. Tanya jawab instan seputar akademik, SIAKAD, UKT, beasiswa, dan info kampus UHO.
      </p>
    </div>
  )
}
