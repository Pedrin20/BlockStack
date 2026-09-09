import { useEffect, useMemo, useState } from 'react'
import type { Block, BlockSize, Density, BlockStyle, SubstituteContent } from '../../types'
import { getBlockPrimaryUrl, normalizeUrl, resolvePublicBlocks, type ResolvedBlockMode } from '../../utils/schedule'
import { applySmartVariation, getTrafficSource } from '../../utils/smartBlocks'
import { recordBlockClick, recordProfileView } from '../../services/analyticsService'
import { createLead } from '../../services/leadService'
import {
  ArrowUpRight,
  Camera,
  Music,
  Globe,
  AtSign,
  Mail,
  CalendarClock,
  Play,
  ImageIcon,
  Code2,
  Headphones,
  Calendar,
  MessageSquare,
  HelpCircle,
  ChevronDown,
  Quote
} from 'lucide-react'

interface PublicProfileTheme {
  vars: Record<string, string>
  blockStyle: BlockStyle
  density: Density
  radius: string
  fontDisplay: string
}

const SIZE_CLASSES: Record<BlockSize, string> = {
  '1x1': 'col-span-2 sm:col-span-1 row-span-1',
  '2x1': 'col-span-2 row-span-1',
  '2x2': 'col-span-2 row-span-2',
  'full': 'col-span-2 sm:col-span-4 row-span-1',
}

const DENSITY_CONFIG: Record<Density, { rows: string; gap: string }> = {
  compact: { rows: 'auto-rows-[112px]', gap: 'gap-2' },
  standard: { rows: 'auto-rows-[128px]', gap: 'gap-3' },
  spaced: { rows: 'auto-rows-[140px]', gap: 'gap-4' },
}

/* ═══════════════════════════════════════════════════════════════
   TOKENS DO TEMA — aplicados como CSS variables no container.
   Cada preset da tela Design define: bg, surface, border, text,
   muted, accent e accentText. Todos os blocos consomem SOMENTE
   essas variáveis — nenhum valor fixo de cor aqui.
   ═══════════════════════════════════════════════════════════════ */

function themeToCssVars(theme: PublicProfileTheme): React.CSSProperties {
  const v = theme.vars
  const glass = theme.blockStyle === 'glass'
  return {
    // tokens expostos para os blocos
    ['--pv-radius' as string]: theme.radius,
    ['--pv-font' as string]: theme.fontDisplay,
    ['--pv-text' as string]: v.text,
    ['--pv-muted' as string]: v.muted,
    ['--pv-border' as string]: v.border,
    ['--pv-accent' as string]: v.accent,
    ['--pv-accent-text' as string]: v.accentText,
    ['--pv-surface' as string]: v.surface,
    // profundidade da superfície translúcida do modo vidro
    ['--pv-glass-bg' as string]: glass ? 'color-mix(in srgb, var(--pv-text) 8%, transparent)' : v.surface,
  }
}

/** Superfície do bloco conforme o estilo escolhido: cheio / contorno / vidro. */
function surfaceStyle(theme: PublicProfileTheme): React.CSSProperties {
  const base: React.CSSProperties = {
    borderRadius: 'var(--pv-radius)',
    fontFamily: 'var(--pv-font)',
    color: 'var(--pv-text)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
  }

  if (theme.blockStyle === 'outline') {
    return {
      ...base,
      background: 'transparent',
      border: '1.5px solid var(--pv-border)',
    }
  }

  if (theme.blockStyle === 'glass') {
    return {
      ...base,
      background: 'var(--pv-glass-bg)',
      border: '1px solid var(--pv-border)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    }
  }

  // filled — superfície sólida do preset com sombra leve
  return {
    ...base,
    background: 'var(--pv-surface)',
    border: '1px solid var(--pv-border)',
    boxShadow: '0 2px 10px rgba(0,0,0,0.10)',
  }
}

/** Pill único de ação — mesmo formato, hover e tamanho em todos os blocos. */
function ActionPill({
  children,
  href,
  onClick,
  type,
  disabled,
}: {
  children: React.ReactNode
  href?: string
  onClick?: (e: React.MouseEvent) => void
  type?: 'submit'
  disabled?: boolean
}) {
  const cls = 'gl-pill inline-flex w-fit items-center gap-1.5 px-4 py-2 text-sm font-semibold'
  const style: React.CSSProperties = {
    borderRadius: 'var(--pv-radius)',
    background: 'var(--pv-accent)',
    color: 'var(--pv-accent-text)',
    boxShadow: '0 2px 12px color-mix(in srgb, var(--pv-accent) 25%, transparent)',
    opacity: disabled ? 0.6 : 1,
  }

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls} style={style} onClick={onClick}>
        {children}
      </a>
    )
  }
  return (
    <button type={type || 'button'} disabled={disabled} className={cls} style={style} onClick={onClick}>
      {children}
    </button>
  )
}

