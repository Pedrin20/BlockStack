import type { Block, BlockSchedule, SubstituteContent } from '../types'

/* ═══════════════════════════════════════════════════════════════
   BLOCK SCHEDULE — janela de publicação e expiração
   ═══════════════════════════════════════════════════════════════ */

export type BlockStatus = 'none' | 'scheduled' | 'active' | 'expired'

export type ResolvedBlockMode = 'normal' | 'redirect' | 'substitute'

export interface ResolvedBlock {
  /** Chave estável para o React (id de origem ou marcador de substituto) */
  key: string
  /** Bloco a renderizar (no modo redirect é o próprio bloco expirado) */
  block: Block
  mode: ResolvedBlockMode
  /** Só no modo redirect: URL efetiva que o clique deve abrir */
  clickUrl?: string
  /** Só no modo substitute: conteúdo configurado no painel */
  substitute?: SubstituteContent
}

/** Converte Timestamp / string ISO / Date em epoch ms, de forma defensiva. */
function tsToMs(value: unknown): number | null {
  if (value == null) return null
  const maybe = value as { toDate?: () => Date }
  if (typeof maybe.toDate === 'function') {
    const t = maybe.toDate().getTime()
    return Number.isFinite(t) ? t : null
  }
  if (typeof value === 'string' && value) {
    const t = new Date(value).getTime()
    return Number.isFinite(t) ? t : null
  }
  if (value instanceof Date) {
    const t = value.getTime()
    return Number.isFinite(t) ? t : null
  }
  return null
}

export function normalizeUrl(url: string): string {
  if (!url) return url
  return url.startsWith('http') ? url : `https://${url}`
}

interface ScheduleHolder {
  schedule?: unknown
}

export function getBlockSchedule(block: Block): BlockSchedule | null {
  const schedule = (block.data as unknown as ScheduleHolder).schedule
  return schedule && typeof schedule === 'object' ? (schedule as BlockSchedule) : null
}

export function getBlockStatus(block: Block, now: number): BlockStatus {
  const schedule = getBlockSchedule(block)
  if (!schedule) return 'none'

  const start = tsToMs(schedule.startsAt)
  const end = tsToMs(schedule.expiresAt)

  if (start !== null && now < start) return 'scheduled'
  if (end !== null && now >= end) return 'expired'
  return 'active'
}

/** URL primária de um bloco (link → url, produto → linkUrl, serviço → actionUrl). */
export function getBlockPrimaryUrl(block: Block): string | null {
  const d = block.data as unknown as { url?: unknown; linkUrl?: unknown; actionUrl?: unknown }
  const url = d.url ?? d.linkUrl ?? d.actionUrl
  return typeof url === 'string' && url ? url : null
}

function resolveRedirectTarget(
  targetId: string | null | undefined,
  byId: Map<string, Block>,
  now: number,
  seen: Set<string>,
): Block | null {
  if (!targetId || seen.has(targetId)) return null
  seen.add(targetId)

  const target = byId.get(targetId)
  if (!target) return null

  const status = getBlockStatus(target, now)
  if (status === 'none' || status === 'active') return target
  if (status === 'scheduled') return null

  // Alvo também expirado: só é válido se ele mesmo redireciona (cadeia, com guarda de ciclos)
  const schedule = getBlockSchedule(target)
  if (schedule?.afterExpiry === 'redirect') {
    return resolveRedirectTarget(schedule.redirectBlockId, byId, now, seen)
  }
  return null
}

/**
 * Resolve a lista final de blocos para a página pública aplicando a janela
 * de publicação: oculto antes do início; após a expiração, esconder,
 * redirecionar o clique para outro bloco ou mostrar um substituto.
 */
export function resolvePublicBlocks(blocks: Block[], now: number): ResolvedBlock[] {
  const byId = new Map(blocks.map((b) => [b.id, b]))
  const resolved: ResolvedBlock[] = []

  for (const block of blocks) {
    const status = getBlockStatus(block, now)

    if (status === 'scheduled') continue

    if (status === 'none' || status === 'active') {
      resolved.push({ key: block.id, block, mode: 'normal' })
      continue
    }

    // status === 'expired'
    const schedule = getBlockSchedule(block)
    const behavior = schedule?.afterExpiry || 'hide'

    if (behavior === 'hide') continue

    if (behavior === 'redirect') {
      const target = resolveRedirectTarget(schedule?.redirectBlockId, byId, now, new Set([block.id]))
      if (!target) continue
      const url = getBlockPrimaryUrl(target)
      if (!url) continue
      resolved.push({
        key: `${block.id}->redirect`,
        block,
        mode: 'redirect',
        clickUrl: normalizeUrl(url),
      })
      continue
    }

    // behavior === 'replace'
    resolved.push({
      key: `${block.id}->substitute`,
      block,
      mode: 'substitute',
      substitute: schedule?.substitute,
    })
  }

  return resolved
}