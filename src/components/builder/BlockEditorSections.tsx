import { useEffect, useRef, useState } from 'react'
import type {
  FaqBlockData,
  FaqItem,
  FormBlockData,
  GitHubBlockData,
  GalleryBlockData,
  NewsletterBlockData,
  SpotifyBlockData,
  VideoBlockData,
  YouTubeBlockData,
} from '../../types'
import { IntegrationError } from '../../services/integrations/http'
import { parseVideoUrl, resolveVideoUrl, youtubeThumbnail } from '../../services/integrations/videoService'
import { resolveSpotifyLink, spotifyKindLabel } from '../../services/integrations/spotifyService'
import { resolveGithubProfile } from '../../services/integrations/githubService'
import { MultiImageUpload } from './MultiImageUpload'
import { Loader2, RefreshCw, Plus, Trash2, ChevronUp, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react'

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

const focusStyle = 'focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]'

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-dim">{label}</span>
      {children}
      {hint ? <span className="text-[11px] text-faint">{hint}</span> : null}
    </label>
  )
}

/* ═══════════════════════════════════════════════════════════════
   HOOK — resolução deborada de integrações no editor
   ═══════════════════════════════════════════════════════════════ */

type ResolveState = 'idle' | 'loading' | 'ok' | 'error'

/**
 * Roda `resolver` (com debounce) sempre que `input` muda; `deps` são as
 * dependências extra (ex: id do bloco). Retorna estado + erro para a UI.
 * Estados só mudam dentro de callbacks assíncronos (timer/refresh) — o caso
 * desativado é derivado em render, sem setState síncrono no efeito.
 */
function useDebouncedResolve<T>(
  input: string,
  enabled: boolean,
  resolver: (input: string, force: boolean) => Promise<T>,
  onResolved: (result: T) => void,
  deps: unknown[],
  delay = 600
) {
  const [state, setState] = useState<ResolveState>('idle')
  const [error, setError] = useState<string | null>(null)
  const runIdRef = useRef(0)

  const active = enabled && Boolean(input.trim())

  useEffect(() => {
    if (!active) return
    const runId = ++runIdRef.current
    const timer = setTimeout(() => {
      setState('loading')
      setError(null)
      resolver(input, false)
        .then((result) => {
          if (runIdRef.current !== runId) return
          setState('ok')
          setError(null)
          onResolved(result)
        })
        .catch((err) => {
          if (runIdRef.current !== runId) return
          setState('error')
          setError(err instanceof IntegrationError ? err.message : 'Não foi possível carregar os dados')
        })
    }, delay)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, active, ...deps])

  async function refresh() {
    if (!input.trim()) return
    const runId = ++runIdRef.current
    setState('loading')
    setError(null)
    try {
      const result = await resolver(input, true)
      if (runIdRef.current !== runId) return
      setState('ok')
      onResolved(result)
    } catch (err) {
      if (runIdRef.current !== runId) return
      setState('error')
      setError(err instanceof IntegrationError ? err.message : 'Não foi possível carregar os dados')
    }
  }

  return { state: active ? state : 'idle', error: active ? error : null, refresh }
}

function StatusLine({ state, error }: { state: ResolveState; error: string | null }) {
  if (state === 'loading') {
    return (
      <span className="flex items-center gap-1.5 text-[11px] text-dim">
        <Loader2 className="h-3 w-3 animate-spin" />
        Buscando dados...
      </span>
    )
  }
  if (state === 'error' && error) {
    return (
      <span className="flex items-start gap-1.5 text-[11px]" style={{ color: 'var(--color-warning)' }}>
        <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
        {error}
      </span>
    )
  }
  if (state === 'ok') {
    return (
      <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--color-success)' }}>
        <CheckCircle2 className="h-3 w-3" />
        Dados carregados e salvos no bloco
      </span>
    )
  }
  return null
}

function RefreshButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-fit items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium text-dim transition-colors hover:text-ink disabled:opacity-50"
      style={{ borderColor: 'var(--color-border-strong)' }}
    >
      <RefreshCw className="h-3 w-3" />
      Atualizar dados
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════════
   VÍDEO / YOUTUBE — URL amigável + oEmbed no editor
   ═══════════════════════════════════════════════════════════════ */

export function VideoSection({
  data,
  blockId,
  onChange,
}: {
  data: VideoBlockData | YouTubeBlockData
  blockId: string
  onChange: (patch: Record<string, unknown>) => void
}) {
  const isYouTube = 'videoUrl' in data
  const rawUrl = (isYouTube ? (data as YouTubeBlockData).videoUrl : (data as VideoBlockData).sourceUrl) || ''
  const [urlDraft, setUrlDraft] = useState(rawUrl)
  // Dados mais recentes para o callback assíncrono (evita sobrescrever título
  // digitado pelo usuário enquanto o oEmbed resolvia).
  const latestDataRef = useRef(data)
  useEffect(() => {
    latestDataRef.current = data
  }, [data])

  // Troca de bloco: reinicia o rascunho a partir dos novos dados (durante o
  // render — o effect síncrono dispara erro do react-hooks/set-state-in-effect).
  const [lastBlockId, setLastBlockId] = useState(blockId)
  if (lastBlockId !== blockId) {
    setLastBlockId(blockId)
    setUrlDraft(rawUrl)
  }

  const parsed = parseVideoUrl(urlDraft)

  const { state, error, refresh } = useDebouncedResolve(
    urlDraft,
    Boolean(parsed),
    (input, force) => resolveVideoUrl(input, force),
    (meta) => {
      const patch: Record<string, unknown> = {
        resolved: meta,
        embedUrl: meta.embedUrl,
      }
      if (isYouTube) {
        patch.videoUrl = urlDraft.trim()
        if (!latestDataRef.current.title) patch.title = meta.title || 'Vídeo do YouTube'
      } else {
        patch.sourceUrl = urlDraft.trim()
        if (!latestDataRef.current.title) patch.title = meta.title || 'Vídeo'
      }
      onChange(patch)
    },
    [blockId, isYouTube]
  )

  return (
    <>
      <Field label="URL do vídeo" hint="Cole o link do YouTube ou Vimeo (watch, youtu.be, shorts, player...)">
        <input
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          className={`w-full rounded-lg px-3 py-2 text-sm text-ink outline-none transition-colors ${focusStyle}`}
          style={inputStyle}
          placeholder="https://youtube.com/watch?v=..."
        />
      </Field>

      <StatusLine state={state} error={error} />

      {parsed && (state === 'ok' || state === 'loading') ? (
        <div
          className="flex items-center gap-2 rounded-lg border p-2"
          style={{ borderColor: 'var(--color-border-strong)' }}
        >
          <img
            src={
              parsed.provider === 'youtube'
                ? youtubeThumbnail(parsed.videoId)
                : `https://vumbnail.com/${parsed.videoId}.jpg`
            }
            alt=""
            className="h-10 w-16 shrink-0 rounded object-cover"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.visibility = 'hidden'
            }}
          />
          <div className="min-w-0 text-xs">
            <p className="truncate font-medium text-ink">
              {state === 'loading' ? 'Carregando...' : data.resolved?.title || parsed.videoId}
            </p>
            <p className="truncate text-dim">
              {parsed.provider === 'youtube' ? 'YouTube' : 'Vimeo'} · {parsed.videoId}
            </p>
          </div>
        </div>
      ) : null}

      {data.resolved ? <RefreshButton onClick={() => void refresh()} disabled={state === 'loading'} /> : null}

      {/* Mantém o campo de embed manual para casos avançados (private embeds etc.) */}
      {!isYouTube ? (
        <Field label="URL de embed (avançado)">
          <input
            value={data.embedUrl || ''}
            onChange={(e) => onChange({ embedUrl: e.target.value })}
            className={`w-full rounded-lg px-3 py-2 text-sm text-ink outline-none transition-colors ${focusStyle}`}
            style={inputStyle}
            placeholder="https://www.youtube.com/embed/..."
          />
        </Field>
      ) : null}
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════
   GITHUB — username + snapshot da API pública
   ═══════════════════════════════════════════════════════════════ */