const displayStyle = (): React.CSSProperties => ({
  fontFamily: 'var(--pv-font)',
  color: 'var(--pv-text)',
})

const mutedStyle = (): React.CSSProperties => ({
  color: 'var(--pv-muted)',
})

/** Input padrão dos blocos de formulário/newsletter (preenchimento, radius, foco). */
function inputStyle(): React.CSSProperties {
  return {
    padding: '0.55rem 0.875rem',
    fontSize: '0.875rem',
    borderRadius: 'var(--pv-radius)',
    background: 'color-mix(in srgb, var(--pv-text) 6%, transparent)',
    border: '1px solid color-mix(in srgb, var(--pv-text) 18%, transparent)',
    color: 'var(--pv-text)',
    outline: 'none',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    minWidth: 0,
    flex: 1,
  }
}

/** Placeholder dentro do sistema de tokens (galeria vazia, redes, etc). */
function PagePlaceholder({ icon }: { icon: React.ReactNode }) {
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{
        borderRadius: 'var(--pv-radius)',
        background: 'color-mix(in srgb, var(--pv-text) 6%, transparent)',
        color: 'var(--pv-muted)',
      }}
    >
      {icon}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   THUMBNAIL DE VÍDEO — derivada da URL de embed quando possível.
   ═══════════════════════════════════════════════════════════════ */

function extractVideoThumbnail(embedUrl: string): string | null {
  if (!embedUrl) return null
  const yt = embedUrl.match(/(?:youtube\.com\/(?:embed\/|watch\?v=|shorts\/)|youtu\.be\/)([\w-]{6,})/)
  if (yt) return `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg`
  const vimeo = embedUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeo) return `https://vumbnail.com/${vimeo[1]}.jpg`
  return null
}

