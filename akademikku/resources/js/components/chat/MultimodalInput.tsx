import { PlaceholdersAndVanishInput } from '@/components/ui/placeholders-and-vanish-input'
import { useChatInput } from '@/hooks/useChatInput'

interface MultimodalInputProps {
  isLoading?: boolean
  isReadonly?: boolean
  onSubmit?: () => void
  onStop?: () => void
}

const UHO_PLACEHOLDERS = [
  'Tanyakan sesuatu tentang perkuliahan Universitas Halu Oleo...',
  'Bagaimana cara pembayaran UKT di UHO?',
  'Kapan jadwal pengisian KRS semester ini?',
  'Apa saja syarat beasiswa KIP Kuliah di UHO?',
  'Di mana lokasi Perpustakaan Utama Kampus UHO?',
  'Bagaimana alur pendaftaran wisuda dan yudisium UHO?',
]

export function MultimodalInput({
  isLoading = false,
  isReadonly = false,
  onSubmit,
  onStop,
}: MultimodalInputProps) {
  const { input, setInput } = useChatInput()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (input.trim() && !isLoading && !isReadonly) {
      onSubmit?.()
    }
  }

  return (
    <div className="relative w-full max-w-3xl mx-auto p-4 pt-2">
      {/* Gradient Overlay */}
      <div className="absolute -top-10 left-0 right-0 h-10 pointer-events-none bg-gradient-to-t from-background via-background/40 to-transparent z-10" />

      <PlaceholdersAndVanishInput
        placeholders={isReadonly ? ['Silakan login untuk mengirim pesan...'] : UHO_PLACEHOLDERS}
        value={input}
        onChange={handleChange}
        onSubmit={handleFormSubmit}
        disabled={isReadonly}
        isLoading={isLoading}
        onStop={onStop}
      />
    </div>
  )
}