export function GitHubSection({
  data,
  blockId,
  onChange,
}: {
  data: GitHubBlockData
  blockId: string
  onChange: (patch: Record<string, unknown>) => void
}) {
  const [usernameDraft, setUsernameDraft] = useState(data.username || '')

  // Troca de bloco: reinicia o rascunho a partir dos novos dados.
  const [lastBlockId, setLastBlockId] = useState(blockId)
  if (lastBlockId !== blockId) {
    setLastBlockId(blockId)
    setUsernameDraft(data.username || '')
  }

  const { state, error, refresh } = useDebouncedResolve(
    usernameDraft,
    true,
    (input, force) => resolveGithubProfile(input, force),
    (profile) => {
      onChange({ username: profile.login, profile })
    },
    [blockId]
  )

  const profile = data.profile

  return (
    <>
      <Field label="Usuário do GitHub" hint="Ex: torvalds ou https://github.com/torvalds">
        <input
          value={usernameDraft}
          onChange={(e) => setUsernameDraft(e.target.value)}
          className={`w-full rounded-lg px-3 py-2 text-sm text-ink outline-none transition-colors ${focusStyle}`}
          style={inputStyle}
          placeholder="usuario"
        />
      </Field>

      <StatusLine state={state} error={error} />

      {profile ? (
        <div className="flex flex-col gap-2 rounded-lg border p-2" style={{ borderColor: 'var(--color-border-strong)' }}>
          <div className="flex items-center gap-2">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.login} className="h-8 w-8 rounded-full" />
            ) : null}
            <div className="min-w-0 text-xs">
              <p className="truncate font-medium text-ink">{profile.name || profile.login}</p>
              <p className="truncate text-dim">
                {profile.publicRepos} repos · {(profile.topLanguages || []).slice(0, 3).map((l) => l.name).join(', ')}
              </p>
            </div>
          </div>
          <RefreshButton onClick={() => void refresh()} disabled={state === 'loading'} />
        </div>
      ) : null}

      <label className="flex cursor-pointer items-center gap-2 select-none">
        <input
          type="checkbox"
          checked={data.showPinned}
          onChange={(e) => onChange({ showPinned: e.target.checked })}
          className="h-4 w-4 rounded accent-[var(--accent)]"
        />
        <span className="text-xs font-medium text-dim">Mostrar linguagens mais usadas</span>
      </label>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SPOTIFY — link + oEmbed no editor
   ═══════════════════════════════════════════════════════════════ */

