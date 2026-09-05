import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'

interface SuggestedActionsProps {
  onAppend: (message: string) => void
}

export function SuggestedActions({ onAppend }: SuggestedActionsProps) {
  const actions = [
    {
      title: 'Alur Pengisian KRS SIAKAD',
      label: 'jadwal & tata cara KRS online di SIAKAD UHO',
      action: 'Bagaimana alur dan syarat pengisian KRS online di SIAKAD Universitas Halu Oleo?',
      icon: 'lucide:graduation-cap',
    },
    {
      title: 'Info Beasiswa & KIP Kuliah',
      label: 'syarat pendaftaran beasiswa mahasiswa UHO',
      action: 'Apa saja beasiswa yang tersedia di Universitas Halu Oleo dan bagaimana syarat pendaftarannya?',
      icon: 'lucide:award',
    },
    {
      title: 'Syarat & Tata Cara Cuti Kuliah',
      label: 'prosedur permohonan cuti akademik di UHO',
      action: 'Bagaimana prosedur dan syarat pengajuan cuti akademik bagi mahasiswa Universitas Halu Oleo?',
      icon: 'lucide:file-text',
    },
    {
      title: 'Layanan & Jam Operasional Perpus',
      label: 'fasilitas & syarat pinjam buku Perpus UHO',
      action: 'Apa saja fasilitas, jam operasional, dan syarat peminjaman buku di Perpustakaan UHO?',
      icon: 'lucide:book-open',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl mx-auto w-full p-4">
      {actions.map(action => (
        <Button
          key={action.title}
          variant="outline"
          className="h-auto p-4 flex flex-col items-start justify-start text-left space-y-1 hover:border-primary/50 transition-all group whitespace-normal w-full"
          onClick={() => onAppend(action.action)}
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground group-hover:text-primary w-full">
            <Icon icon={action.icon} className="size-4 shrink-0" />
            <span className="truncate">{action.title}</span>
          </div>
          <span className="text-xs text-muted-foreground leading-snug w-full break-words">
            {action.label}
          </span>
        </Button>
      ))}
    </div>
  )
}
