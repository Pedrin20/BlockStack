import { Timestamp } from 'firebase/firestore'
import {
  type Block,
  type BlockSize,
  type AfterExpiryBehavior,
  type BlockSchedule,
  type SubstituteContent,
  type SmartVariation,
  type TrafficSource,
  BLOCK_LIBRARY,
  SIZE_LABELS,
  TRAFFIC_SOURCE_LABELS,
} from '../../types'
import { Trash2, MousePointerClick, CalendarClock, Sparkles } from 'lucide-react'

const inputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-background-elevated)',
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  color: 'var(--color-text-primary)',
  outline: 'none',
}

const focusStyle =
  'focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]'

export function PropertiesPanel({
  block,
  blocks,
  onChange,
  onDelete,
}: {
  block: Block | null
  blocks: Block[]
  onChange: (patch: Partial<Block>) => void
  onDelete: () => void
}) {
  if (!block) {
    return (
      <aside className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: 'var(--color-surface-hover)', color: 'var(--color-text-secondary)' }}
        >
          <MousePointerClick className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-medium text-ink">Nenhum bloco selecionado</p>
          <p className="mt-1 text-xs text-dim">
            Clique em um bloco do canvas para editar suas propriedades
          </p>
        </div>
      </aside>
    )
  }

  const def = BLOCK_LIBRARY.find((d) => d.type === block.type)
  const allowedSizes = def?.allowedSizes ?? ['1x1', '2x1', '2x2', 'full']
  const d = block.data as any

  function updateData(field: string, value: any) {
    onChange({ data: { ...d, [field]: value } } as any)
  }

  return (
    <aside className="flex h-full w-full flex-col gap-5 overflow-y-auto p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ink">Propriedades</h2>
          <p className="mt-0.5 text-xs capitalize text-dim">{def?.label}</p>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="flex h-8 w-8 items-center justify-center rounded-lg border text-dim transition-colors hover:text-[var(--color-error)]"
          style={{ borderColor: 'var(--color-border-strong)' }}
          aria-label="Excluir bloco"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Title field */}
      <Field label="Título">
        <input
          value={d.displayName || d.title || d.content || ''}
          onChange={(e) => {
            if (block.type === 'header') updateData('displayName', e.target.value)
            else if (block.type === 'text') updateData('content', e.target.value)
            else updateData('title', e.target.value)
          }}
          className={`w-full rounded-lg px-3 py-2 text-sm text-ink outline-none transition-colors ${focusStyle}`}
          style={{ ...inputStyle, borderColor: 'var(--color-border)', background: 'var(--color-background-elevated)' }}
        />
      </Field>

      {/* Subtitle field */}
      {['header', 'product', 'service', 'newsletter'].includes(block.type) ? (
        <Field label="Subtítulo">
          <textarea
            value={d.bio || d.description || ''}
            onChange={(e) => {
              if (block.type === 'header') updateData('bio', e.target.value)
              else updateData('description', e.target.value)
            }}
            rows={3}
            className={`w-full resize-none rounded-lg px-3 py-2 text-sm text-ink outline-none transition-colors ${focusStyle}`}
            style={{ ...inputStyle, borderColor: 'var(--color-border)', background: 'var(--color-background-elevated)' }}
          />
        </Field>
      ) : null}

      {/* URL / Price / Action label */}
      {block.type === 'link' ? (
        <Field label="URL">
          <input
            value={d.url || ''}
            onChange={(e) => updateData('url', e.target.value)}
            className={`w-full rounded-lg px-3 py-2 text-sm text-ink outline-none transition-colors ${focusStyle}`}
            style={{ ...inputStyle, borderColor: 'var(--color-border)', background: 'var(--color-background-elevated)' }}
            placeholder="https://"
          />
        </Field>
      ) : null}

      {block.type === 'product' ? (
        <>
          <Field label="Preço">
            <input
              value={d.price || ''}
              onChange={(e) => updateData('price', e.target.value)}
              className={`w-full rounded-lg px-3 py-2 text-sm text-ink outline-none transition-colors ${focusStyle}`}
              style={{ ...inputStyle, borderColor: 'var(--color-border)', background: 'var(--color-background-elevated)' }}
              placeholder="297"
            />
          </Field>
          <Field label="Link de compra">
            <input
              value={d.linkUrl || ''}
              onChange={(e) => updateData('linkUrl', e.target.value)}
              className={`w-full rounded-lg px-3 py-2 text-sm text-ink outline-none transition-colors ${focusStyle}`}
              style={{ ...inputStyle, borderColor: 'var(--color-border)', background: 'var(--color-background-elevated)' }}
              placeholder="https://"
            />
          </Field>
        </>
      ) : null}

      {block.type === 'service' ? (
        <Field label="Rótulo do botão">
          <input
            value={d.actionLabel || ''}
            onChange={(e) => updateData('actionLabel', e.target.value)}
            className={`w-full rounded-lg px-3 py-2 text-sm text-ink outline-none transition-colors ${focusStyle}`}
            style={{ ...inputStyle, borderColor: 'var(--color-border)', background: 'var(--color-background-elevated)' }}
            placeholder="Agendar"
          />
        </Field>
      ) : null}

      {block.type === 'video' ? (
        <Field label="URL de embed">
          <input
            value={d.embedUrl || ''}
            onChange={(e) => updateData('embedUrl', e.target.value)}
            className={`w-full rounded-lg px-3 py-2 text-sm text-ink outline-none transition-colors ${focusStyle}`}
            style={{ ...inputStyle, borderColor: 'var(--color-border)', background: 'var(--color-background-elevated)' }}
            placeholder="https://www.youtube.com/embed/..."
          />
        </Field>
      ) : null}

      {/* Scheduling — apenas blocos link / produto / serviço */}
      {['link', 'product', 'service'].includes(block.type) ? (
        <ScheduleSection
          schedule={d.schedule}
          blocks={blocks}
          currentBlockId={block.id}
          onChange={(schedule) => updateData('schedule', schedule)}
        />
      ) : null}

      {/* Smart Block — variação por origem (apenas link / produto / serviço) */}
      {['link', 'product', 'service'].includes(block.type) ? (
        <SmartSection
          smart={d.smart}
          blockType={block.type}
          onChange={(smart) => updateData('smart', smart)}
        />
      ) : null}

      {/* Size selector */}
      <Field label="Tamanho">
        <div className="grid grid-cols-2 gap-2">
          {(['1x1', '2x1', '2x2', 'full'] as BlockSize[]).map((size) => {
            const disabled = !allowedSizes.includes(size)
            const active = block.size === size
            return (
              <button
                key={size}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ size })}
                className={`flex flex-col items-center gap-1.5 rounded-lg border p-2.5 text-xs font-medium transition-all ${
                  disabled
                    ? 'cursor-not-allowed opacity-30'
                    : active
                      ? 'text-ink'
                      : 'text-dim hover:text-ink'
                }`}
                style={{
                  borderColor: active ? 'var(--accent)' : 'var(--color-border-strong)',
                  background: active ? 'var(--accent-soft)' : 'transparent',
                }}
              >
                <SizeGlyph size={size} active={active} />
                {SIZE_LABELS[size]}
              </button>
            )
          })}
        </div>
      </Field>
    </aside>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-dim">{label}</span>
      {children}
    </label>
  )
}

