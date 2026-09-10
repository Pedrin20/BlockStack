import { useState } from 'react'
import {
  X,
  Share2,
  Check,
  Copy,
  ExternalLink,
  MessageCircle,
  Lock,
  Globe,
  EyeOff,
} from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import toast from 'react-hot-toast'
import { publishPage, unpublishPage } from '../../services/settingsService'

type Props = {
  isOpen: boolean
  onClose: () => void
  userId: string
  username?: string
  published: boolean
  /** Chamado após publicar/despublicar para o editor reagir na hora. */
  onChanged?: () => void | Promise<void>
}

/**
 * Modal de publicação: publica/despublica a página (grava o flag em
 * pageSettings) e, quando publicada, expõe compartilhamento rápido.
 */
export function PublishModal({ isOpen, onClose, userId, username, published, onChanged }: Props) {
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const publicUrl = username ? `${window.location.origin}/${username}` : ''

  function handleClose() {
    setCopied(false)
    onClose()
  }

  if (!isOpen) return null

  async function handlePublish() {
    if (!username) {
      toast.error('Defina um username antes de publicar.')
      return
    }
    setBusy(true)
    try {
      await publishPage(userId)
      await onChanged?.()
      toast.success('Página publicada com sucesso! 🎉')
    } catch {
      toast.error('Erro ao publicar. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  async function handleUnpublish() {
    const confirmed = window.confirm(
      'Despublicar sua página? Quem tiver o link vai ver um aviso de que ela não está mais disponível.',
    )
    if (!confirmed) return
    setBusy(true)
    try {
      await unpublishPage(userId)
      await onChanged?.()
      toast.success('Página despublicada.')
    } catch {
      toast.error('Erro ao despublicar. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  async function handleCopy() {
    if (!publicUrl) return
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      toast.success('Link copiado!')
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Não foi possível copiar o link.')
    }
  }

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `Acesse minha página no GetLink: ${publicUrl}`,
  )}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-md rounded-[var(--radius-2xl)] p-6 animate-slide-up"
        style={{
          background: 'var(--color-background-elevated)',
          border: '1px solid var(--color-border-strong)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        <button
          type="button"
          onClick={handleClose}
          className="btn btn-ghost btn-sm absolute right-4 top-4 p-2"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        {published ? (
          /* ── Estado publicada ─────────────────────────────── */
          <div className="text-center">
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: 'var(--color-success-soft)' }}
            >
              <Globe size={26} style={{ color: 'var(--color-success)' }} />
            </div>
            <h3 className="mb-1 text-xl font-bold text-ink">Página publicada</h3>
            <p className="mb-5 text-sm text-dim">
              Sua página está visível para qualquer pessoa com o link.
            </p>

            {/* Link */}
            <div
              className="mb-3 flex items-center gap-2 rounded-xl p-2 pl-3"
              style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}
            >
              <span className="min-w-0 flex-1 truncate text-left text-sm text-ink">
                {publicUrl}
              </span>
              <button type="button" onClick={handleCopy} className="btn btn-primary btn-sm shrink-0">
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>

            {/* QR Code */}
            {publicUrl ? (
              <div className="mb-4 flex justify-center">
                <div className="rounded-xl border border-[var(--color-border)] bg-white p-3 shadow-[var(--shadow-md)]">
                  <QRCodeCanvas value={publicUrl} size={120} bgColor="#ffffff" fgColor="#111827" level="M" />
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-2">
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-md"
              >
                <ExternalLink size={16} />
                Abrir
              </a>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-md">
                <MessageCircle size={16} />
                WhatsApp
              </a>
            </div>

            <button
              type="button"
              onClick={handleUnpublish}
              disabled={busy}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-dim transition-colors hover:text-[var(--color-error)] disabled:opacity-50"
            >
              <EyeOff size={14} />
              Despublicar página
            </button>
          </div>
        ) : (
          /* ── Estado não publicada ─────────────────────────── */
          <div className="text-center">
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: 'var(--accent-soft)' }}
            >
              {username ? (
                <Share2 size={24} style={{ color: 'var(--accent-hover)' }} />
              ) : (
                <Lock size={24} style={{ color: 'var(--accent-hover)' }} />
              )}
            </div>
            <h3 className="mb-1 text-xl font-bold text-ink">Publicar sua página</h3>
            <p className="mb-5 text-sm text-dim">
              {username
                ? 'Ao publicar, qualquer pessoa com o link poderá ver seus blocos. Você pode despublicar quando quiser.'
                : 'Você precisa definir um username antes de publicar sua página.'}
            </p>

            {username ? (
              <div
                className="mb-4 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm"
                style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}
              >
                <Lock size={14} className="shrink-0 text-dim" />
                <span className="min-w-0 flex-1 truncate text-left text-dim">
                  {window.location.host}/{username}
                </span>
                <span
                  className="badge shrink-0"
                  style={{
                    background: 'var(--color-warning-soft, rgba(245,158,11,0.12))',
                    color: 'var(--color-warning, #f59e0b)',
                  }}
                >
                  Offline
                </span>
              </div>
            ) : null}

            <button
              type="button"
              onClick={handlePublish}
              disabled={busy || !username}
              className="btn btn-primary btn-lg w-full disabled:opacity-50"
            >
              {busy ? (
                <>
                  <span className="spinner spinner-white" />
                  Publicando...
                </>
              ) : (
                <>
                  <Share2 size={18} />
                  Publicar agora
                </>
              )}
            </button>
            <p className="mt-3 text-xs text-faint">
              Use o botão Prévia para revisar antes de publicar.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
