import { useState } from 'react'
import { X, Monitor, Smartphone, Sparkles } from 'lucide-react'
import type { Block, PageSettings } from '../../types'
import { DEFAULT_PAGE_SETTINGS } from '../../types'
import { PublicProfile } from '../public/PublicProfile'
import { getFontFamily, getPresetVars, getRadius } from '../../lib/publicPresets'

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

type Props = {
  isOpen: boolean
  onClose: () => void
  blocks: Block[]
  settings: PageSettings | null
  username?: string
}

/**
 * Prévia in-app da página pública — renderiza exatamente o que o visitante vê,
 * sem navegar para a rota pública e sem contar analytics.
 */
export function PreviewModal({ isOpen, onClose, blocks, settings, username }: Props) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('mobile')

  if (!isOpen) return null

  const current = settings || DEFAULT_PAGE_SETTINGS
  const theme = {
    vars: {
      ...getPresetVars(current.preset, current.accentColor),
      fontDisplay: getFontFamily(current.titleFont),
    },
    blockStyle: current.blockStyle,
    density: current.density,
    radius: getRadius(current.corners),
    fontDisplay: getFontFamily(current.titleFont),
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/70 backdrop-blur-sm animate-fade-in">
      {/* Barra superior */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2 text-white">
          <Sparkles className="h-4 w-4 shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              Prévia da página pública
            </p>
            <p className="truncate text-xs text-white/60">
              {username ? `${window.location.host}/${username}` : 'Esta é uma prévia local — ninguém mais tem acesso'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setDevice('desktop')}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                device === 'desktop' ? 'bg-white text-black' : 'text-white/70 hover:text-white',
              )}
              aria-label="Prévia desktop"
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setDevice('mobile')}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                device === 'mobile' ? 'bg-white text-black' : 'text-white/70 hover:text-white',
              )}
              aria-label="Prévia mobile"
            >
              <Smartphone className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Fechar prévia"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Quadro do dispositivo */}
      <div className="flex flex-1 items-start justify-center overflow-y-auto p-4 md:p-8">
        <div
          className={cn(
            'overflow-hidden bg-black transition-all duration-300',
            device === 'mobile'
              ? 'h-[78vh] w-full max-w-sm rounded-[2.2rem] border-[6px] border-white/15 shadow-2xl'
              : 'h-[82vh] w-full max-w-3xl rounded-xl border border-white/15 shadow-2xl',
          )}
        >
          <div className="h-full overflow-y-auto">
            <PublicProfile blocks={blocks} theme={theme} preview />
          </div>
        </div>
      </div>
    </div>
  )
}
