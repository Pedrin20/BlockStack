import type { CornerStyle, DesignPreset, TitleFont } from '../types'

/* ═══════════════════════════════════════════════════════════════
   PRESETS DA PÁGINA PÚBLICA — fonte única de verdade
   Consumidos pela tela Design (ThemeStudio) e pela renderização
   pública (pages/PublicProfile + components/public/PublicProfile).
   O usuário pode sobrescrever o accent de cada preset na tela Design.
   ═══════════════════════════════════════════════════════════════ */

export interface PublicPresetVars {
  bg: string
  surface: string
  border: string
  text: string
  muted: string
  accent: string
  accentText: string
}

export interface PublicPreset {
  id: DesignPreset
  name: string
  description: string
  vars: PublicPresetVars
}

export const PUBLIC_PRESETS: PublicPreset[] = [
  {
    id: 'neon',
    name: 'Neon',
    description: 'Escuro, vibrante, vidro',
    vars: {
      bg: 'linear-gradient(160deg, #1a1533 0%, #14111f 55%, #0f0d18 100%)',
      surface: 'rgba(255,255,255,0.06)',
      border: 'rgba(255,255,255,0.12)',
      text: '#f5f3ff',
      muted: 'rgba(245,243,255,0.6)',
      accent: '#8B5CF6',
      accentText: '#ffffff',
    },
  },
  {
    id: 'editorial',
    name: 'Editorial',
    description: 'Claro, serifado, revista',
    vars: {
      bg: '#f7f4ee',
      surface: '#fffdf9',
      border: '#e4ddcf',
      text: '#1c1a17',
      muted: '#6b6459',
      accent: '#b23a2e',
      accentText: '#fffdf9',
    },
  },
  {
    id: 'minimal-mono',
    name: 'Minimal Mono',
    description: 'Branco, monoespaçado, seco',
    vars: {
      bg: '#ffffff',
      surface: '#ffffff',
      border: '#e2e2e2',
      text: '#111111',
      muted: '#7a7a7a',
      accent: '#111111',
      accentText: '#ffffff',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Gradiente quente, cheio',
    vars: {
      bg: 'linear-gradient(165deg, #ff8a3d 0%, #ff5e7e 55%, #b5468f 100%)',
      surface: 'rgba(255,255,255,0.16)',
      border: 'rgba(255,255,255,0.28)',
      text: '#ffffff',
      muted: 'rgba(255,255,255,0.82)',
      accent: '#ffffff',
      accentText: '#c0396f',
    },
  },
  {
    id: 'brutalist',
    name: 'Brutalist',
    description: 'Duro, contrastado, ousado',
    vars: {
      bg: '#ffdd33',
      surface: '#ffffff',
      border: '#111111',
      text: '#111111',
      muted: '#444444',
      accent: '#111111',
      accentText: '#ffdd33',
    },
  },
]

export const FONT_OPTIONS: { id: TitleFont; label: string; value: string }[] = [
  { id: 'grotesk', label: 'Grotesk', value: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif" },
  { id: 'sans', label: 'Sans', value: "'Inter', ui-sans-serif, system-ui, sans-serif" },
  { id: 'serifada', label: 'Serifada', value: "Georgia, 'Times New Roman', serif" },
  { id: 'mono', label: 'Mono', value: "ui-monospace, 'SF Mono', monospace" },
]

export const FONT_MAP: Record<TitleFont, string> = Object.fromEntries(
  FONT_OPTIONS.map((f) => [f.id, f.value]),
) as Record<TitleFont, string>

export const RADIUS_MAP: Record<CornerStyle, string> = {
  sharp: '0rem',
  soft: '0.5rem',
  medium: '1.1rem',
  round: '1.6rem',
}

/** Vars completas do preset com o accent escolhido pelo usuário. */
export function getPresetVars(presetId: DesignPreset, accentColor?: string): PublicPresetVars {
  const preset = PUBLIC_PRESETS.find((p) => p.id === presetId) || PUBLIC_PRESETS[0]
  return {
    ...preset.vars,
    accent: accentColor && accentColor.trim() !== '' ? accentColor : preset.vars.accent,
  }
}

/** Família tipográfica a partir do id salvo nas settings. */
export function getFontFamily(fontId?: string): string {
  return (fontId && FONT_MAP[fontId as TitleFont]) || FONT_MAP.grotesk
}

/** Radius a partir do estilo de canto salvo nas settings. */
export function getRadius(corner?: string): string {
  return (corner && RADIUS_MAP[corner as CornerStyle]) || RADIUS_MAP.medium
}
