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
      className={`min-h-full w-full px-4 py-8 sm:px-6 ${className || ''}`}
      style={{ background: theme.vars.bg }}
    >
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
        <p
          className="mt-8 text-center text-xs"
          style={{ color: theme.vars.muted, fontFamily: theme.vars.fontBody || theme.vars.fontDisplay }}
        >
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
  const surfaceStyle: React.CSSProperties = {
    borderRadius: theme.radius,
    fontFamily: theme.vars.fontDisplay,
    color: theme.vars.text,
    ...(theme.blockStyle === 'glass'
      ? {
          background: theme.vars.surface,
          border: `1px solid ${theme.vars.border}`,
          backdropFilter: 'blur(12px)',
        }
      : theme.blockStyle === 'outline'
        ? {
            background: theme.vars.surface,
            border: `1px solid ${theme.vars.border}`,
          }
        : {
            background: theme.vars.surface,
            border: `2px solid ${theme.vars.border}`,
          }),
  }

  const content =
    mode === 'substitute' ? (
      <SubstituteBody substitute={substitute} theme={theme} />
    ) : (
      <ThemedBody block={block} theme={theme} />
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
        style={surfaceStyle}
      >
        {content}
      </a>
    )
  }

  return (
    <div className={wrapperClass} style={surfaceStyle}>
      {content}
    </div>
  )
}

function isClickableType(type: Block['type']): boolean {
  return type === 'link' || type === 'product' || type === 'service'
}