function SizeGlyph({ size, active }: { size: BlockSize; active: boolean }) {
  const cls = active ? 'bg-[var(--accent)]' : 'bg-[var(--color-surface-hover)]'
  const map: Record<BlockSize, React.ReactNode> = {
    '1x1': <span className={`h-4 w-4 rounded-sm ${cls}`} />,
    '2x1': <span className={`h-3 w-7 rounded-sm ${cls}`} />,
    '2x2': <span className={`h-6 w-7 rounded-sm ${cls}`} />,
    'full': <span className={`h-2.5 w-8 rounded-sm ${cls}`} />,
  }
  return <span className="flex h-6 items-center justify-center">{map[size]}</span>
}

/* ═══════════════════════════════════════════════════════════════
   SEÇÃO DE AGENDAMENTO (link / produto / serviço)
   ═══════════════════════════════════════════════════════════════ */

function toMs(ts: unknown): number | null {
  if (!ts) return null
  const maybe = ts as { toDate?: () => Date }
  const d = typeof maybe.toDate === 'function' ? maybe.toDate() : new Date(ts as string)
  return Number.isFinite(d.getTime()) ? d.getTime() : null
}

function toLocalInputValue(ts?: unknown): string {
  const ms = toMs(ts)
  if (ms === null) return ''
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromLocalInputValue(value: string): Timestamp | null {
  if (!value) return null
  const t = new Date(value)
  return Number.isFinite(t.getTime()) ? Timestamp.fromDate(t) : null
}

/** Atualiza um campo do substituto preservando os demais (monta o objeto completo). */
function patchSubstitute(schedule: BlockSchedule, patch: Partial<SubstituteContent>): BlockSchedule {
  return {
    ...schedule,
    substitute: {
      title: schedule.substitute?.title ?? '',
      description: schedule.substitute?.description ?? '',
      buttonLabel: schedule.substitute?.buttonLabel ?? '',
      buttonUrl: schedule.substitute?.buttonUrl ?? '',
      ...patch,
    },
  }
}

function blockLabel(block: Block): string {
  const d = block.data as any
  return (
    d.title ||
    d.displayName ||
    d.content?.slice(0, 30) ||
    BLOCK_LIBRARY.find((x) => x.type === block.type)?.label ||
    block.type
  )
}

function ScheduleSection({
  schedule,
  blocks,
  currentBlockId,
  onChange,
}: {
  schedule?: BlockSchedule | null
  blocks: Block[]
  currentBlockId: string
  onChange: (schedule: BlockSchedule | null) => void
}) {
  const enabled = Boolean(schedule)
  const otherBlocks = blocks.filter((b) => b.id !== currentBlockId)
  const startMs = toMs(schedule?.startsAt)
  const endMs = toMs(schedule?.expiresAt)
  const invalidWindow = startMs !== null && endMs !== null && endMs <= startMs

  return (
    <Field label="Agendamento">
      <label className="flex cursor-pointer items-center gap-2 select-none">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onChange(e.target.checked ? { afterExpiry: 'hide' } : null)}
          className="h-4 w-4 rounded accent-[var(--accent)]"
        />
        <span className="flex items-center gap-1.5 text-xs font-medium text-dim">
          <CalendarClock className="h-3.5 w-3.5" />
          Agendar publicação (início e expiração)
        </span>
      </label>

      {enabled && schedule ? (
        <div
          className="flex flex-col gap-3 rounded-lg border p-3"
          style={{ borderColor: 'var(--color-border-strong)' }}
        >
          <Field label="Início da publicação">
            <input
              type="datetime-local"
              value={toLocalInputValue(schedule.startsAt)}
              onChange={(e) =>
                onChange({ ...schedule, startsAt: fromLocalInputValue(e.target.value) })
              }
              className={`w-full rounded-lg px-3 py-2 text-sm text-ink outline-none transition-colors ${focusStyle}`}
              style={inputStyle}
            />
          </Field>

          <Field label="Expira em">
            <input
              type="datetime-local"
              value={toLocalInputValue(schedule.expiresAt)}
              onChange={(e) =>
                onChange({ ...schedule, expiresAt: fromLocalInputValue(e.target.value) })
              }
              className={`w-full rounded-lg px-3 py-2 text-sm text-ink outline-none transition-colors ${focusStyle}`}
              style={inputStyle}
            />
          </Field>

          {invalidWindow ? (
            <p className="text-xs" style={{ color: 'var(--color-error)' }}>
              A data de expiração deve ser depois do início da publicação.
            </p>
          ) : null}

          <Field label="Após expirar">
            <select
              value={schedule.afterExpiry || 'hide'}
              onChange={(e) =>
                onChange({ ...schedule, afterExpiry: e.target.value as AfterExpiryBehavior })
              }
              className={`w-full rounded-lg px-3 py-2 text-sm text-ink outline-none transition-colors ${focusStyle}`}
              style={inputStyle}
            >
              <option value="hide">Esconder</option>
              <option value="redirect">Redirecionar para outro bloco</option>
              <option value="replace">Mostrar bloco substituto</option>
            </select>
          </Field>

          {schedule.afterExpiry === 'redirect' ? (
            <Field label="Bloco de destino">
              {otherBlocks.length > 0 ? (
                <select
                  value={schedule.redirectBlockId || ''}
                  onChange={(e) =>
                    onChange({ ...schedule, redirectBlockId: e.target.value || null })
                  }
                  className={`w-full rounded-lg px-3 py-2 text-sm text-ink outline-none transition-colors ${focusStyle}`}
                  style={inputStyle}
                >
                  <option value="">Selecione um bloco...</option>
                  {otherBlocks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {blockLabel(b)}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-faint">
                  Adicione outro bloco para poder redirecionar.
                </p>
              )}
            </Field>
          ) : null}

          {schedule.afterExpiry === 'replace' ? (
            <>
              <Field label="Título do substituto">
                <input
                  value={schedule.substitute?.title || ''}
                  onChange={(e) =>
                    onChange(patchSubstitute(schedule, { title: e.target.value }))
                  }
                  className={`w-full rounded-lg px-3 py-2 text-sm text-ink outline-none transition-colors ${focusStyle}`}
                  style={inputStyle}
                  placeholder="Oferta encerrada"
                />
              </Field>
              <Field label="Descrição do substituto">
                <textarea
                  value={schedule.substitute?.description || ''}
                  onChange={(e) =>
                    onChange(patchSubstitute(schedule, { description: e.target.value }))
                  }
                  rows={2}
                  className={`w-full resize-none rounded-lg px-3 py-2 text-sm text-ink outline-none transition-colors ${focusStyle}`}
                  style={inputStyle}
                  placeholder="Este produto não está mais disponível..."
                />
              </Field>
              <Field label="Rótulo do botão (opcional)">
                <input
                  value={schedule.substitute?.buttonLabel || ''}
                  onChange={(e) =>
                    onChange(patchSubstitute(schedule, { buttonLabel: e.target.value }))
                  }
                  className={`w-full rounded-lg px-3 py-2 text-sm text-ink outline-none transition-colors ${focusStyle}`}
                  style={inputStyle}
                  placeholder="Ver novidades"
                />
              </Field>
              <Field label="URL do botão (opcional)">
                <input
                  value={schedule.substitute?.buttonUrl || ''}
                  onChange={(e) =>
                    onChange(patchSubstitute(schedule, { buttonUrl: e.target.value }))
                  }
                  className={`w-full rounded-lg px-3 py-2 text-sm text-ink outline-none transition-colors ${focusStyle}`}
                  style={inputStyle}
                  placeholder="https://"
                />
              </Field>
            </>
          ) : null}
        </div>
      ) : null}
    </Field>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SEÇÃO SMART BLOCK (link / produto / serviço)
   ═══════════════════════════════════════════════════════════════ */

/** Atualiza um campo da variação preservando os demais (monta o objeto completo). */
function patchSmart(smart: SmartVariation, patch: Partial<SmartVariation>): SmartVariation {
  return {
    source: smart.source,
    title: smart.title ?? '',
    description: smart.description ?? '',
    url: smart.url ?? '',
    price: smart.price ?? '',
    imageUrl: smart.imageUrl ?? '',
    actionLabel: smart.actionLabel ?? '',
    ...patch,
  }
}

function SmartSection({
  smart,
  blockType,
  onChange,
}: {
  smart?: SmartVariation | null
  blockType: Block['type']
  onChange: (smart: SmartVariation | null) => void
}) {
  const enabled = Boolean(smart)

  const destLabel =
    blockType === 'link'
      ? 'URL alternativa'
      : blockType === 'product'
        ? 'Link de compra alternativo'
        : 'URL da ação alternativa'

  return (
    <Field label="Smart Block">
      <label className="flex cursor-pointer items-center gap-2 select-none">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onChange(e.target.checked ? { source: 'instagram' } : null)}
          className="h-4 w-4 rounded accent-[var(--accent)]"
        />
        <span className="flex items-center gap-1.5 text-xs font-medium text-dim">
          <Sparkles className="h-3.5 w-3.5" />
          Variação por origem
        </span>
      </label>

      {enabled && smart ? (
        <div
          className="flex flex-col gap-3 rounded-lg border p-3"
          style={{ borderColor: 'var(--color-border-strong)' }}
        >
          <Field label="Se veio de">
            <select
              value={smart.source}
              onChange={(e) =>
                onChange({ ...smart, source: e.target.value as TrafficSource })
              }
              className={`w-full rounded-lg px-3 py-2 text-sm text-ink outline-none transition-colors ${focusStyle}`}
              style={inputStyle}
            >
              {Object.entries(TRAFFIC_SOURCE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Título alternativo">
            <input
              value={smart.title || ''}
              onChange={(e) =>
                onChange(patchSmart(smart, { title: e.target.value }))
              }
              className={`w-full rounded-lg px-3 py-2 text-sm text-ink outline-none transition-colors ${focusStyle}`}
              style={inputStyle}
              placeholder="Deixe vazio para manter o original"
            />
          </Field>

          <Field label="Descrição alternativa">
            <textarea
              value={smart.description || ''}
              onChange={(e) =>
                onChange(patchSmart(smart, { description: e.target.value }))
              }
              rows={2}
              className={`w-full resize-none rounded-lg px-3 py-2 text-sm text-ink outline-none transition-colors ${focusStyle}`}
              style={inputStyle}
              placeholder="Deixe vazio para manter o original"
            />
          </Field>

          <Field label={destLabel}>
            <input
              value={smart.url || ''}
              onChange={(e) =>
                onChange(patchSmart(smart, { url: e.target.value }))
              }
              className={`w-full rounded-lg px-3 py-2 text-sm text-ink outline-none transition-colors ${focusStyle}`}
              style={inputStyle}
              placeholder="https://"
            />
          </Field>

          {blockType === 'product' ? (
            <Field label="Preço alternativo">
              <input
                value={smart.price || ''}
                onChange={(e) =>
                  onChange(patchSmart(smart, { price: e.target.value }))
                }
                className={`w-full rounded-lg px-3 py-2 text-sm text-ink outline-none transition-colors ${focusStyle}`}
                style={inputStyle}
                placeholder="Deixe vazio para manter o original"
              />
            </Field>
          ) : null}

          {blockType === 'service' ? (
            <Field label="Rótulo do botão alternativo">
              <input
                value={smart.actionLabel || ''}
                onChange={(e) =>
                  onChange(patchSmart(smart, { actionLabel: e.target.value }))
                }
                className={`w-full rounded-lg px-3 py-2 text-sm text-ink outline-none transition-colors ${focusStyle}`}
                style={inputStyle}
                placeholder="Deixe vazio para manter o original"
              />
            </Field>
          ) : null}

          <p className="text-xs text-faint">
            Se veio de{' '}
            <span className="font-medium text-dim">
              {TRAFFIC_SOURCE_LABELS[smart.source]}
            </span>{' '}
            → mostrar este conteúdo
          </p>
        </div>
      ) : null}
    </Field>
  )
}
