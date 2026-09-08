import { Timestamp } from 'firebase/firestore'
import {
  type Block,
  type BlockSize,
  type AfterExpiryBehavior,
  type BlockSchedule,
  type SubstituteContent,
  BLOCK_LIBRARY,
  SIZE_LABELS,
} from '../../types'
import { Trash2, MousePointerClick, CalendarClock } from 'lucide-react'

const inputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: '0.5rem',
  border: '1px solid oklch(1 0 0 / 12%)',
  background: 'oklch(0.145 0 0)',
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  color: 'white',
  outline: 'none',
}

const focusStyle =
  'focus:border-[oklch(0.58_0.24_285)] focus:ring-2 focus:ring-[oklch(0.58_0.24_285_/_0.3)]'

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
          style={{ background: 'oklch(0.26 0.02 285)', color: 'oklch(0.68 0.02 285)' }}
        >
          <MousePointerClick className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-medium text-white">Nenhum bloco selecionado</p>
          <p className="mt-1 text-xs text-gray-400">
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
          <h2 className="text-sm font-semibold text-white">Propriedades</h2>
          <p className="mt-0.5 text-xs capitalize text-gray-400">{def?.label}</p>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="flex h-8 w-8 items-center justify-center rounded-lg border text-gray-400 transition-colors hover:text-red-400"
          style={{ borderColor: 'oklch(1 0 0 / 12%)' }}
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
          className={`w-full rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors ${focusStyle}`}
          style={{ ...inputStyle, borderColor: 'oklch(1 0 0 / 12%)', background: 'oklch(0.145 0 0)' }}
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
            className={`w-full resize-none rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors ${focusStyle}`}
            style={{ ...inputStyle, borderColor: 'oklch(1 0 0 / 12%)', background: 'oklch(0.145 0 0)' }}
          />
        </Field>
      ) : null}

      {/* URL / Price / Action label */}
      {block.type === 'link' ? (
        <Field label="URL">
          <input
            value={d.url || ''}
            onChange={(e) => updateData('url', e.target.value)}
            className={`w-full rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors ${focusStyle}`}
            style={{ ...inputStyle, borderColor: 'oklch(1 0 0 / 12%)', background: 'oklch(0.145 0 0)' }}
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
              className={`w-full rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors ${focusStyle}`}
              style={{ ...inputStyle, borderColor: 'oklch(1 0 0 / 12%)', background: 'oklch(0.145 0 0)' }}
              placeholder="297"
            />
          </Field>
          <Field label="Link de compra">
            <input
              value={d.linkUrl || ''}
              onChange={(e) => updateData('linkUrl', e.target.value)}
              className={`w-full rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors ${focusStyle}`}
              style={{ ...inputStyle, borderColor: 'oklch(1 0 0 / 12%)', background: 'oklch(0.145 0 0)' }}
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
            className={`w-full rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors ${focusStyle}`}
            style={{ ...inputStyle, borderColor: 'oklch(1 0 0 / 12%)', background: 'oklch(0.145 0 0)' }}
            placeholder="Agendar"
          />
        </Field>
      ) : null}

      {block.type === 'video' ? (
        <Field label="URL de embed">
          <input
            value={d.embedUrl || ''}
            onChange={(e) => updateData('embedUrl', e.target.value)}
            className={`w-full rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors ${focusStyle}`}
            style={{ ...inputStyle, borderColor: 'oklch(1 0 0 / 12%)', background: 'oklch(0.145 0 0)' }}
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
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white'
                }`}
                style={{
                  borderColor: active ? 'oklch(0.58 0.24 285)' : 'oklch(1 0 0 / 12%)',
                  background: active ? 'oklch(0.58 0.24 285 / 10%)' : 'transparent',
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
      <span className="text-xs font-medium text-gray-400">{label}</span>
      {children}
    </label>
  )
}

function SizeGlyph({ size, active }: { size: BlockSize; active: boolean }) {
  const cls = active ? 'bg-[oklch(0.58_0.24_285)]' : 'bg-gray-600'
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
          className="h-4 w-4 rounded accent-[oklch(0.58_0.24_285)]"
        />
        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-300">
          <CalendarClock className="h-3.5 w-3.5" />
          Agendar publicação (início e expiração)
        </span>
      </label>

      {enabled && schedule ? (
        <div
          className="flex flex-col gap-3 rounded-lg border p-3"
          style={{ borderColor: 'oklch(1 0 0 / 12%)' }}
        >
          <Field label="Início da publicação">
            <input
              type="datetime-local"
              value={toLocalInputValue(schedule.startsAt)}
              onChange={(e) =>
                onChange({ ...schedule, startsAt: fromLocalInputValue(e.target.value) })
              }
              className={`w-full rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors ${focusStyle}`}
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
              className={`w-full rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors ${focusStyle}`}
              style={inputStyle}
            />
          </Field>

          {invalidWindow ? (
            <p className="text-xs" style={{ color: 'oklch(0.72 0.17 25)' }}>
              A data de expiração deve ser depois do início da publicação.
            </p>
          ) : null}

          <Field label="Após expirar">
            <select
              value={schedule.afterExpiry || 'hide'}
              onChange={(e) =>
                onChange({ ...schedule, afterExpiry: e.target.value as AfterExpiryBehavior })
              }
              className={`w-full rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors ${focusStyle}`}
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
                  className={`w-full rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors ${focusStyle}`}
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
                <p className="text-xs text-gray-500">
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
                  className={`w-full rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors ${focusStyle}`}
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
                  className={`w-full resize-none rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors ${focusStyle}`}
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
                  className={`w-full rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors ${focusStyle}`}
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
                  className={`w-full rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors ${focusStyle}`}
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
