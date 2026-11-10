import type { SharedData } from '@/types'
import { Head, router, useForm, usePage } from '@inertiajs/react'
import { useState } from 'react'
import { HeadingSmall } from '@/components/HeadingSmall'
import { InputError } from '@/components/InputError'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import SettingsLayout from '@/layouts/settings/Layout'

interface Versi { no: number, docs: string[], catatan: string, dibuat: string }
interface Dokumen { title: string, fakultas: string, chunks: number, dibuat: string, source?: string }
interface Props {
  knowledge: { aktif: number, versi: Versi[], dokumen: Record<string, Dokumen> }
}

export default function Knowledge({ knowledge }: Props) {
  const { csrf_token } = usePage<SharedData>().props
  const aktif = knowledge.versi.find(v => v.no === knowledge.aktif)
  const form = useForm({
    file: null as File | null,
    title: '',
    fakultas: 'UNIVERSITAS',
    source: '',
    catatan: '',
    ganti_doc_id: '',
    aktifkan: true,
  })
  const [uji, setUji] = useState({ message: '', versi: knowledge.aktif, jawaban: '', loading: false })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    form.post(route('knowledge.store'), { forceFormData: true, preserveScroll: true, onSuccess: () => form.reset() })
  }

  const tanya = async (e: React.FormEvent) => {
    e.preventDefault()
    setUji(u => ({ ...u, loading: true, jawaban: '' }))
    try {
      const res = await fetch(route('knowledge.test'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': csrf_token ?? '' },
        body: JSON.stringify({ message: uji.message, versi: uji.versi }),
      })
      const data = await res.json()
      setUji(u => ({ ...u, jawaban: data.error ?? data.text ?? data.message ?? 'Gagal' }))
    }
    finally {
      setUji(u => ({ ...u, loading: false }))
    }
  }

  return (
    <SettingsLayout>
      <Head title="Pengetahuan AI" />

      <div className="space-y-10">
        <section className="space-y-6">
          <HeadingSmall
            title="Upload PDF pengetahuan"
            description={`Setiap upload membuat versi baru dari versi aktif (v${knowledge.aktif}). Embedding PDF besar bisa beberapa menit.`}
          />
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="file">File PDF (maks. 50 MB, bukan hasil scan)</Label>
              <Input id="file" type="file" accept="application/pdf" onChange={e => form.setData('file', e.target.files?.[0] ?? null)} />
              <InputError message={form.errors.file} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title">Judul dokumen (dipakai di sitasi, sertakan tahun)</Label>
              <Input id="title" value={form.data.title} onChange={e => form.setData('title', e.target.value)} placeholder="Peraturan Rektor No. 5 Tahun 2026 tentang ..." />
              <InputError message={form.errors.title} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="fakultas">Fakultas</Label>
                <Input id="fakultas" value={form.data.fakultas} onChange={e => form.setData('fakultas', e.target.value)} placeholder="UNIVERSITAS / FMIPA / FKIP ..." />
                <InputError message={form.errors.fakultas} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="source">URL sumber (opsional)</Label>
                <Input id="source" type="url" value={form.data.source} onChange={e => form.setData('source', e.target.value)} placeholder="https://uho.ac.id/..." />
                <InputError message={form.errors.source} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ganti">Menggantikan dokumen lama (opsional)</Label>
              <select
                id="ganti"
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm dark:bg-input/30"
                value={form.data.ganti_doc_id}
                onChange={e => form.setData('ganti_doc_id', e.target.value)}
              >
                <option value="">— Tidak, tambahkan saja —</option>
                {aktif?.docs.filter(id => id !== 'base').map(id => (
                  <option key={id} value={id}>{knowledge.dokumen[id]?.title ?? id}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="catatan">Catatan versi</Label>
              <Textarea id="catatan" value={form.data.catatan} onChange={e => form.setData('catatan', e.target.value)} placeholder="Mis. revisi aturan cuti 2026" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.data.aktifkan} onChange={e => form.setData('aktifkan', e.target.checked)} />
              Langsung aktifkan versi baru (hilangkan centang untuk diuji dulu)
            </label>
            <Button type="submit" disabled={form.processing || !form.data.file}>
              {form.processing ? `Memproses${form.progress ? ` ${form.progress.percentage}%` : ''}...` : 'Upload & buat versi baru'}
            </Button>
            {form.recentlySuccessful && <p className="text-sm text-muted-foreground">Versi baru dibuat, lihat daftar di bawah.</p>}
          </form>
        </section>

        <section className="space-y-4">
          <HeadingSmall title="Versi pengetahuan" description="Pindah ke versi mana pun kapan saja; tidak ada data yang dihapus." />
          <div className="divide-y rounded-lg border">
            {[...knowledge.versi].reverse().map(v => (
              <div key={v.no} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <p className="font-medium">
                    v{v.no}
                    {v.no === knowledge.aktif && <span className="ml-2 rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground">aktif</span>}
                  </p>
                  <p className="text-sm text-muted-foreground">{v.catatan} · {v.dibuat.replace('T', ' ')}</p>
                  <ul className="text-xs text-muted-foreground">
                    {v.docs.map(id => <li key={id}>• {knowledge.dokumen[id]?.title ?? id} ({knowledge.dokumen[id]?.fakultas}, {knowledge.dokumen[id]?.chunks} chunk)</li>)}
                  </ul>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setUji(u => ({ ...u, versi: v.no }))}>Uji</Button>
                  {v.no !== knowledge.aktif && (
                    <Button size="sm" onClick={() => router.post(route('knowledge.activate', { versi: v.no }), {}, { preserveScroll: true })}>Aktifkan</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <HeadingSmall title={`Uji jawaban di v${uji.versi}`} description="Bandingkan ketepatan jawaban antar versi sebelum mengaktifkan." />
          <form onSubmit={tanya} className="space-y-3">
            <Textarea value={uji.message} onChange={e => setUji(u => ({ ...u, message: e.target.value }))} placeholder="Pertanyaan uji, mis. berapa lama maksimal cuti akademik?" />
            <Button type="submit" disabled={uji.loading || !uji.message.trim()}>{uji.loading ? 'Menjawab...' : 'Tanya'}</Button>
          </form>
          {uji.jawaban && <pre className="whitespace-pre-wrap rounded-lg border bg-muted/40 p-4 text-sm">{uji.jawaban}</pre>}
        </section>
      </div>
    </SettingsLayout>
  )
}
