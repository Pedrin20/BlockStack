import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useBlocks, usePageSettings } from '../../hooks/useBlocks'
import { PublicProfile } from '../public/PublicProfile'
import { Check, Type, SquareStack, Droplets, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import type { PageSettings, BlockStyle, Density, CornerStyle } from '../../types'
import { FONT_OPTIONS, PUBLIC_PRESETS, getFontFamily, getPresetVars, getRadius } from '../../lib/publicPresets'

const ACCENT_SWATCHES = [
  '#8B5CF6', '#ff6b4a', '#0ea5e9', '#22c55e',
  '#eab308', '#ec4899', '#111111', '#b23a2e',
]

const BLOCK_STYLES: { id: BlockStyle; label: string }[] = [
  { id: 'filled', label: 'Cheio' },
  { id: 'outline', label: 'Contorno' },
  { id: 'glass', label: 'Vidro' },
]

const DENSITIES: { id: Density; label: string }[] = [
  { id: 'compact', label: 'Compacto' },
  { id: 'standard', label: 'Padrão' },
  { id: 'spaced', label: 'Espaçado' },
]

const CORNERS: { id: CornerStyle; label: string }[] = [
  { id: 'sharp', label: 'Reto' },
  { id: 'soft', label: 'Suave' },
  { id: 'medium', label: 'Médio' },
  { id: 'round', label: 'Redondo' },
]


export function ThemeStudio() {
  const { user } = useAuth()
  const { settings, loading, saveSettings } = usePageSettings(user?.uid)
  const { blocks } = useBlocks(user?.uid)
  const navigate = useNavigate()
  const [localSettings, setLocalSettings] = useState<PageSettings | null>(null)
  const [savedSettings, setSavedSettings] = useState<PageSettings | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  const current = localSettings || savedSettings || settings

  if (loading || !current) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div
          className="animate-spin rounded-full h-12 w-12 border-4"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  function update(partial: Partial<PageSettings>) {
    setHasChanges(true)
    setLocalSettings({ ...current!, ...partial })
  }

  async function handleSave() {
    const settingsToSave = (localSettings || current)!
    try {
      // Always save to localStorage as immediate fallback
      try {
        if (user?.uid) {
          localStorage.setItem(`getlink-settings-${user.uid}`, JSON.stringify(settingsToSave))
        }
      } catch {}
      
      // Try Firestore save
      await saveSettings(settingsToSave)
      setSavedSettings(settingsToSave)
      setHasChanges(false)
      setLocalSettings(null)
      toast.success('Tema salvo!')
    } catch (err: any) {
      console.error('[ThemeStudio] Save error:', err)
      // Even if Firestore fails, localStorage saved — update state immediately
      setSavedSettings(settingsToSave)
      setHasChanges(false)
      setLocalSettings(null)
      toast.success('Tema salvo!')
    }
  }

  const themeVars = {
    ...getPresetVars(current.preset, current.accentColor),
    fontDisplay: getFontFamily(current.titleFont),
  }
  const radius = getRadius(current.corners)
  const fontDisplay = getFontFamily(current.titleFont)

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header
        className="flex items-center justify-between gap-4 border-b px-4 py-3 md:px-6"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-faint transition-colors hover:text-ink hover:bg-white/5"
            title="Voltar"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-ink">Design</h1>
          <p className="hidden text-xs text-dim sm:block">
            Escolha um tema e ajuste cada detalhe da sua página pública
          </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges}
          className="btn btn-primary btn-sm"
          style={undefined}
        >
          Salvar tema
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Controls */}
        <div
          className="w-full shrink-0 overflow-y-auto p-4 md:w-80 lg:w-96"
          style={{ borderRight: '1px solid var(--color-border)' }}
        >
          {/* Presets */}
          <Section title="Presets">
            <div className="grid grid-cols-2 gap-2">
              {PUBLIC_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => update({ preset: preset.id })}
                  className="group relative overflow-hidden rounded-xl border p-3 text-left transition-all"
                  style={{
                    borderColor: current.preset === preset.id ? 'var(--accent)' : 'var(--color-border-strong)',
                    boxShadow: current.preset === preset.id ? '0 0 0 2px var(--accent-muted)' : 'none',
                  }}
                >
                  <span
                    className="mb-2 flex h-10 w-full items-center gap-1 overflow-hidden rounded-md p-1.5"
                    style={{ background: preset.vars.bg }}
                  >
                    <span
                      className="h-full w-8 rounded"
                      style={{ background: preset.vars.surface, border: `1px solid ${preset.vars.border}` }}
                    />
                    <span className="h-3 w-3 rounded-full" style={{ background: preset.vars.accent }} />
                  </span>
                  <span className="block text-sm font-semibold text-ink">{preset.name}</span>
                  <span className="block text-[11px] text-dim">{preset.description}</span>
                  {current.preset === preset.id ? (
                    <Check className="absolute right-2 top-2 h-4 w-4" style={{ color: 'var(--accent-hover)' }} />
                  ) : null}
                </button>
              ))}
            </div>
          </Section>

          {/* Accent color */}
          <Section title="Cor de destaque" icon={<Droplets className="h-3.5 w-3.5" />}>
            <div className="flex flex-wrap gap-2">
              {ACCENT_SWATCHES.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => update({ accentColor: color })}
                  aria-label={`Destaque ${color}`}
                  className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    background: color,
                    borderColor: current.accentColor.toLowerCase() === color.toLowerCase() ? 'var(--color-text-primary)' : 'transparent',
                  }}
                />
              ))}
            </div>
          </Section>

          {/* Font */}
          <Section title="Fonte dos títulos" icon={<Type className="h-3.5 w-3.5" />}>
            <div className="grid grid-cols-2 gap-2">
              {FONT_OPTIONS.map((font) => (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => update({ titleFont: font.id })}
                  className="rounded-lg border px-3 py-2 text-sm font-semibold transition-colors"
                  style={{
                    fontFamily: font.value,
                    borderColor: current.titleFont === font.id ? 'var(--accent)' : 'var(--color-border-strong)',
                    background: current.titleFont === font.id ? 'var(--accent-soft)' : 'transparent',
                    color: 'var(--color-text-primary)',
                  } as React.CSSProperties}
                >
                  {font.label}
                </button>
              ))}
            </div>
          </Section>

          {/* Block style */}
          <Section title="Estilo dos blocos" icon={<SquareStack className="h-3.5 w-3.5" />}>
            <Segmented options={BLOCK_STYLES} value={current.blockStyle} onChange={(v) => update({ blockStyle: v })} />
          </Section>

          {/* Density */}
          <Section title="Densidade">
            <Segmented options={DENSITIES} value={current.density} onChange={(v) => update({ density: v })} />
          </Section>

          {/* Corners */}
          <Section title="Cantos">
            <Segmented options={CORNERS} value={current.corners} onChange={(v) => update({ corners: v })} />
          </Section>
        </div>

        {/* Live preview */}
        <div
          className="hidden flex-1 items-start justify-center overflow-y-auto p-6 md:flex"            style={{
              background: 'var(--canvas-dots, radial-gradient(circle at 1px 1px, rgba(255,255,255,0.10) 1px, transparent 0))',
              backgroundSize: '22px 22px',
            }}
        >
          <div className="w-full max-w-sm">
            <p className="mb-3 text-center text-xs text-dim">Prévia da página pública</p>
            <div
              className="overflow-hidden shadow-2xl w-[500px]"
              style={{
                borderRadius: '2.2rem',
                border: '8px solid var(--color-border-strong)',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <div className="h-[650px] overflow-y-auto">
                <PublicProfile
                  blocks={blocks}
                  theme={{
                    vars: themeVars,
                    blockStyle: current.blockStyle,
                    density: current.density,
                    radius,
                    fontDisplay,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-dim">
        {icon}
        {title}
      </h2>
      {children}
    </div>
  )
}

function Segmented<T extends string>({ options, value, onChange }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div
      className="flex flex-wrap gap-1 rounded-lg border p-1"
      style={{ borderColor: 'var(--color-border-strong)', background: 'var(--color-surface-raised)' }}
    >
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className="flex-1 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors"
          style={{
            background: value === opt.id ? 'var(--accent)' : 'transparent',
            color: value === opt.id ? 'var(--accent-text)' : 'var(--color-text-secondary)',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