export function PublicProfile({
  blocks,
  theme,
  className,
}: {
  blocks: Block[]
  theme: PublicProfileTheme
  className?: string
}) {
  const density = DENSITY_CONFIG[theme.density] || DENSITY_CONFIG.standard

  // Reavalia a janela de publicação ao vivo (a cada 30s) sem recarregar a página
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  // Origem do visitante (utm_source ou referrer) — dispara a variação Smart Block
  const source = useMemo(() => getTrafficSource(), [])

  const resolved = useMemo(() => resolvePublicBlocks(blocks, now), [blocks, now])

  // Count one view per browser session for this profile. It avoids inflating the
  // dashboard when React remounts the public page during development.
  useEffect(() => {
    const userId = blocks[0]?.userId
    if (!userId || resolved.length === 0) return

    const day = new Date().toISOString().slice(0, 10)
    const sessionKey = `getlink-analytics-viewed-${userId}-${day}`
    if (sessionStorage.getItem(sessionKey)) return
    sessionStorage.setItem(sessionKey, '1')
    void recordProfileView(userId, resolved.map((item) => item.block.id)).catch(() => {
      // Analytics must never interfere with viewing a public profile.
    })
  }, [blocks, resolved])

  return (
    <div
      className={`gl-public min-h-full w-full px-4 py-8 sm:px-6 ${className || ''}`}
      style={{ background: theme.vars.bg, ...themeToCssVars(theme) }}
    >
      {/* Estados de foco/hover dos elementos interativos da página pública,
          sempre derivados dos tokens do tema */}
      <style>{`
        .gl-public .gl-pill { transition: filter 0.15s ease, transform 0.15s ease; cursor: pointer; }
        .gl-public .gl-pill:hover { filter: brightness(1.08); transform: translateY(-1px); }
        .gl-public .gl-pill:active { transform: translateY(0); }
        .gl-public input.gl-field:focus {
          border-color: var(--pv-accent) !important;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--pv-accent) 25%, transparent);
        }
        .gl-public input.gl-field::placeholder { color: var(--pv-muted); }
        .gl-public .gl-faq-row { transition: background 0.15s ease; }
        .gl-public .gl-faq-row:hover { background: color-mix(in srgb, var(--pv-text) 10%, transparent) !important; }
      `}</style>

      <div className="mx-auto max-w-2xl">
        <div className={`grid grid-cols-2 sm:grid-cols-4 ${density.rows} ${density.gap}`}>
          {resolved.map((r) => (
            <ThemedBlock
              key={r.key}
              block={applySmartVariation(r.block, source)}
              theme={theme}
              mode={r.mode}
              clickUrl={r.clickUrl}
              substitute={r.substitute}
            />
          ))}
        </div>
        <p className="mt-8 text-center text-xs" style={mutedStyle()}>
          Feito com GetLink
        </p>
      </div>
    </div>
  )
}

function ThemedBlock({
  block,
  theme,
  mode = 'normal',
  clickUrl,
  substitute,
}: {
  block: Block
  theme: PublicProfileTheme
  mode?: ResolvedBlockMode
  clickUrl?: string
  substitute?: SubstituteContent
}) {
  const content =
    mode === 'substitute' ? (
      <SubstituteBody substitute={substitute} />
    ) : (
      <ThemedBody block={block} />
    )

  // Link / produto / serviço abrem sua URL primária; o modo redirect usa a URL
  // do bloco-alvo resolvida pelo agendamento.
  const href =
    mode === 'redirect'
      ? clickUrl
      : mode === 'normal' && isClickableType(block.type)
        ? getBlockPrimaryUrl(block)
        : undefined

  const normalizedHref = href ? normalizeUrl(href) : undefined
  const wrapperClass = `flex flex-col overflow-hidden p-4 ${SIZE_CLASSES[block.size]}`

  if (normalizedHref) {
    return (
      <a
        href={normalizedHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          if (block.userId) void recordBlockClick(block.userId, block.id).catch(() => {})
        }}
        className={`${wrapperClass} transition-transform duration-200 hover:-translate-y-0.5`}
        style={surfaceStyle(theme)}
      >
        {content}
      </a>
    )
  }

  return (
    <div className={wrapperClass} style={surfaceStyle(theme)}>
      {content}
    </div>
  )
}

function isClickableType(type: Block['type']): boolean {
  return type === 'link' || type === 'product' || type === 'service'
}

function SubstituteBody({
  substitute,
}: {
  substitute?: SubstituteContent
}) {
  const title = substitute?.title || 'Conteúdo encerrado'
  const description = substitute?.description || ''
  const buttonLabel = substitute?.buttonLabel
  const buttonUrl = substitute?.buttonUrl

  return (
    <div className="flex h-full w-full flex-col justify-between gap-3">
      <div>
        <h3 className="font-semibold" style={displayStyle()}>
          {title}
        </h3>
        {description ? (
          <p className="mt-1 text-sm leading-relaxed line-clamp-3" style={mutedStyle()}>
            {description}
          </p>
        ) : null}
      </div>
      {buttonLabel ? (
        <ActionPill href={buttonUrl ? normalizeUrl(buttonUrl) : undefined}>
          {buttonLabel}
        </ActionPill>
      ) : null}
    </div>
  )
}