export function SpotifySection({
  data,
  blockId,
  onChange,
}: {
  data: SpotifyBlockData
  blockId: string
  onChange: (patch: Record<string, unknown>) => void
}) {
  const [linkDraft, setLinkDraft] = useState(data.uri || '')

  // Troca de bloco: reinicia o rascunho a partir dos novos dados.
  const [lastBlockId, setLastBlockId] = useState(blockId)
  if (lastBlockId !== blockId) {
    setLastBlockId(blockId)
    setLinkDraft(data.uri || '')
  }

  const { state, error, refresh } = useDebouncedResolve(
    linkDraft,
    true,
    (input, force) => resolveSpotifyLink(input, force),
    (meta) => {
      onChange({ uri: linkDraft.trim(), variant: meta.kind, resolved: meta })
    },
    [blockId]
  )

  const resolved = data.resolved

  return (
    <>
      <Field label="Link do Spotify" hint="Música, álbum, playlist, artista ou podcast (via compartilhar → copiar link)">
        <input
          value={linkDraft}
          onChange={(e) => setLinkDraft(e.target.value)}
          className={`w-full rounded-lg px-3 py-2 text-sm text-ink outline-none transition-colors ${focusStyle}`}
          style={inputStyle}
          placeholder="https://open.spotify.com/track/..."
        />
      </Field>

      <StatusLine state={state} error={error} />

      {resolved ? (
        <div className="flex flex-col gap-2 rounded-lg border p-2" style={{ borderColor: 'var(--color-border-strong)' }}>
          <div className="flex items-center gap-2">
            {resolved.thumbnailUrl ? (
              <img src={resolved.thumbnailUrl} alt="" className="h-8 w-8 rounded object-cover" />
            ) : null}
            <div className="min-w-0 text-xs">
              <p className="truncate font-medium text-ink">{resolved.title || spotifyKindLabel(resolved.kind)}</p>
              {resolved.owner ? <p className="truncate text-dim">{resolved.owner}</p> : null}
            </div>
          </div>
          <RefreshButton onClick={() => void refresh()} disabled={state === 'loading'} />
        </div>
      ) : null}

      <label className="flex cursor-pointer items-center gap-2 select-none">
        <input
          type="checkbox"
          checked={data.autoplayEmbed === true}
          onChange={(e) => onChange({ autoplayEmbed: e.target.checked })}
          className="h-4 w-4 rounded accent-[var(--accent)]"
        />
        <span className="text-xs font-medium text-dim">Mostrar player do Spotify direto na página</span>
      </label>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════
   GALERIA — upload múltiplo
   ═══════════════════════════════════════════════════════════════ */

export function GallerySection({
  data,
  onChange,
}: {
  data: GalleryBlockData
  onChange: (patch: Record<string, unknown>) => void
}) {
  return (
    <Field label="Imagens da galeria">
      <MultiImageUpload images={data.images || []} onChange={(images) => onChange({ images })} />
    </Field>
  )
}

/* ═══════════════════════════════════════════════════════════════
   FORMULÁRIO — campos customizáveis
   ═══════════════════════════════════════════════════════════════ */

export function FormSection({
  data,
  onChange,
}: {
  data: FormBlockData
  onChange: (patch: Record<string, unknown>) => void
}) {
  const fields = data.fields?.length ? data.fields : ['Nome', 'E-mail']

  function setFields(next: string[]) {
    onChange({ fields: next })
  }

  return (
    <>
      <Field label="Campos do formulário" hint="Campos com “email” no nome viram e-mail; os demais são texto livre. Máx. 4.">
        <div className="flex flex-col gap-1.5">
          {fields.map((field, i) => (
            <div key={i} className="flex items-center gap-1">
              <input
                value={field}
                onChange={(e) => setFields(fields.map((f, j) => (j === i ? e.target.value : f)))}
                className={`min-w-0 flex-1 rounded-lg px-3 py-2 text-sm text-ink outline-none transition-colors ${focusStyle}`}
                style={inputStyle}
                placeholder="Nome do campo"
              />
              <button
                type="button"
                onClick={() => setFields(fields.filter((_, j) => j !== i))}
                disabled={fields.length <= 1}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-dim transition-colors hover:text-[var(--color-error)] disabled:opacity-30"
                style={{ borderColor: 'var(--color-border-strong)' }}
                aria-label="Remover campo"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {fields.length < 4 ? (
            <button
              type="button"
              onClick={() => setFields([...fields, `Campo ${fields.length + 1}`])}
              className="flex w-fit items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium text-dim transition-colors hover:text-ink"
              style={{ borderColor: 'var(--color-border-strong)' }}
            >
              <Plus className="h-3 w-3" />
              Adicionar campo
            </button>
          ) : null}
        </div>
      </Field>
      <Field label="Texto do botão">
        <input
          value={data.buttonText || ''}
          onChange={(e) => onChange({ buttonText: e.target.value })}
          className={`w-full rounded-lg px-3 py-2 text-sm text-ink outline-none transition-colors ${focusStyle}`}
          style={inputStyle}
          placeholder="Enviar"
        />
      </Field>
      <Field label="Mensagem de sucesso">
        <input
          value={data.successMessage || ''}
          onChange={(e) => onChange({ successMessage: e.target.value })}
          className={`w-full rounded-lg px-3 py-2 text-sm text-ink outline-none transition-colors ${focusStyle}`}
          style={inputStyle}
          placeholder="Mensagem enviada!"
        />
      </Field>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════
   NEWSLETTER — placeholder e botão
   ═══════════════════════════════════════════════════════════════ */

export function NewsletterSection({
  data,
  onChange,
}: {
  data: NewsletterBlockData
  onChange: (patch: Record<string, unknown>) => void
}) {
  return (
    <>
      <Field label="Placeholder do e-mail">
        <input
          value={data.placeholder || ''}
          onChange={(e) => onChange({ placeholder: e.target.value })}
          className={`w-full rounded-lg px-3 py-2 text-sm text-ink outline-none transition-colors ${focusStyle}`}
          style={inputStyle}
          placeholder="seu@email.com"
        />
      </Field>
      <Field label="Texto do botão">
        <input
          value={data.buttonText || ''}
          onChange={(e) => onChange({ buttonText: e.target.value })}
          className={`w-full rounded-lg px-3 py-2 text-sm text-ink outline-none transition-colors ${focusStyle}`}
          style={inputStyle}
          placeholder="Assinar"
        />
      </Field>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════
   FAQ — pares pergunta/resposta reordenáveis
   ═══════════════════════════════════════════════════════════════ */

export function FaqSection({
  data,
  onChange,
}: {
  data: FaqBlockData
  onChange: (patch: Record<string, unknown>) => void
}) {
  const items: FaqItem[] = data.items?.length ? data.items : []

  function setItems(next: FaqItem[]) {
    onChange({ items: next })
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= items.length) return
    const next = [...items]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    setItems(next)
  }

  return (
    <Field label="Perguntas e respostas">
      <div className="flex flex-col gap-2">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex flex-col gap-1.5 rounded-lg border p-2"
            style={{ borderColor: 'var(--color-border-strong)' }}
          >
            <div className="flex items-center gap-1">
              <input
                value={item.question}
                onChange={(e) => setItems(items.map((it, j) => (j === i ? { ...it, question: e.target.value } : it)))}
                className={`min-w-0 flex-1 rounded-lg px-2.5 py-1.5 text-sm text-ink outline-none transition-colors ${focusStyle}`}
                style={inputStyle}
                placeholder="Pergunta"
              />
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-dim transition-colors hover:text-ink disabled:opacity-30"
                style={{ borderColor: 'var(--color-border-strong)' }}
                aria-label="Mover para cima"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === items.length - 1}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-dim transition-colors hover:text-ink disabled:opacity-30"
                style={{ borderColor: 'var(--color-border-strong)' }}
                aria-label="Mover para baixo"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setItems(items.filter((_, j) => j !== i))}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-dim transition-colors hover:text-[var(--color-error)]"
                style={{ borderColor: 'var(--color-border-strong)' }}
                aria-label="Remover pergunta"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <textarea
              value={item.answer}
              onChange={(e) => setItems(items.map((it, j) => (j === i ? { ...it, answer: e.target.value } : it)))}
              rows={2}
              className={`w-full resize-none rounded-lg px-2.5 py-1.5 text-sm text-ink outline-none transition-colors ${focusStyle}`}
              style={inputStyle}
              placeholder="Resposta"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => setItems([...items, { question: 'Nova pergunta', answer: '' }])}
          className="flex w-fit items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium text-dim transition-colors hover:text-ink"
          style={{ borderColor: 'var(--color-border-strong)' }}
        >
          <Plus className="h-3 w-3" />
          Adicionar pergunta
        </button>
      </div>
    </Field>
  )
}
