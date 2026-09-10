import { QRCodeCanvas } from 'qrcode.react'
import { X, Download } from 'lucide-react'
import { useRef } from 'react'

type Props = {
    isOpen: boolean
    onClose: () => void
    url: string
    username: string
}

export function QRCodeModal ({ isOpen, onClose, url, username }: Props) {
    const qrRef = useRef<HTMLDivElement>(null)

    if (!isOpen) return null

    const downloadQR = () => {
        const canvas = qrRef.current?.querySelector('canvas')
        if (canvas) {
            const link = document.createElement('a')
            link.download = `qrcode-${username}.png`
            link.href = canvas.toDataURL('image/png')
            link.click()
        }
    }


return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div
        className="rounded-[var(--radius-2xl)] p-6 max-w-sm w-full relative animate-slide-up"
        style={{
          background: 'var(--color-background-elevated)',
          border: '1px solid var(--color-border-strong)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        <button
          onClick={onClose}
          className="btn btn-ghost btn-sm absolute top-4 right-4 p-2"
        >
          <X size={20} />
        </button>

        <div className="text-center">
          <h3 className="text-xl font-bold text-ink mb-2">
            QR Code do seu perfil
          </h3>
          <p className="text-sm text-dim mb-6">
            Escaneie com a câmera do celular para acessar seu perfil
          </p>

          <div
            ref={qrRef}
            className="bg-white p-4 rounded-xl inline-block border border-[var(--color-border)] shadow-[var(--shadow-md)]"
          >
            <QRCodeCanvas
              value={url}
              size={200}
              bgColor="#ffffff"
              fgColor="#111827"
              level="H"
              includeMargin
            />
          </div>

          <p className="text-xs text-faint mt-4 break-all">
            {url}
          </p>

          <div className="flex flex-col gap-2 mt-6">
            <button
              onClick={downloadQR}
              className="btn btn-primary btn-md w-full"
            >
              <Download size={18} />
              Baixar QR Code
            </button>

            <button
              onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`Meu perfil no BlockStack: ${url}`)}`)}
              className="btn btn-secondary btn-md w-full"
            >
              Compartilhar no WhatsApp!
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