function ThemedBody({ block }: { block: Block }) {
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
              style={{ boxShadow: '0 0 0 2px var(--pv-accent)' }}
            />
          ) : (
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold"
              style={{ background: 'var(--pv-accent)', color: 'var(--pv-accent-text)' }}
            >
              {d.displayName?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold" style={displayStyle()}>
              {d.displayName || 'Seu nome'}
            </h2>
            {d.bio ? (
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed" style={mutedStyle()}>
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
            <div className="mb-3 flex-1 overflow-hidden" style={{ borderRadius: 'var(--pv-radius)' }}>
              <img src={d.imageUrl} alt={d.title} className="h-full w-full object-cover" />
            </div>
          ) : null}
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-semibold" style={displayStyle()}>
                {d.title || 'Produto'}
              </h3>
              {d.description ? (
                <p className="truncate text-xs" style={mutedStyle()}>{d.description}</p>
              ) : null}
            </div>
            {d.price ? (
              <span
                className="shrink-0 px-3 py-1 text-sm font-semibold"
                style={{ borderRadius: 'var(--pv-radius)', background: 'var(--pv-accent)', color: 'var(--pv-accent-text)' }}
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
          <CalendarClock className="h-6 w-6" style={{ color: 'var(--pv-accent)' }} />
          <div>
            <h3 className="font-semibold" style={displayStyle()}>
              {d.title || 'Serviço'}
            </h3>
            {d.description ? (
              <p className="text-xs" style={mutedStyle()}>{d.description}</p>
            ) : null}
          </div>
          <ActionPill>{d.actionLabel || 'Agendar'}</ActionPill>
        </div>
      )

    case 'link':
      return (
        <div className="flex h-full w-full items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-semibold" style={displayStyle()}>
              {d.title || 'Link'}
            </h3>
            {d.url ? (
              <p className="truncate text-xs" style={mutedStyle()}>{d.url}</p>
            ) : null}
          </div>
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
            style={{ background: 'var(--pv-accent)', color: 'var(--pv-accent-text)' }}
          >
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      )

    case 'newsletter':
      return <LeadCapture block={block} source="newsletter" title={d.title || 'Newsletter'} description={d.description} buttonText={d.buttonText || 'Assinar'} emailPlaceholder={d.placeholder || 'seu@email.com'} />

    case 'gallery':
      return (
        <div className="grid h-full w-full grid-cols-2 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <PagePlaceholder key={i} icon={<ImageIcon className="h-5 w-5" />} />
          ))}
        </div>
      )

    case 'video':
      return <VideoFace title={d.title || 'Vídeo'} embedUrl={d.embedUrl} />

    case 'text':
      return (
        <div className="flex h-full w-full flex-col justify-center">
          <h3 className="font-semibold" style={displayStyle()}>
            {d.content?.slice(0, 50) || 'Texto'}
          </h3>
          {d.content ? (
            <p className="mt-1 text-sm leading-relaxed line-clamp-3" style={mutedStyle()}>
              {d.content}
            </p>
          ) : null}
        </div>
      )

    case 'socials':
      return (
        <div className="flex h-full w-full flex-col justify-between gap-3">
          <span className="text-xs font-medium" style={mutedStyle()}>Redes</span>
          <div className="flex flex-wrap gap-2">
            {[Camera, Music, AtSign, Globe].map((Icon, i) => (
              <span key={i} className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{
                  background: 'color-mix(in srgb, var(--pv-accent) 16%, transparent)',
                  color: 'var(--pv-accent)',
                }}>
                <Icon className="h-4 w-4" />
              </span>
            ))}
          </div>
        </div>
      )

    case 'github': {
      const profileUrl = d.username ? `https://github.com/${d.username}` : undefined
      return (
        <div className="flex h-full w-full flex-col justify-between gap-2">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5" style={{ color: 'var(--pv-accent)' }} />
            <h3 className="truncate font-semibold" style={displayStyle()}>
              {d.username ? `@${d.username}` : 'GitHub'}
            </h3>
          </div>
          <p className="text-xs leading-relaxed" style={mutedStyle()}>
            Projetos, contribuições e estatísticas open source.
          </p>
          <ActionPill href={profileUrl ? normalizeUrl(profileUrl) : undefined}>
            Ver perfil no GitHub <ArrowUpRight className="h-3.5 w-3.5" />
          </ActionPill>
        </div>
      )
    }

    case 'spotify':
      return (
        <div className="flex h-full w-full flex-col justify-between gap-2">
          <div className="flex items-center gap-2">
            <Headphones className="h-5 w-5" style={{ color: '#1DB954' }} />
            <h3 className="font-semibold" style={displayStyle()}>{d.variant || 'Música'}</h3>
          </div>
          <div className="flex flex-col gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <span
                  className="h-6 w-6 shrink-0 rounded"
                  style={{ background: 'color-mix(in srgb, var(--pv-text) 10%, transparent)' }}
                />
                <span
                  className="h-2 flex-1 rounded-full"
                  style={{ background: 'color-mix(in srgb, var(--pv-text) 10%, transparent)' }}
                />
              </div>
            ))}
          </div>
        </div>
      )

    case 'youtube':
      return <VideoFace title={d.title || 'YouTube'} embedUrl={d.videoUrl} brand="#FF0000" />

    case 'calendar':
      return (
        <div className="flex h-full w-full flex-col justify-between gap-3">
          <Calendar className="h-6 w-6" style={{ color: 'var(--pv-accent)' }} />
          <div>
            <h3 className="font-semibold" style={displayStyle()}>{d.title || 'Agendar'}</h3>
            {d.description && <p className="text-xs" style={mutedStyle()}>{d.description}</p>}
          </div>
          <ActionPill>
            Agendar <CalendarClock className="h-3.5 w-3.5" />
          </ActionPill>
        </div>
      )

    case 'form':
      return <LeadCapture block={block} source="form" title={d.title || 'Formulário'} buttonText={d.buttonText || 'Enviar'} fields={d.fields || ['Nome', 'E-mail']} successMessage={d.successMessage} />

    case 'faq':
      return (
        <div className="flex h-full w-full flex-col justify-between gap-2">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" style={{ color: 'var(--pv-accent)' }} />
            <h3 className="font-semibold" style={displayStyle()}>{d.title || 'FAQ'}</h3>
          </div>
          <div className="flex flex-col gap-1.5">
            {(d.items || []).slice(0, 3).map((item: any, i: number) => (
              <div
                key={i}
                className="gl-faq-row flex items-center justify-between rounded-lg px-3 py-2 text-xs"
                style={{ background: 'color-mix(in srgb, var(--pv-text) 6%, transparent)' }}
              >
                <span style={{ color: 'var(--pv-text)' }}>{item.question}</span>
                <ChevronDown className="h-3 w-3" style={{ color: 'var(--pv-muted)' }} />
              </div>
            ))}
          </div>
        </div>
      )

    case 'testimonial':
      return (
        <div className="flex h-full w-full flex-col justify-between gap-2">
          <Quote className="h-5 w-5" style={{ color: 'var(--pv-accent)' }} />
          <p className="text-sm italic line-clamp-2" style={{ color: 'var(--pv-muted)' }}>
            "{d.items?.[0]?.text || 'Depoimento...'}"
          </p>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full" style={{ background: 'var(--pv-accent)' }} />
            <span className="text-xs font-medium" style={displayStyle()}>
              {d.items?.[0]?.name || 'Cliente'}
            </span>
          </div>
        </div>
      )

    default:
      return (
        <span className="text-sm" style={mutedStyle()}>
          {d.title || 'Bloco'}
        </span>
      )
  }
}