function SubstituteBody({
  substitute,
  theme,
}: {
  substitute?: SubstituteContent
  theme: PublicProfileTheme
}) {
  const title = substitute?.title || 'Conteúdo encerrado'
  const description = substitute?.description || ''
  const buttonLabel = substitute?.buttonLabel
  const buttonUrl = substitute?.buttonUrl

  return (
    <div className="flex h-full w-full flex-col justify-between gap-3">
      <div>
        <h3 className="font-semibold" style={displayStyle(theme)}>
          {title}
        </h3>
        {description ? (
          <p className="mt-1 text-sm leading-relaxed line-clamp-3" style={mutedStyle(theme)}>
            {description}
          </p>
        ) : null}
      </div>
      {buttonLabel ? (
        buttonUrl ? (
          <a
            href={normalizeUrl(buttonUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-1 px-3 py-1 text-sm font-semibold"
            style={pillStyle(theme)}
          >
            {buttonLabel}
          </a>
        ) : (
          <span
            className="inline-flex w-fit items-center gap-1 px-3 py-1 text-sm font-semibold"
            style={pillStyle(theme)}
          >
            {buttonLabel}
          </span>
        )
      ) : null}
    </div>
  )
}

const displayStyle = (theme: PublicProfileTheme): React.CSSProperties => ({
  fontFamily: theme.vars.fontDisplay,
  color: theme.vars.text,
})

const mutedStyle = (theme: PublicProfileTheme): React.CSSProperties => ({
  color: theme.vars.muted,
})

const pillStyle = (theme: PublicProfileTheme): React.CSSProperties => ({
  background: theme.vars.accent,
  color: theme.vars.accentText,
  borderRadius: theme.radius,
})

function ThemedBody({ block, theme }: { block: Block; theme: PublicProfileTheme }) {
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
              style={{ boxShadow: `0 0 0 2px ${theme.vars.accent}` }}
            />
          ) : (
            <div
              className="h-16 w-16 shrink-0 rounded-full flex items-center justify-center text-xl font-bold"
              style={{ background: theme.vars.accent, color: theme.vars.accentText }}
            >
              {d.displayName?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold" style={displayStyle(theme)}>
              {d.displayName || 'Seu nome'}
            </h2>
            {d.bio ? (
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed" style={mutedStyle(theme)}>
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
            <div className="mb-3 flex-1 overflow-hidden" style={{ borderRadius: theme.radius }}>
              <img src={d.imageUrl} alt={d.title} className="h-full w-full object-cover" />
            </div>
          ) : null}
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-semibold" style={displayStyle(theme)}>
                {d.title || 'Produto'}
              </h3>
              {d.description ? (
                <p className="truncate text-xs" style={mutedStyle(theme)}>{d.description}</p>
              ) : null}
            </div>
            {d.price ? (
              <span className="shrink-0 px-3 py-1 text-sm font-semibold" style={pillStyle(theme)}>
                R$ {d.price}
              </span>
            ) : null}
          </div>
        </div>
      )

    case 'service':
      return (
        <div className="flex h-full w-full flex-col justify-between gap-3">
          <CalendarClock className="h-6 w-6" style={{ color: theme.vars.accent }} />
          <div>
            <h3 className="font-semibold" style={displayStyle(theme)}>
              {d.title || 'Serviço'}
            </h3>
            {d.description ? (
              <p className="text-xs" style={mutedStyle(theme)}>{d.description}</p>
            ) : null}
          </div>
          <span className="inline-flex w-fit items-center gap-1 px-3 py-1 text-sm font-semibold" style={pillStyle(theme)}>
            {d.actionLabel || 'Agendar'}
          </span>
        </div>
      )

    case 'link':
      return (
        <div className="flex h-full w-full items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-semibold" style={displayStyle(theme)}>
              {d.title || 'Link'}
            </h3>
            {d.url ? (
              <p className="truncate text-xs" style={mutedStyle(theme)}>{d.url}</p>
            ) : null}
          </div>
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
            style={{ background: theme.vars.accent, color: theme.vars.accentText }}
          >
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      )

    case 'newsletter':
      return <LeadCapture block={block} theme={theme} source="newsletter" title={d.title || 'Newsletter'} description={d.description} buttonText={d.buttonText || 'Assinar'} emailPlaceholder={d.placeholder || 'seu@email.com'} />

    case 'gallery':
      return (
        <div className="grid h-full w-full grid-cols-2 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-center"
              style={{ background: theme.vars.border, borderRadius: theme.radius, color: theme.vars.muted }}
            >
              <ImageIcon className="h-5 w-5" />
            </div>
          ))}
        </div>
      )

    case 'video':
      return (
        <div
          className="relative flex h-full w-full items-center justify-center overflow-hidden"
          style={{ background: theme.vars.border, borderRadius: theme.radius }}
        >
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: theme.vars.accent, color: theme.vars.accentText }}
          >
            <Play className="h-5 w-5 fill-current" />
          </span>
          <span className="absolute bottom-2 left-3 text-sm font-medium" style={displayStyle(theme)}>
            {d.title || 'Vídeo'}
          </span>
        </div>
      )

    case 'text':
      return (
        <div className="flex h-full w-full flex-col justify-center">
          <h3 className="font-semibold" style={displayStyle(theme)}>
            {d.content?.slice(0, 50) || 'Texto'}
          </h3>
          {d.content ? (
            <p className="mt-1 text-sm leading-relaxed line-clamp-3" style={mutedStyle(theme)}>
              {d.content}
            </p>
          ) : null}
        </div>
      )

    case 'socials':
      return (
        <div className="flex h-full w-full flex-col justify-between gap-3">
          <span className="text-xs font-medium" style={mutedStyle(theme)}>Redes</span>
          <div className="flex flex-wrap gap-2">
            {[Camera, Music, AtSign, Globe].map((Icon, i) => (
              <span key={i} className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ background: theme.vars.border, color: theme.vars.text }}>
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
            <Code2 className="h-5 w-5" style={{ color: theme.vars.accent }} />
            <h3 className="font-semibold" style={displayStyle(theme)}>@{d.username || 'GitHub'}</h3>
          </div>
          <div className="flex gap-1">
            {[0,1,2,3].map(i => (
              <div key={i} className="h-2 flex-1 rounded-full" style={{ background: theme.vars.border }} />
            ))}
          </div>
          <span className="text-xs" style={mutedStyle(theme)}>GitHub profile</span>
        </div>
      )

    case 'spotify':
      return (
        <div className="flex h-full w-full flex-col justify-between gap-2">
          <div className="flex items-center gap-2">
            <Headphones className="h-5 w-5" style={{ color: '#1DB954' }} />
            <h3 className="font-semibold" style={displayStyle(theme)}>Spotify</h3>
          </div>
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="h-3 flex-1 rounded-full" style={{ background: theme.vars.border }} />
            ))}
          </div>
        </div>
      )

    case 'youtube':
      return (
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden"
          style={{ background: theme.vars.border, borderRadius: theme.radius }}>
          <span className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: '#FF0000', color: 'white' }}>
            <Play className="h-5 w-5 fill-current" />
          </span>
          <span className="absolute bottom-2 left-3 text-sm font-medium" style={displayStyle(theme)}>
            {d.title || 'YouTube'}
          </span>
        </div>
      )

    case 'calendar':
      return (
        <div className="flex h-full w-full flex-col justify-between gap-3">
          <Calendar className="h-6 w-6" style={{ color: theme.vars.accent }} />
          <div>
            <h3 className="font-semibold" style={displayStyle(theme)}>{d.title || 'Agendar'}</h3>
            {d.description && <p className="text-xs" style={mutedStyle(theme)}>{d.description}</p>}
          </div>
          <span className="inline-flex w-fit items-center px-3 py-1 text-sm font-semibold" style={pillStyle(theme)}>
            Agendar
          </span>
        </div>
      )

    case 'form':
      return <LeadCapture block={block} theme={theme} source="form" title={d.title || 'Formulário'} buttonText={d.buttonText || 'Enviar'} fields={d.fields || ['Nome', 'E-mail']} successMessage={d.successMessage} />

    case 'faq':
      return (
        <div className="flex h-full w-full flex-col justify-between gap-2">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" style={{ color: theme.vars.accent }} />
            <h3 className="font-semibold" style={displayStyle(theme)}>{d.title || 'FAQ'}</h3>
          </div>
          <div className="flex flex-col gap-1.5">
            {(d.items || []).slice(0, 3).map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2 text-xs"
                style={{ background: theme.vars.border }}>
                <span style={{ color: theme.vars.text }}>{item.question}</span>
                <ChevronDown className="h-3 w-3" style={{ color: theme.vars.muted }} />
              </div>
            ))}
          </div>
        </div>
      )

    case 'testimonial':
      return (
        <div className="flex h-full w-full flex-col justify-between gap-2">
          <Quote className="h-5 w-5" style={{ color: theme.vars.accent }} />
          <p className="text-sm italic line-clamp-2" style={{ color: theme.vars.muted }}>
            "{d.items?.[0]?.text || 'Depoimento...'}"
          </p>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full" style={{ background: theme.vars.accent }} />
            <span className="text-xs font-medium" style={displayStyle(theme)}>
              {d.items?.[0]?.name || 'Cliente'}
            </span>
          </div>
        </div>
      )

    default:
      return (
        <span className="text-sm" style={mutedStyle(theme)}>
          {d.title || 'Bloco'}
        </span>
      )
  }
}

