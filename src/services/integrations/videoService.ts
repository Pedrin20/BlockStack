import type { ResolvedVideoMeta, VideoProvider } from '../../types'
import { cacheGet, cacheSet, cacheGetFlag, cacheSetFlag, cacheDelete } from './cache'
import { fetchJson, IntegrationError, stableStringify } from './http'

/**
 * Integração de vídeo (YouTube / Vimeo) via oEmbed público — sem API key.
 * Chamada APENAS no editor quando o usuário insere/edita a URL; o resultado
 * é salvo no snapshot do bloco e a página pública só exibe o que já foi salvo.
 */

const SUCCESS_TTL = 6 * 60 * 60 * 1000 // 6h
const ERROR_TTL = 5 * 60 * 1000 // 5min — erro recente não é reconsultado em sequência

interface OEmbedResponse {
  title?: string
  author_name?: string
  thumbnail_url?: string
  html?: string
}

export function parseVideoUrl(url: string): { provider: VideoProvider; videoId: string } | null {
  const raw = (url || '').trim()
  if (!raw) return null

  // YouTube: watch?v=, youtu.be/, /shorts/, /embed/, /live/
  const yt = raw.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/
  )
  if (yt) return { provider: 'youtube', videoId: yt[1] }

  // Vimeo: vimeo.com/123, player.vimeo.com/video/123, /video/123:hash
  const vimeo = raw.match(/vimeo\.com\/(?:video\/)?(\d+)(?::[\w-]+)?(?:\/[\w-]+)?/)
  if (vimeo) return { provider: 'vimeo', videoId: vimeo[1] }

  return null
}

export function youtubeThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
}

/** URL de embed canônica — usada no editor antes mesmo do oEmbed responder. */
export function videoEmbedUrl(provider: VideoProvider, videoId: string): string {
  return provider === 'youtube'
    ? `https://www.youtube.com/embed/${videoId}`
    : `https://player.vimeo.com/video/${videoId}`
}

function cacheKey(provider: VideoProvider, videoId: string): string {
  return `video:${provider}:${videoId}`
}

/**
 * Resolve a URL para o snapshot do bloco. Nunca lança — em caso de falha
 * devolve um resultado degradado (sem thumbnail/título) para o bloco
 * continuar renderizando com o fallback estilizado.
 */
export async function resolveVideoUrl(url: string, forceRefresh = false): Promise<ResolvedVideoMeta> {
  const parsed = parseVideoUrl(url)
  if (!parsed) {
    throw new IntegrationError('URL de vídeo não reconhecida (use YouTube ou Vimeo)')
  }

  const key = cacheKey(parsed.provider, parsed.videoId)

  if (!forceRefresh) {
    const cached = cacheGet<ResolvedVideoMeta>(key)
    if (cached) return cached
    if (cacheGetFlag(`${key}:err`)) {
      // Falhou há pouco — devolve degradado sem refazer a chamada
      return degradedMeta(parsed.provider, parsed.videoId)
    }
  } else {
    cacheDelete(key)
    cacheDelete(`${key}:err`)
  }

  const oembedUrl =
    parsed.provider === 'youtube'
      ? `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${parsed.videoId}`)}&format=json`
      : `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(`https://vimeo.com/${parsed.videoId}`)}`

  try {
    const data = await fetchJson<OEmbedResponse>(oembedUrl)
    const meta: ResolvedVideoMeta = {
      provider: parsed.provider,
      videoId: parsed.videoId,
      title: data.title || undefined,
      authorName: data.author_name || undefined,
      thumbnailUrl: data.thumbnail_url || (parsed.provider === 'youtube' ? youtubeThumbnail(parsed.videoId) : undefined),
      embedUrl: videoEmbedUrl(parsed.provider, parsed.videoId),
      resolvedAt: new Date().toISOString(),
    }
    cacheSet(key, meta, SUCCESS_TTL)
    return meta
  } catch {
    cacheSetFlag(`${key}:err`, ERROR_TTL)
    // Fallback gracioso: vídeo privado, embed desabilitado ou oEmbed fora.
    // Para YouTube ainda dá para derivar a thumbnail do ID diretamente.
    const meta = degradedMeta(parsed.provider, parsed.videoId)
    if (meta.thumbnailUrl) return meta
    throw new IntegrationError('Não foi possível obter os dados do vídeo')
  }
}

function degradedMeta(provider: VideoProvider, videoId: string): ResolvedVideoMeta {
  return {
    provider,
    videoId,
    thumbnailUrl: provider === 'youtube' ? youtubeThumbnail(videoId) : undefined,
    embedUrl: videoEmbedUrl(provider, videoId),
  }
}

/** Serialização estável — útil se o snapshot passar por comparação. */
export function serializeVideoMeta(meta: ResolvedVideoMeta): string {
  return stableStringify(meta)
}
