import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type {
  Block,
  BlockSize,
  Density,
  BlockStyle,
  SubstituteContent,
  ResolvedVideoMeta,
  SpotifyResolvedMeta,
  SpotifyBlockData,
} from '../../types'
import { extractVideoThumbnail, toVideoEmbedUrl } from '../../utils/videoThumbnails'
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
  ChevronLeft,
  ChevronRight,
  Quote,
  X
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
  // Linhas com altura mínima — blocos mais altos (Formulário, FAQ, Depoimentos)
  // crescem com o conteúdo em vez de cortar no overflow.
  compact: { rows: 'auto-rows-[minmax(112px,auto)]', gap: 'gap-2' },
  standard: { rows: 'auto-rows-[minmax(128px,auto)]', gap: 'gap-3' },
  spaced: { rows: 'auto-rows-[minmax(140px,auto)]', gap: 'gap-4' },
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

export function PublicProfile({
  blocks,
  theme,
  className,
  preview = false,
}: {
  blocks: Block[]
  theme: PublicProfileTheme
  className?: string
  /** Modo de prévia dentro do editor: não conta views/cliques e não navega. */
  preview?: boolean
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
  // Prévias do próprio dono (preview === true) nunca contam analytics.
  useEffect(() => {
    if (preview) return
    const userId = blocks[0]?.userId
    if (!userId || resolved.length === 0) return

    const day = new Date().toISOString().slice(0, 10)
    const sessionKey = `getlink-analytics-viewed-${userId}-${day}`
    if (sessionStorage.getItem(sessionKey)) return
    sessionStorage.setItem(sessionKey, '1')
    void recordProfileView(userId, resolved.map((item) => item.block.id)).catch(() => {
      // Analytics must never interfere with viewing a public profile.
    })
  }, [blocks, resolved, preview])

  return (
    <div
      className={`gl-public min-h-full w-full px-4 py-8 sm:px-6 ${className || ''}`}
      style={{ background: theme.vars.bg, ...themeToCssVars(theme), ...(preview ? { cursor: 'default' } : {}) }}
      // Na prévia, bloqueia qualquer navegação/envio vindo dos blocos
      onClickCapture={preview ? (e) => e.preventDefault() : undefined}
      onSubmitCapture={preview ? (e) => e.preventDefault() : undefined}
    >
      {/* Estados de foco/hover dos elementos interativos da página pública,
          sempre derivados dos tokens do tema */}
      <style>{`
        .gl-public .gl-pill { transition: filter 0.15s ease, transform 0.15s ease; cursor: pointer; }
        .gl-public .gl-pill:hover { filter: brightness(1.08); transform: translateY(-1px); }
        .gl-public .gl-pill:active { transform: translateY(0); }
        .gl-public input.gl-field:focus, .gl-public textarea.gl-field:focus {
          border-color: var(--pv-accent) !important;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--pv-accent) 25%, transparent);
        }
        .gl-public input.gl-field::placeholder, .gl-public textarea.gl-field::placeholder { color: var(--pv-muted); }
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
              preview={preview}
            />
          ))}
        </div>
        <p className="mt-8 text-center text-xs" style={mutedStyle()}>
          Feito com BlockStack
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
  preview = false,
}: {
  block: Block
  theme: PublicProfileTheme
  mode?: ResolvedBlockMode
  clickUrl?: string
  substitute?: SubstituteContent
  preview?: boolean
}) {
  const content =
    mode === 'substitute' ? (
      <SubstituteBody substitute={substitute} />
    ) : (
      <ThemedBody block={block} preview={preview} />
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

  // Na prévia do editor, blocos clicáveis viram divisores simples: sem âncora,
  // sem navegação e sem registrar cliques.
  if (normalizedHref && !preview) {
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
    <div
      className={`${wrapperClass}${normalizedHref ? ' transition-transform duration-200' : ''}`}
      style={surfaceStyle(theme)}
    >
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

function ThemedBody({ block, preview = false }: { block: Block; preview?: boolean }) {
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
      return <LeadCapture block={block} source="newsletter" title={d.title || 'Newsletter'} description={d.description} buttonText={d.buttonText || 'Assinar'} emailPlaceholder={d.placeholder || 'seu@email.com'} preview={preview} />

    case 'gallery':
      return <GalleryFace images={d.images || []} />

    case 'video':
      return <VideoFace title={d.title || 'Vídeo'} embedUrl={d.embedUrl} resolved={d.resolved} />

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
      const profile = d.profile || null
      const profileUrl = (profile?.profileUrl as string) || (d.username ? `https://github.com/${d.username}` : undefined)
      const name = profile?.name || (d.username ? `@${d.username}` : 'GitHub')
      return (
        <div className="flex h-full w-full flex-col justify-between gap-2">
          <div className="flex items-center gap-2">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.login || d.username}
                className="h-9 w-9 shrink-0 rounded-full object-cover"
                style={{ boxShadow: '0 0 0 2px var(--pv-accent)' }}
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            ) : (
              <Code2 className="h-5 w-5 shrink-0" style={{ color: 'var(--pv-accent)' }} />
            )}
            <h3 className="min-w-0 truncate font-semibold" style={displayStyle()}>
              {name}
            </h3>
          </div>
          {profile ? (
            <>
              {profile.bio ? (
                <p className="text-xs leading-relaxed line-clamp-2" style={mutedStyle()}>
                  {profile.bio}
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className="px-2 py-0.5 text-[11px] font-semibold"
                  style={{
                    borderRadius: 'calc(var(--pv-radius) * 0.6)',
                    background: 'color-mix(in srgb, var(--pv-accent) 16%, transparent)',
                    color: 'var(--pv-accent)',
                  }}
                >
                  {profile.publicRepos} repos
                </span>
                {(d.showPinned !== false
                  ? (profile.topLanguages || []).slice(0, 3)
                  : []
                ).map((lang: { name: string }) => (
                  <span
                    key={lang.name}
                    className="px-2 py-0.5 text-[11px] font-medium"
                    style={{
                      borderRadius: 'calc(var(--pv-radius) * 0.6)',
                      border: '1px solid var(--pv-border)',
                      color: 'var(--pv-muted)',
                    }}
                  >
                    {lang.name}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs leading-relaxed" style={mutedStyle()}>
              Projetos, contribuições e estatísticas open source.
            </p>
          )}
          {profileUrl ? (
            <ActionPill href={normalizeUrl(profileUrl)}>
              Ver perfil no GitHub <ArrowUpRight className="h-3.5 w-3.5" />
            </ActionPill>
          ) : null}
        </div>
      )
    }

    case 'spotify':
      return <SpotifyFace data={block.data as SpotifyBlockData} />

    case 'youtube':
      return <VideoFace title={d.title || 'YouTube'} embedUrl={d.resolved?.embedUrl || d.videoUrl} resolved={d.resolved} brand="#FF0000" />

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
      return <LeadCapture block={block} source="form" title={d.title || 'Formulário'} description={d.description} buttonText={d.buttonText || 'Enviar'} fields={d.fields || ['Nome', 'E-mail']} successMessage={d.successMessage} preview={preview} />

    case 'faq':
      return <FaqAccordion title={d.title || 'FAQ'} items={d.items || []} />

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

/* ═════════════════════════════════════════════════════════════
   VÍDEO — thumbnail real (salva no snapshot pelo editor) com
   click-to-play: o clique troca a capa pelo player embutido no
   próprio bloco, sem sair da página. Sem thumbnail (vídeo privado,
   oEmbed falhou), mantém o fallback estilizado do tema.
   ═════════════════════════════════════════════════════════════ */

function VideoFace({
  title,
  embedUrl,
  resolved,
  brand,
}: {
  title: string
  embedUrl?: string
  resolved?: ResolvedVideoMeta | null
  brand?: string
}) {
  const [playing, setPlaying] = useState(false)
  // Snapshot salvo no editor; derivada da URL como último recurso.
  const thumbnail = resolved?.thumbnailUrl || extractVideoThumbnail(embedUrl || '') || null
  // Normaliza (legacy: blocos antigos guardavam a URL crua de watch/youtu.be).
  const playerUrl = toVideoEmbedUrl(resolved?.embedUrl || embedUrl || '')

  if (playing && playerUrl) {
    return (
      <div
        className="relative h-full w-full overflow-hidden"
        style={{
          borderRadius: 'var(--pv-radius)',
          border: '1px solid var(--pv-border)',
          background: '#000000',
        }}
      >
        <iframe
          src={`${playerUrl}${playerUrl.includes('?') ? '&' : '?'}autoplay=1`}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          title={resolved?.title || title}
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => playerUrl && setPlaying(true)}
      className="relative flex h-full w-full items-center justify-center overflow-hidden text-left"
      style={{
        borderRadius: 'var(--pv-radius)',
        border: '1px solid var(--pv-border)',
        background: thumbnail ? '#000000' : 'color-mix(in srgb, var(--pv-text) 6%, transparent)',
        cursor: playerUrl ? 'pointer' : 'default',
      }}
      aria-label={resolved?.title || title}
    >
      {thumbnail ? (
        <img
          src={thumbnail}
          alt={resolved?.title || title}
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
        className="pointer-events-none absolute inset-x-0 bottom-0 truncate px-3 py-1.5 text-sm font-medium"
        style={{
          color: thumbnail ? '#FFFFFF' : 'var(--pv-text)',
          background: thumbnail
            ? 'linear-gradient(transparent, rgba(0,0,0,0.7))'
            : 'transparent',
        }}
      >
        {resolved?.title || title}
      </span>
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════
   GALERIA — grid real a partir das imagens cadastradas; o grid de
   placeholders só aparece quando NÃO há nenhuma imagem. Clique abre
   lightbox simples (sem sair da página).
   ═══════════════════════════════════════════════════════════ */

function GalleryFace({ images }: { images: { url: string; caption?: string }[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const hasImages = images.length > 0

  useEffect(() => {
    if (lightboxIndex === null) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setLightboxIndex(null)
      if (event.key === 'ArrowRight') setLightboxIndex((i) => (i === null ? null : Math.min(i + 1, images.length - 1)))
      if (event.key === 'ArrowLeft') setLightboxIndex((i) => (i === null ? null : Math.max(i - 1, 0)))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxIndex, images.length])

  if (!hasImages) {
    return (
      <div className="grid h-full w-full grid-cols-2 gap-2">
        {[0, 1, 2, 3].map((i) => (
          <PagePlaceholder key={i} icon={<ImageIcon className="h-5 w-5" />} />
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="grid h-full w-full grid-cols-2 gap-2 overflow-y-auto">
        {images.map((img, i) => (
          <button
            key={`${img.url}-${i}`}
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              setLightboxIndex(i)
            }}
            className="group relative min-h-0 overflow-hidden"
            style={{ borderRadius: 'calc(var(--pv-radius) * 0.8)' }}
            aria-label={img.caption || `Abrir imagem ${i + 1}`}
          >
            <img
              src={img.url}
              alt={img.caption || `Imagem ${i + 1}`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {lightboxIndex !== null
        ? createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 animate-fade-in"
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
          {lightboxIndex > 0 ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                setLightboxIndex(lightboxIndex - 1)
              }}
              className="absolute left-3 flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Imagem anterior"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          ) : null}
          <img
            src={images[lightboxIndex].url}
            alt={images[lightboxIndex].caption || `Imagem ${lightboxIndex + 1}`}
            className="max-h-full max-w-full rounded-lg object-contain"
            onClick={(event) => event.stopPropagation()}
          />
          {lightboxIndex < images.length - 1 ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                setLightboxIndex(lightboxIndex + 1)
              }}
              className="absolute right-3 flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Próxima imagem"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          ) : null}
        </div>,
          // Portal para o body: o backdrop-filter da superfície de vidro cria um
          // containing block que prenderia o overlay position:fixed no bloco.
          document.body
        )
        : null}
    </>
  )
}

/* ═══════════════════════════════════════════════════════════
   SPOTIFY — capa/título/artista do snapshot salvo no editor;
   play embute o player compacto no próprio bloco (ou direto,
   se o dono marcou "mostrar player").
   ═══════════════════════════════════════════════════════════ */

function SpotifyFace({ data }: { data: SpotifyBlockData }) {
  const [showPlayer, setShowPlayer] = useState(false)
  const resolved: SpotifyResolvedMeta | null = data.resolved || null
  const embedUrl = resolved?.embedUrl || (data.uri ? `https://open.spotify.com/embed/${parseSpotifyKindId(data.uri)}` : '')

  if (!resolved && !data.uri) {
    return (
      <div className="flex h-full w-full flex-col justify-between gap-2">
        <div className="flex items-center gap-2">
          <Headphones className="h-5 w-5" style={{ color: '#1DB954' }} />
          <h3 className="font-semibold" style={displayStyle()}>Spotify</h3>
        </div>
        <p className="text-xs" style={mutedStyle()}>
          Cole o link de uma música, álbum ou playlist no editor.
        </p>
      </div>
    )
  }

  if (data.autoplayEmbed && embedUrl) {
    return (
      <iframe
        src={embedUrl}
        width="100%"
        height={resolved?.kind === 'track' ? 80 : 152}
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        style={{ borderRadius: 'var(--pv-radius)', border: 0 }}
        title={resolved?.title || 'Spotify'}
      />
    )
  }

  const cover = resolved?.thumbnailUrl

  if (showPlayer && embedUrl) {
    return (
      <iframe
        src={embedUrl}
        width="100%"
        height={resolved?.kind === 'track' ? 80 : 152}
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        style={{ borderRadius: 'var(--pv-radius)', border: 0 }}
        title={resolved?.title || 'Spotify'}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        if (embedUrl) setShowPlayer(true)
      }}
      className="flex h-full w-full flex-col justify-between gap-2 text-left"
    >
      <div className="flex min-w-0 items-center gap-2">
        {cover ? (
          <img
            src={cover}
            alt={resolved?.title || 'Spotify'}
            className="h-11 w-11 shrink-0 rounded object-cover"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded"
            style={{ background: 'color-mix(in srgb, #1DB954 18%, transparent)' }}
          >
            <Headphones className="h-5 w-5" style={{ color: '#1DB954' }} />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="truncate font-semibold" style={displayStyle()}>
            {resolved?.title || 'Spotify'}
          </h3>
          {resolved?.owner ? (
            <p className="truncate text-xs" style={mutedStyle()}>{resolved.owner}</p>
          ) : null}
        </div>
      </div>
      <span
        className="gl-pill inline-flex w-fit items-center gap-1.5 px-4 py-2 text-sm font-semibold"
        style={{
          borderRadius: 'var(--pv-radius)',
          background: '#1DB954',
          color: '#FFFFFF',
          boxShadow: '0 2px 12px color-mix(in srgb, #1DB954 25%, transparent)',
        }}
      >
        <Play className="h-4 w-4 fill-current" />
        Ouvir
      </span>
    </button>
  )
}

/** Extrai "kind/id" de um link ou URI salvo (usado só como fallback local). */
function parseSpotifyKindId(uri: string): string | null {
  const m = uri.match(/(?:spotify:(track|album|playlist|artist|show|episode):|open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(?:track|album|playlist|artist|show|episode)\/)([a-zA-Z0-9]+)/)
  return m ? `${m[1]}/${m[2]}` : null
}

/* ═══════════════════════════════════════════════════════════
   FAQ — acordeão com todas as perguntas, uma aberta por vez.
   ═══════════════════════════════════════════════════════════ */

function FaqAccordion({ title, items }: { title: string; items: { question: string; answer: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (items.length === 0) {
    return (
      <div className="flex h-full w-full flex-col justify-between gap-2">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" style={{ color: 'var(--pv-accent)' }} />
          <h3 className="font-semibold" style={displayStyle()}>{title}</h3>
        </div>
        <p className="text-xs" style={mutedStyle()}>
          Cadastre perguntas frequentes no editor.
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col gap-2 overflow-y-auto">
      <div className="flex items-center gap-2">
        <HelpCircle className="h-5 w-5" style={{ color: 'var(--pv-accent)' }} />
        <h3 className="font-semibold" style={displayStyle()}>{title}</h3>
      </div>
      <div className="flex flex-col gap-1.5">
        {items.map((item, i) => {
          const open = openIndex === i
          return (
            <div key={i} className="rounded-lg" style={{ background: 'color-mix(in srgb, var(--pv-text) 6%, transparent)' }}>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  setOpenIndex(open ? null : i)
                }}
                className="gl-faq-row flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-xs font-medium"
                style={{ color: 'var(--pv-text)' }}
                aria-expanded={open}
              >
                <span>{item.question}</span>
                <ChevronDown
                  className={`h-3 w-3 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                  style={{ color: 'var(--pv-muted)' }}
                />
              </button>
              {open ? (
                <div className="px-3 pb-2">
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--pv-muted)' }}>
                    {item.answer}
                  </p>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
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
  preview = false,
}: {
  block: Block
  source: 'newsletter' | 'form'
  title: string
  description?: string
  buttonText: string
  emailPlaceholder?: string
  fields?: string[]
  successMessage?: string
  /** Na prévia do editor, o envio é demonstrativo — não grava na Audiência. */
  preview?: boolean
}) {
  // Campos com nome de mensagem viram textarea — caixa de resposta do visitante.
  const isMessageField = (field: string) => /mensagem|message|texto|textarea|biografia/i.test(field)
  const [values, setValues] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const formFields = source === 'newsletter' ? ['E-mail'] : fields || ['Nome', 'E-mail']
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  /** Validação básica antes de salvar: obrigatórios + formato de e-mail. */
  function validate(): string | null {
    const emailField = formFields.find((field) => /e-?mail|mail/i.test(field))
    for (const field of formFields) {
      const value = (values[field] || '').trim()
      if (!value) return `Preencha o campo "${field}".`
      if (field === emailField && !EMAIL_RE.test(value)) return 'Informe um e-mail válido.'
    }
    return null
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    if (!block.userId) {
      setError('Não foi possível enviar agora.')
      return
    }
    const emailField = formFields.find((field) => /e-?mail|mail/i.test(field)) || 'E-mail'
    const nameField = formFields.find((field) => /nome|name/i.test(field))
    const messageField = formFields.find((field) => /mensagem|message|texto/i.test(field))
    const extraFields = formFields.filter(
      (field) => field !== emailField && field !== nameField && field !== messageField
    )
    const message = messageField
      ? (values[messageField] || '').trim()
      : extraFields.length > 0
        ? extraFields.map((field) => `${field}: ${(values[field] || '').trim()}`).join(' · ')
        : undefined

    setSubmitting(true)
    try {
      if (!preview) {
        // Respostas estruturadas campo-a-campo — exibidas no inbox da Audiência.
        const structured = formFields.reduce<Record<string, string>>((acc, field) => {
          const value = (values[field] || '').trim()
          if (value) acc[field] = value
          return acc
        }, {})
        await createLead({
          userId: block.userId,
          blockId: block.id,
          name: nameField ? (values[nameField] || '').trim() : '',
          email: (values[emailField] || '').trim(),
          source,
          sourceLabel: `${source === 'newsletter' ? 'Newsletter' : 'Formulário'}: ${title}`,
          message: message || undefined,
          fields: structured,
        })
      }
      setSubmitted(true)
    } catch (submissionError) {
      // Mantém o detalhe técnico no console para diagnóstico sem exibir
      // informações internas do Firestore para quem preenche o formulário.
      console.error('[LeadCapture] Falha no envio', submissionError)
      const code = (submissionError as { code?: string } | null)?.code
      if (code === 'permission-denied') {
        setError('O envio não foi autorizado. Verifique as regras do Firestore.')
      } else if (code === 'unavailable' || code === 'deadline-exceeded') {
        setError('Não foi possível conectar ao serviço. Desative bloqueadores e tente novamente.')
      } else {
        setError('Não foi possível enviar. Tente novamente.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  /** Um campo do formulário — “Mensagem” e similares viram textarea. */
  function renderFieldInput(field: string) {
    const isEmail = /e-?mail|mail/i.test(field)
    if (isMessageField(field)) {
      return (
        <textarea
          key={field}
          required={source === 'form'}
          rows={4}
          value={values[field] || ''}
          onChange={(event) => {
            setValues((current) => ({ ...current, [field]: event.target.value }))
            if (error) setError(null)
          }}
          placeholder={field}
          className="gl-field resize-none"
          style={{ ...inputStyle(), flex: undefined, width: '100%' }}
        />
      )
    }
    return (
      <input
        key={field}
        required={source === 'form' || isEmail}
        type={isEmail ? 'email' : 'text'}
        value={values[field] || ''}
        onChange={(event) => {
          setValues((current) => ({ ...current, [field]: event.target.value }))
          if (error) setError(null)
        }}
        placeholder={isEmail ? emailPlaceholder || field : field}
        className="gl-field"
        style={inputStyle()}
      />
    )
  }

  if (submitted) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-center">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold"
          style={{ background: 'var(--pv-accent)', color: 'var(--pv-accent-text)' }}
        >
          ✓
        </span>
        <p className="text-sm font-semibold" style={displayStyle()}>
          {successMessage || 'Mensagem enviada!'}
        </p>
      </div>
    )
  }

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
        {(source === 'newsletter' ? formFields : formFields.slice(0, 4)).map((field) => renderFieldInput(field))}
        <ActionPill type="submit" disabled={submitting}>
          {submitting ? 'Enviando...' : buttonText}
        </ActionPill>
      </div>
      {error ? (
        <p className="text-xs" style={{ color: '#EF4444' }} role="alert">
          {error}
        </p>
      ) : null}
    </form>
  )
}
