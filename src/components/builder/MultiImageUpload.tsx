import { useRef, useState } from 'react'
import { X, Loader2, ImagePlus } from 'lucide-react'
import { uploadImage } from '../../services/uploadService'

type MultiImageUploadProps = {
  images: { url: string; caption?: string }[]
  onChange: (images: { url: string; caption?: string }[]) => void
}

const MAX_IMAGES = 12
const MAX_FILE_MB = 5

/**
 * Upload múltiplo de imagens — reutiliza exatamente o mesmo fluxo Cloudinary
 * do bloco de Cabeçalho (uploadImage). Sem edição de imagem: apenas upload,
 * reordenação simples (mover) e remoção.
 */
export function MultiImageUpload({ images, onChange }: MultiImageUploadProps) {
  const [uploadingCount, setUploadingCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setError(null)

    const list = Array.from(files)
    const valid = list.filter((f) => f.type.startsWith('image/'))
    const tooBig = list.filter((f) => f.size > MAX_FILE_MB * 1024 * 1024)

    if (valid.length === 0) {
      setError('Selecione arquivos de imagem (JPG, PNG, WebP...)')
      return
    }
    if (tooBig.length > 0) {
      setError(`Algumas imagens passam de ${MAX_FILE_MB} MB e foram ignoradas`)
    }
    if (images.length + valid.length > MAX_IMAGES) {
      setError(`Máximo de ${MAX_IMAGES} imagens por galeria`)
      return
    }

    setUploadingCount(valid.length)
    const uploaded: { url: string; caption?: string }[] = []
    for (const file of valid) {
      try {
        const url = await uploadImage(file)
        uploaded.push({ url })
      } catch {
        setError('Falha no upload de uma das imagens — tente novamente')
      } finally {
        setUploadingCount((c) => c - 1)
      }
    }
    if (uploaded.length > 0) {
      onChange([...images, ...uploaded])
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeImage(index: number) {
    onChange(images.filter((_, i) => i !== index))
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= images.length) return
    const next = [...images]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploadingCount > 0}
        className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-3 py-4 text-center transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] disabled:opacity-60"
        style={{ borderColor: 'var(--color-border-strong)' }}
      >
        {uploadingCount > 0 ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-dim" />
            <span className="text-xs text-dim">Enviando {uploadingCount} imagem(ns)...</span>
          </>
        ) : (
          <>
            <ImagePlus className="h-5 w-5 text-dim" />
            <span className="text-xs text-dim">Clique para adicionar imagens (múltiplas)</span>
            <span className="text-[11px] text-faint">JPG, PNG · máx. {MAX_FILE_MB} MB · até {MAX_IMAGES}</span>
          </>
        )}
      </button>

      {error ? (
        <p className="text-xs" style={{ color: 'var(--color-error)' }}>
          {error}
        </p>
      ) : null}

      {images.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img, i) => (
            <div
              key={`${img.url}-${i}`}
              className="group relative overflow-hidden rounded-lg border"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <img src={img.url} alt={img.caption || `Imagem ${i + 1}`} className="h-16 w-full object-cover" />
              {uploadingCount > 0 ? null : (
                <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="flex h-6 w-6 items-center justify-center rounded bg-white/90 text-black disabled:opacity-40"
                    aria-label="Mover para a esquerda"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="flex h-6 w-6 items-center justify-center rounded bg-white/90 text-[var(--color-error)]"
                    aria-label="Remover imagem"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === images.length - 1}
                    className="flex h-6 w-6 items-center justify-center rounded bg-white/90 text-black disabled:opacity-40"
                    aria-label="Mover para a direita"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => void handleFiles(e.target.files)}
        className="hidden"
      />
    </div>
  )
}
