import type { Block } from '../../types'
import { extractVideoThumbnail } from '../../utils/videoThumbnails'
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

    case 'gallery': {
      const images = d.images || []
      if (images.length === 0) {
        return (
          <div className="grid h-full w-full grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((i: number) => (
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
      }
      return (
        <div className="grid h-full w-full grid-cols-2 gap-2 overflow-hidden">
          {images.slice(0, 4).map((img: { url: string }, i: number) => (
            <div key={i} className="overflow-hidden rounded-lg">
              <img src={img.url} alt="" className="h-full w-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
      )
    }

    case 'video':
    case 'youtube': {
      const isYouTubeType = block.type === 'youtube'
      const rawUrl = isYouTubeType ? d.videoUrl || d.resolved?.sourceUrl || '' : d.sourceUrl || d.embedUrl || ''
      const thumbnail = d.resolved?.thumbnailUrl || extractVideoThumbnail(rawUrl)
      return (
        <div
          className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl"
          style={{
            background: thumbnail ? '#000000' : 'var(--color-surface-hover)',
            border: thumbnail ? '1px solid var(--color-border)' : undefined,
          }}
        >
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={d.resolved?.title || d.title || 'Vídeo'}
              className="absolute inset-0 h-full w-full object-cover"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : null}
          <span
            className="relative flex h-12 w-12 items-center justify-center rounded-full"
            style={{
              background: isYouTubeType ? '#FF0000' : 'var(--accent)',
              color: 'var(--accent-text)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
            }}
          >
            <Play className="h-5 w-5 fill-current" />
          </span>
          <span
            className="absolute inset-x-0 bottom-2 truncate px-3 text-sm font-medium"
            style={{
              color: thumbnail ? '#FFFFFF' : undefined,
              background: thumbnail ? 'linear-gradient(transparent, rgba(0,0,0,0.7))' : undefined,
            }}
          >
            {d.resolved?.title || d.title || (isYouTubeType ? 'YouTube' : 'Vídeo')}
          </span>
        </div>
      )
    }

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
    case 'github': {
      const profile = d.profile || null
      if (!profile) {
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
      }
      return (
        <div className="flex h-full w-full flex-col justify-between gap-2">
          <div className="flex items-center gap-2">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.login} className="h-9 w-9 shrink-0 rounded-full object-cover" />
            ) : (
              <Code2 className="h-5 w-5" style={{ color: 'var(--color-text-secondary)' }} />
            )}
            <h3 className="min-w-0 truncate font-semibold text-ink">{profile.name || profile.login}</h3>
          </div>
          {profile.bio ? <p className="line-clamp-2 text-xs leading-relaxed text-dim">{profile.bio}</p> : null}
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className="px-2 py-0.5 text-[11px] font-semibold"
              style={{ borderRadius: '999px', background: 'var(--accent-soft)', color: 'var(--accent-hover)' }}
            >
              {profile.publicRepos} repos
            </span>
            {(d.showPinned !== false ? (profile.topLanguages || []).slice(0, 3) : []).map((lang: { name: string }) => (
              <span
                key={lang.name}
                className="px-2 py-0.5 text-[11px] font-medium text-dim"
                style={{ borderRadius: '999px', border: '1px solid var(--color-border)' }}
              >
                {lang.name}
              </span>
            ))}
          </div>
        </div>
      )
    }

    case 'spotify': {
      const resolved = d.resolved || null
      const cover = resolved?.thumbnailUrl
      return (
        <div className="flex h-full w-full flex-col justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {cover ? (
              <img src={cover} alt="" className="h-9 w-9 shrink-0 rounded object-cover" />
            ) : (
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded"
                style={{ background: 'color-mix(in srgb, #1DB954 18%, transparent)' }}
              >
                <Headphones className="h-4 w-4" style={{ color: '#1DB954' }} />
              </span>
            )}
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-ink">{resolved?.title || d.variant || 'Spotify'}</h3>
              {resolved?.owner ? <p className="truncate text-xs text-dim">{resolved.owner}</p> : null}
            </div>
          </div>
          <span className="text-xs text-dim">{d.autoplayEmbed ? 'Player embutido' : 'Clique para ouvir'}</span>
        </div>
      )
    }

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

    case 'form':
      return (
        <div className="flex h-full w-full flex-col justify-between gap-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" style={{ color: 'var(--accent-hover)' }} />
            <h3 className="truncate font-semibold text-ink">{d.title || 'Formulário'}</h3>
          </div>
          {d.description ? (
            <p className="line-clamp-2 text-xs text-dim">{d.description}</p>
          ) : null}
          <div className="flex flex-col gap-1.5">
            {(d.fields || ['Nome', 'E-mail']).slice(0, 2).map((f: string) => (
              <div key={f} className="flex h-5 items-center rounded-md px-2 text-[10px] text-faint"
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
