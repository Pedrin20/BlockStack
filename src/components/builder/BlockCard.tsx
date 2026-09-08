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
    ? 'oklch(0.58 0.24 285)'
    : 'oklch(1 0 0 / 12%)'

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
        background: 'oklch(0.21 0.018 285)',
        boxShadow: selected ? '0 0 0 2px oklch(0.58 0.24 285 / 60%)' : 'none',
      }}
    >
      {scheduleStatus === 'scheduled' || scheduleStatus === 'expired' ? (
        <span
          className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur"
          style={
            scheduleStatus === 'expired'
              ? { background: 'oklch(0.62 0.21 25 / 18%)', color: 'oklch(0.82 0.16 25)' }
              : { background: 'oklch(0.72 0.16 75 / 18%)', color: 'oklch(0.85 0.15 80)' }
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
            background: 'oklch(0.72 0.19 285 / 18%)',
            color: 'oklch(0.85 0.16 285)',
          }}
        >
          <Sparkles className="h-3 w-3" />
          Smart
        </span>
      ) : null}
      <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
        style={{ background: 'oklch(0.17 0.015 285 / 60%)', color: 'oklch(0.68 0.02 285)' }}
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
              style={{ boxShadow: '0 0 0 2px oklch(0.58 0.24 285 / 40%)' }}
            />
          ) : (
            <div className="h-16 w-16 shrink-0 rounded-full flex items-center justify-center text-xl font-bold text-white"
              style={{ background: 'oklch(0.58 0.24 285)' }}
            >
              {d.displayName?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold text-white">
              {d.displayName || 'Seu nome'}
            </h2>
            {d.bio ? (
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-gray-400">
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
              <h3 className="truncate font-semibold text-white">
                {d.title || 'Produto'}
              </h3>
              {d.description ? (
                <p className="truncate text-xs text-gray-400">{d.description}</p>
              ) : null}
            </div>
            {d.price ? (
              <span
                className="shrink-0 rounded-full px-3 py-1 text-sm font-semibold text-white"
                style={{ background: 'oklch(0.58 0.24 285)' }}
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
          <CalendarClock className="h-6 w-6" style={{ color: 'oklch(0.7 0.19 35)' }} />
          <div>
            <h3 className="font-semibold text-white">{d.title || 'Serviço'}</h3>
            {d.description ? (
              <p className="text-xs text-gray-400">{d.description}</p>
            ) : null}
          </div>
          <span
            className="inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold text-white"
            style={{ background: 'oklch(0.7 0.19 35)' }}
          >
            {d.actionLabel || 'Agendar'}
          </span>
        </div>
      )

    case 'link':
      return (
        <div className="flex h-full w-full items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-white">
              {d.title || 'Link'}
            </h3>
            {d.url ? (
              <p className="truncate text-xs text-gray-400">{d.url}</p>
            ) : null}
          </div>
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-colors"
            style={{ background: 'oklch(0.26 0.02 285)' }}
          >
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      )

    case 'newsletter':
      return (
        <div className="flex h-full w-full flex-col justify-center gap-2">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" style={{ color: 'oklch(0.58 0.24 285)' }} />
            <h3 className="font-semibold text-white">{d.title || 'Newsletter'}</h3>
          </div>
          {d.description ? (
            <p className="text-xs text-gray-400">{d.description}</p>
          ) : null}
          <div className="mt-1 flex items-center gap-2">
            <span className="flex-1 truncate rounded-lg px-3 py-1.5 text-xs text-gray-500"
              style={{ border: '1px solid oklch(1 0 0 / 12%)' }}
            >
              {d.placeholder || 'seu@email.com'}
            </span>
            <span
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
              style={{ background: 'oklch(0.58 0.24 285)' }}
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
              style={{ background: 'oklch(0.26 0.02 285)', color: 'oklch(0.68 0.02 285)' }}
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
          style={{ background: 'oklch(0.26 0.02 285)' }}
        >
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full text-white"
            style={{ background: 'oklch(0.58 0.24 285)' }}
          >
            <Play className="h-5 w-5 fill-current" />
          </span>
          <span className="absolute bottom-2 left-3 text-sm font-medium text-white">
            {d.title || 'Vídeo'}
          </span>
        </div>
      )

    case 'text':
      return (
        <div className="flex h-full w-full flex-col justify-center">
          <h3 className="font-semibold text-white">{d.content?.slice(0, 40) || 'Texto'}</h3>
          {d.content ? (
            <p className="mt-1 text-sm leading-relaxed text-gray-400 line-clamp-3">{d.content}</p>
          ) : null}
        </div>
      )

    case 'socials':
      return (
        <div className="flex h-full w-full flex-col justify-between gap-3">
          <span className="text-xs font-medium text-gray-400">Redes</span>
          <div className="flex flex-wrap gap-2">
            {[Camera, Music, AtSign, Globe].map((Icon, i) => (
              <span key={i} className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ background: 'oklch(0.26 0.02 285)', color: 'oklch(0.68 0.02 285)' }}>
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
            <Code2 className="h-5 w-5" style={{ color: 'oklch(0.68 0.02 285)' }} />
            <h3 className="font-semibold text-white truncate">{d.username || 'GitHub'}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Perfil + stats</span>
            {d.showPinned && <span className="text-xs text-gray-400">+ linguagens</span>}
          </div>
          <div className="mt-1 h-2 rounded-full" style={{ background: 'oklch(0.26 0.02 285)' }} />
        </div>
      )

    case 'spotify':
      return (
        <div className="flex h-full w-full flex-col justify-between gap-2">
          <div className="flex items-center gap-2">
            <Headphones className="h-5 w-5" style={{ color: '#1DB954' }} />
            <h3 className="font-semibold text-white truncate">{d.variant || 'Música'}</h3>
          </div>
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="h-3 flex-1 rounded-full" style={{ background: `oklch(${0.3 + i*0.08} 0.08 142)` }} />
            ))}
          </div>
          <span className="text-xs text-gray-400">Spotify embed</span>
        </div>
      )

    case 'youtube':
      return (
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl"
          style={{ background: 'oklch(0.26 0.02 285)' }}>
          <span className="flex h-12 w-12 items-center justify-center rounded-full text-white"
            style={{ background: '#FF0000' }}>
            <Play className="h-5 w-5 fill-current" />
          </span>
          <span className="absolute bottom-2 left-3 text-sm font-medium text-white">
            {d.title || 'YouTube'}
          </span>
        </div>
      )

    case 'calendar':
      return (
        <div className="flex h-full w-full flex-col justify-between gap-3">
          <Calendar className="h-6 w-6" style={{ color: 'oklch(0.65 0.2 160)' }} />
          <div>
            <h3 className="font-semibold text-white">{d.title || 'Agendar'}</h3>
            {d.availableHours && <p className="text-xs text-gray-400">{d.availableHours}</p>}
          </div>
          <span className="inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold text-white"
            style={{ background: 'oklch(0.65 0.2 160)' }}>
            Agendar
          </span>
        </div>
      )

    case 'form':
      return (
        <div className="flex h-full w-full flex-col justify-between gap-2">
          <MessageSquare className="h-5 w-5" style={{ color: 'oklch(0.58 0.24 285)' }} />
          <h3 className="font-semibold text-white">{d.title || 'Formulário'}</h3>
          <div className="flex flex-col gap-1.5">
            {(d.fields || ['Nome', 'E-mail']).slice(0, 2).map((f: string) => (
              <div key={f} className="h-5 rounded-md text-[10px] px-2 flex items-center text-gray-500"
                style={{ border: '1px solid oklch(1 0 0 / 12%)' }}>
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
            <HelpCircle className="h-5 w-5" style={{ color: 'oklch(0.7 0.19 200)' }} />
            <h3 className="font-semibold text-white">{d.title || 'FAQ'}</h3>
          </div>
          <div className="flex flex-col gap-1.5">
            {[0,1,2].map(i => (
              <div key={i} className="h-3 rounded-md" style={{ background: 'oklch(0.26 0.02 285)', width: `${80 - i*15}%` }} />
            ))}
          </div>
          <span className="text-xs text-gray-400">{d.items?.length || 0} perguntas</span>
        </div>
      )

    case 'testimonial':
      return (
        <div className="flex h-full w-full flex-col justify-between gap-2">
          <Quote className="h-5 w-5" style={{ color: 'oklch(0.7 0.19 80)' }} />
          <p className="text-sm text-gray-400 italic line-clamp-2">
            "{d.items?.[0]?.text || 'Depoimento de cliente...'}"
          </p>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full" style={{ background: 'oklch(0.58 0.24 285)' }} />
            <span className="text-xs text-white font-medium">{d.items?.[0]?.name || 'Cliente'}</span>
          </div>
        </div>
      )

    default:
      return <span className="text-sm text-gray-400">{d.title || 'Bloco'}</span>
  }
}
