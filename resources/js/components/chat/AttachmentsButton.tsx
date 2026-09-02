import { Paperclip } from 'lucide-react'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'

interface AttachmentsButtonProps {
  onFileSelect: (files: FileList) => void
  disabled?: boolean
}

export function AttachmentsButton({ onFileSelect, disabled = false }: AttachmentsButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files)
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleChange}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled}
        onClick={handleClick}
        className="size-8 rounded-full text-muted-foreground hover:text-foreground"
      >
        <Paperclip className="size-4" />
        <span className="sr-only">Attach files</span>
      </Button>
    </>
  )
}
