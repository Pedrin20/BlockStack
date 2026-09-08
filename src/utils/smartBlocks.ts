import type { Block, SmartVariation, TrafficSource } from '../types'

/* ═══════════════════════════════════════════════════════════════
   SMART BLOCKS — variação de conteúdo por origem do tráfego
   ═══════════════════════════════════════════════════════════════ */

interface SmartHolder {
  smart?: unknown
}

/** Lê a configuração `smart` do bloco de forma defensiva. */
function getSmartVariation(block: Block): SmartVariation | null {
  const smart = (block.data as unknown as SmartHolder).smart
  if (!smart || typeof smart !== 'object') return null
  const variation = smart as SmartVariation
  if (!variation.source) return null
  return variation
}

export function hasSmartVariation(block: Block): boolean {
  return getSmartVariation(block) !== null
}

/** Mapeia um valor (utm_source ou host do referrer) para uma origem conhecida. */
function matchSource(value: string): TrafficSource | null {
  if (value.includes('instagram')) return 'instagram'
  if (value.includes('youtube') || value.includes('youtu.be')) return 'youtube'
  if (value.includes('linkedin')) return 'linkedin'
  if (value.includes('google')) return 'google'
  if (value) return 'other'
  return null
}

/**
 * Detecta a origem do visitante: o parâmetro `utm_source` tem prioridade;
 * sem UTM, usa o host do `document.referrer`. Sem nenhum dos dois → null
 * (o que significa conteúdo padrão, sem variação).
 */
export function getTrafficSource(): TrafficSource | null {
  if (typeof window === 'undefined') return null

  try {
    const utm = new URLSearchParams(window.location.search).get('utm_source')
    if (utm) return matchSource(utm.toLowerCase())
  } catch {
    // URL inválida — segue para o referrer
  }

  const referrer = document.referrer
  if (!referrer) return null
  try {
    const host = new URL(referrer).hostname.toLowerCase()
    return matchSource(host)
  } catch {
    return null
  }
}

/** String vazia = campo não preenchido (não substitui o conteúdo original). */
function fieldValue(value: string | undefined): string | undefined {
  return value === '' ? undefined : value
}

/**
 * Aplica a variação de conteúdo de um bloco com base na origem detectada.
 * Retorna o próprio bloco quando não há configuração, a origem não casa ou
 * nenhum campo foi preenchido.
 */
export function applySmartVariation(block: Block, source: TrafficSource | null): Block {
  if (!source) return block
  const smart = getSmartVariation(block)
  if (!smart || smart.source !== source) return block

  const title = fieldValue(smart.title)
  const description = fieldValue(smart.description)
  const url = fieldValue(smart.url)
  const overrides: Record<string, string> = {}

  if (block.type === 'link') {
    if (title) overrides.title = title
    if (description) overrides.description = description
    if (url) overrides.url = url
  } else if (block.type === 'product') {
    if (title) overrides.title = title
    if (description) overrides.description = description
    if (url) overrides.linkUrl = url
    const price = fieldValue(smart.price)
    if (price) overrides.price = price
    const imageUrl = fieldValue(smart.imageUrl)
    if (imageUrl) overrides.imageUrl = imageUrl
  } else if (block.type === 'service') {
    if (title) overrides.title = title
    if (description) overrides.description = description
    if (url) overrides.actionUrl = url
    const actionLabel = fieldValue(smart.actionLabel)
    if (actionLabel) overrides.actionLabel = actionLabel
  }

  if (Object.keys(overrides).length === 0) return block

  const data = block.data as unknown as Record<string, unknown>
  return { ...block, data: { ...data, ...overrides } } as unknown as Block
}