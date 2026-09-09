import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { uploadImage } from '../services/uploadService'

type ImageUploadProps = {
  value?: string
  onChange: (url: string) => void
  label?: string
}

export function ImageUpload({ value, onChange, label }: ImageUploadProps) {
  const [preview, setPreview] = useState(value || '')
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return

    // Local preview
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    // Upload
    setUploading(true)
    try {
      const url = await uploadImage(file)
      setPreview(url)
      onChange(url)
    } catch {
      setPreview(value || '')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleRemove = () => {
    setPreview('')
    onChange('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div>
      {label && <label className="label">{label}</label>}
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-[var(--color-border)]">
          <img src={preview} alt="Preview" className="w-full h-40 object-cover" />
          <div className="absolute top-2 right-2 flex gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg shadow-md transition-colors"
              style={{ background: 'var(--color-background-elevated)', color: 'var(--color-text-secondary)' }}
            >
              <Upload size={14} />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 rounded-lg shadow-md transition-colors"
              style={{ background: 'var(--color-background-elevated)', color: 'var(--color-error)' }}
            >
              <X size={14} />
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
              : 'border-[var(--color-border-strong)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]'
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[var(--accent-soft)] flex items-center justify-center">
              <ImageIcon size={20} className="text-[var(--accent-hover)]" />
            </div>
            <p className="text-sm text-dim">
              {uploading ? 'Enviando...' : 'Arraste ou clique para adicionar imagem'}
            </p>
            <p className="text-xs text-faint">JPG, PNG (máx. 5MB)</p>
          </div>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
        className="hidden"
      />
    </div>
  )
}