/* ═══════════════════════════════════════════════════════════════
   VÍDEO — thumbnail real quando dá para extrair da URL; fallback
   estilizado (painel do tema + play no accent) quando não dá.
   ═══════════════════════════════════════════════════════════════ */

function VideoFace({
  title,
  embedUrl,
  brand,
}: {
  title: string
  embedUrl?: string
  brand?: string
}) {
  const thumbnail = embedUrl ? extractVideoThumbnail(embedUrl) : null

  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden"
      style={{
        borderRadius: 'var(--pv-radius)',
        border: '1px solid var(--pv-border)',
        background: thumbnail ? '#000000' : 'color-mix(in srgb, var(--pv-text) 6%, transparent)',
      }}
    >
      {thumbnail ? (
        <img
          src={thumbnail}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => {
            ;(e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      ) : null}
      <span
        className="relative flex h-12 w-12 items-center justify-center rounded-full"
        style={{
          background: brand || 'var(--pv-accent)',
          color: '#FFFFFF',
          boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
        }}
      >
        <Play className="h-5 w-5 fill-current" />
      </span>
      <span
        className="absolute inset-x-0 bottom-0 truncate px-3 py-1.5 text-sm font-medium"
        style={{
          color: thumbnail ? '#FFFFFF' : 'var(--pv-text)',
          background: thumbnail
            ? 'linear-gradient(transparent, rgba(0,0,0,0.7))'
            : 'transparent',
        }}
      >
        {title}
      </span>
    </div>
  )
}

function LeadCapture({
  block,
  source,
  title,
  description,
  buttonText,
  emailPlaceholder,
  fields,
  successMessage,
}: {
  block: Block
  source: 'newsletter' | 'form'
  title: string
  description?: string
  buttonText: string
  emailPlaceholder?: string
  fields?: string[]
  successMessage?: string
}) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const formFields = source === 'newsletter' ? ['E-mail'] : fields || ['Nome', 'E-mail']

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const emailField = formFields.find((field) => /e-?mail|mail/i.test(field)) || 'E-mail'
    const nameField = formFields.find((field) => /nome|name/i.test(field))
    const email = values[emailField]?.trim()
    if (!email || !block.userId) return
    setSubmitting(true)
    try {
      await createLead({ userId: block.userId, blockId: block.id, name: nameField ? values[nameField]?.trim() || '' : '', email, source })
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) return <div className="flex h-full w-full items-center justify-center text-center text-sm font-semibold" style={displayStyle()}>{successMessage || 'Recebemos seu contato!'}</div>

  return (
    <form onSubmit={submit} className="flex h-full w-full flex-col justify-center gap-2" onClick={(event) => event.stopPropagation()}>
      <div className="flex items-center gap-2">
        {source === 'newsletter'
          ? <Mail className="h-5 w-5" style={{ color: 'var(--pv-accent)' }} />
          : <MessageSquare className="h-5 w-5" style={{ color: 'var(--pv-accent)' }} />}
        <h3 className="font-semibold" style={displayStyle()}>{title}</h3>
      </div>
      {description ? <p className="text-xs" style={mutedStyle()}>{description}</p> : null}
      <div className={`mt-1 flex gap-2 ${source === 'form' ? 'flex-col' : ''}`}>
        {formFields.slice(0, source === 'form' ? 3 : 1).map((field) => {
          const isEmail = /e-?mail|mail/i.test(field)
          return (
            <input
              key={field}
              required={source === 'form' || isEmail}
              type={isEmail ? 'email' : 'text'}
              value={values[field] || ''}
              onChange={(event) => setValues((current) => ({ ...current, [field]: event.target.value }))}
              placeholder={isEmail ? emailPlaceholder || field : field}
              className="gl-field"
              style={inputStyle()}
            />
          )
        })}
        <ActionPill type="submit" disabled={submitting}>
          {submitting ? 'Enviando...' : buttonText}
        </ActionPill>
      </div>
    </form>
  )
}
