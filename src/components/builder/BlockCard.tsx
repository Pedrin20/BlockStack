import type { Block } from '../../types'
import { getBlockStatus } from '../../utils/schedule'
import { hasSmartVariation } from '../../utils/smartBlocks'
import {
  ArrowUpRight,
  Camera,
  Music,
  Globe,
  AtSign,
  Mail,
  Play,
  ImageIcon,
  GripVertical,
  CalendarClock,
  Code2,
  Headphones,
  Calendar,
  MessageSquare,
  HelpCircle,
  Quote,
  Sparkles,
} from 'lucide-react'

const SIZE_CLASSES: Record<Block['size'], string> = {
  '1x1': 'col-span-2 sm:col-span-1 row-span-1 min-h-[132px]',
  '2x1': 'col-span-2 row-span-1 min-h-[132px]',
  '2x2': 'col-span-2 row-span-2 min-h-[280px]',
  'full': 'col-span-2 sm:col-span-4 row-span-1 min-h-[120px]',
}

export function BlockCard({
  block,
  now,
  selected,
  onSelect,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  block: Block
  now: number
  selected?: boolean
  onSelect?: () => void
  draggable?: boolean
  onDragStart?: () => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: () => void
}) {
  const borderColor = selected
    ? 'var(--accent)'
    : 'var(--color-border-strong)'

  const scheduleStatus = getBlockStatus(block, now)

  return (
    <button
      type="button"
      onClick={onSelect}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${
        SIZE_CLASSES[block.size]
      }`}
      style={{
        borderColor,
        background: 'var(--color-surface-raised)',
        boxShadow: selected ? '0 0 0 2px var(--accent-muted)' : 'none',
      }}
    >
      {scheduleStatus === 'scheduled' || scheduleStatus === 'expired' ? (
        <span
          className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur"
          style={
            scheduleStatus === 'expired'
              ? { background: 'var(--color-error-soft)', color: 'var(--color-error)' }
              : { background: 'var(--color-warning-soft)', color: 'var(--color-warning)' }
          }
        >
          <CalendarClock className="h-3 w-3" />
          {scheduleStatus === 'expired' ? 'Expirado' : 'Programado'}
        </span>
      ) : null}
      {hasSmartVariation(block) ? (
        <span
          className="absolute bottom-2 right-2 z-10 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur"
          style={{
            background: 'var(--accent-soft)',
            color: 'var(--accent-hover)',
          }}
        >
          <Sparkles className="h-3 w-3" />
          Smart
        </span>
      ) : null}
      <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
        style={{ background: 'var(--color-surface-hover)', color: 'var(--color-text-secondary)' }}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </span>
      <BlockBody block={block} />
    </button>
  )
}

function BlockBody({ block }: { block: Block }) {
  const d = block.data as any

  switch (block.type) {
    case 'header':
      return (
        <div className="flex w-full items-center gap-4">
          {d.avatarUrl ? (
            <img
              src={d.avatarUrl}
              alt={d.displayName}
              className="h-16 w-16 shrink-0 rounded-full object-cover"
              style={{ boxShadow: '0 0 0 2px var(--accent-muted)' }}
            />
          ) : (
            <div className="h-16 w-16 shrink-0 rounded-full flex items-center justify-center text-xl font-bold"
              style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
            >
              {d.displayName?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold text-ink">
              {d.displayName || 'Seu nome'}
            </h2>
            {d.bio ? (
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-dim">
                {d.bio}
              </p>
            ) : null}
          </div>
        </div>
      )

    case 'product':
      return (
        <div className="flex h-full w-full flex-col">
          {d.imageUrl ? (
            <div className="mb-3 flex-1 overflow-hidden rounded-xl">
              <img
                src={d.imageUrl}
                alt={d.title}
                className="h-full w-full object-cover"
              />
            </div>
          ) : null}
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-ink">
                {d.title || 'Produto'}
              </h3>
              {d.description ? (
                <p className="truncate text-xs text-dim">{d.description}</p>
              ) : null}
            </div>
            {d.price ? (
              <span
                className="shrink-0 rounded-full px-3 py-1 text-sm font-semibold"
                style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
              >
                R$ {d.price}
              </span>
            ) : null}
          </div>
        </div>
      )

    case 'service':
      return (
        <div className="flex h-full w-full flex-col justify-between gap-3">
          <CalendarClock className="h-6 w-6" style={{ color: 'var(--accent-hover)' }} />
          <div>
            <h3 className="font-semibold text-ink">{d.title || 'Serviço'}</h3>
            {d.description ? (
              <p className="text-xs text-dim">{d.description}</p>
            ) : null}
          </div>
          <span
            className="inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            {d.actionLabel || 'Agendar'}
          </span>
        </div>
      )

    case 'link':
      return (
        <div className="flex h-full w-full items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-ink">
              {d.title || 'Link'}
            </h3>
            {d.url ? (
              <p className="truncate text-xs text-dim">{d.url}</p>
            ) : null}
          </div>
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors"
            style={{ background: 'var(--color-surface-hover)', color: 'var(--color-text-primary)' }}
          >
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      )

    case 'newsletter':
      return (
        <div className="flex h-full w-full flex-col justify-center gap-2">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" style={{ color: 'var(--accent-hover)' }} />
            <h3 className="font-semibold text-ink">{d.title || 'Newsletter'}</h3>
          </div>
          {d.description ? (
            <p className="text-xs text-dim">{d.description}</p>
          ) : null}
          <div className="mt-1 flex items-center gap-2">
            <span className="flex-1 truncate rounded-lg px-3 py-1.5 text-xs text-faint"
              style={{ border: '1px solid var(--color-border)' }}
            >
              {d.placeholder || 'seu@email.com'}
            </span>
            <span
              className="rounded-lg px-3 py-1.5 text-xs font-semibold"
              style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
            >
              {d.buttonText || 'Assinar'}
            </span>
          </div>
        </div>
      )

    case 'gallery':
      return (
        <div className="grid h-full w-full grid-cols-2 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-center rounded-lg"
              style={{ background: 'var(--color-surface-hover)', color: 'var(--color-text-secondary)' }}
            >
              <ImageIcon className="h-5 w-5" />
            </div>
          ))}
        </div>
      )

    case 'video':
      return (
        <div
          className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl"
          style={{ background: 'var(--color-surface-hover)' }}
        >
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            <Play className="h-5 w-5 fill-current" />
          </span>
          <span className="absolute bottom-2 left-3 text-sm font-medium text-ink">
            {d.title || 'Vídeo'}
          </span>
        </div>
      )

    case 'text':
      return (
        <div className="flex h-full w-full flex-col justify-center">
          <h3 className="font-semibold text-ink">{d.content?.slice(0, 40) || 'Texto'}</h3>
          {d.content ? (
            <p className="mt-1 text-sm leading-relaxed text-dim line-clamp-3">{d.content}</p>
          ) : null}
        </div>
      )

    case 'socials':
      return (
        <div className="flex h-full w-full flex-col justify-between gap-3">
          <span className="text-xs font-medium text-dim">Redes</span>
          <div className="flex flex-wrap gap-2">
            {[Camera, Music, AtSign, Globe].map((Icon, i) => (
              <span key={i} className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ background: 'var(--color-surface-hover)', color: 'var(--color-text-secondary)' }}>
                <Icon className="h-4 w-4" />
              </span>
            ))}
          </div>
        </div>
      )
    case 'github':
      return (
        <div className="flex h-full w-full flex-col justify-between gap-2">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5" style={{ color: 'var(--color-text-secondary)' }} />
            <h3 className="font-semibold text-ink truncate">{d.username || 'GitHub'}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-dim">Perfil + stats</span>
            {d.showPinned && <span className="text-xs text-dim">+ linguagens</span>}
          </div>
          <div className="mt-1 h-2 rounded-full" style={{ background: 'var(--color-surface-hover)' }} />
        </div>
      )

    case 'spotify':
      return (
        <div className="flex h-full w-full flex-col justify-between gap-2">
          <div className="flex items-center gap-2">
            <Headphones className="h-5 w-5" style={{ color: '#1DB954' }} />
            <h3 className="font-semibold text-ink truncate">{d.variant || 'Música'}</h3>
          </div>
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="h-3 flex-1 rounded-full" style={{ background: 'var(--color-surface-hover)' }} />
            ))}
          </div>
          <span className="text-xs text-dim">Spotify embed</span>
        </div>
      )

    case 'youtube':
      return (
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl"
          style={{ background: 'var(--color-surface-hover)' }}>
          <span className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: '#FF0000', color: '#FFFFFF' }}>
            <Play className="h-5 w-5 fill-current" />
          </span>
          <span className="absolute bottom-2 left-3 text-sm font-medium text-ink">
            {d.title || 'YouTube'}
          </span>
        </div>
      )

    case 'calendar':
      return (
        <div className="flex h-full w-full flex-col justify-between gap-3">
          <Calendar className="h-6 w-6" style={{ color: 'var(--accent-hover)' }} />
          <div>
            <h3 className="font-semibold text-ink">{d.title || 'Agendar'}</h3>
            {d.availableHours && <p className="text-xs text-dim">{d.availableHours}</p>}
          </div>
          <span className="inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
            Agendar
          </span>
        </div>
      )

    case 'form':
      return (
        <div className="flex h-full w-full flex-col justify-between gap-2">
          <MessageSquare className="h-5 w-5" style={{ color: 'var(--accent-hover)' }} />
          <h3 className="font-semibold text-ink">{d.title || 'Formulário'}</h3>
          <div className="flex flex-col gap-1.5">
            {(d.fields || ['Nome', 'E-mail']).slice(0, 2).map((f: string) => (
              <div key={f} className="h-5 rounded-md text-[10px] px-2 flex items-center text-faint"
                style={{ border: '1px solid var(--color-border)' }}>
                {f}
              </div>
            ))}
          </div>
        </div>
      )

    case 'faq':
      return (
        <div className="flex h-full w-full flex-col justify-between gap-2">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" style={{ color: 'var(--accent-hover)' }} />
            <h3 className="font-semibold text-ink">{d.title || 'FAQ'}</h3>
          </div>
          <div className="flex flex-col gap-1.5">
            {[0,1,2].map(i => (
              <div key={i} className="h-3 rounded-md" style={{ background: 'var(--color-surface-hover)', width: `${80 - i*15}%` }} />
            ))}
          </div>
          <span className="text-xs text-dim">{d.items?.length || 0} perguntas</span>
        </div>
      )

    case 'testimonial':
      return (
        <div className="flex h-full w-full flex-col justify-between gap-2">
          <Quote className="h-5 w-5" style={{ color: 'var(--accent-hover)' }} />
          <p className="text-sm text-dim italic line-clamp-2">
            "{d.items?.[0]?.text || 'Depoimento de cliente...'}"
          </p>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full" style={{ background: 'var(--accent)' }} />
            <span className="text-xs text-ink font-medium">{d.items?.[0]?.name || 'Cliente'}</span>
          </div>
        </div>
      )

    default:
      return <span className="text-sm text-dim">{d.title || 'Bloco'}</span>
  }
}