function LeadCapture({
  block,
  theme,
  source,
  title,
  description,
  buttonText,
  emailPlaceholder,
  fields,
  successMessage,
}: {
  block: Block
  theme: PublicProfileTheme
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

  if (submitted) return <div className="flex h-full w-full items-center justify-center text-center text-sm font-semibold" style={displayStyle(theme)}>{successMessage || 'Recebemos seu contato!'}</div>

  return (
    <form onSubmit={submit} className="flex h-full w-full flex-col justify-center gap-2" onClick={(event) => event.stopPropagation()}>
      <div className="flex items-center gap-2">{source === 'newsletter' ? <Mail className="h-5 w-5" style={{ color: theme.vars.accent }} /> : <MessageSquare className="h-5 w-5" style={{ color: theme.vars.accent }} />}<h3 className="font-semibold" style={displayStyle(theme)}>{title}</h3></div>
      {description ? <p className="text-xs" style={mutedStyle(theme)}>{description}</p> : null}
      <div className={`mt-1 flex gap-2 ${source === 'form' ? 'flex-col' : ''}`}>
        {formFields.slice(0, source === 'form' ? 3 : 1).map((field) => {
          const isEmail = /e-?mail|mail/i.test(field)
          return <input key={field} required={source === 'form' || isEmail} type={isEmail ? 'email' : 'text'} value={values[field] || ''} onChange={(event) => setValues((current) => ({ ...current, [field]: event.target.value }))} placeholder={isEmail ? emailPlaceholder || field : field} className="min-w-0 flex-1 px-3 py-1.5 text-xs outline-none" style={{ border: `1px solid ${theme.vars.border}`, borderRadius: theme.radius, background: 'transparent', color: theme.vars.text }} />
        })}
        <button type="submit" disabled={submitting} className="shrink-0 px-3 py-1.5 text-xs font-semibold disabled:opacity-60" style={pillStyle(theme)}>{submitting ? 'Enviando...' : buttonText}</button>
      </div>
    </form>
  )
}
