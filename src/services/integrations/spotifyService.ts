import type { SpotifyKind, SpotifyResolvedMeta } from '../../types'
import { cacheGet, cacheSet, cacheGetFlag, cacheSetFlag, cacheDelete } from './cache'
import { fetchJson, IntegrationError, stableStringify } from './http'

/**
 * Integração Spotify: oEmbed público para título/capa + página do embed
 * (metadata JSON) para artista/dono. Nenhum dos dois exige autenticação.
 * Chamada APENAS no editor; o snapshot é salvo no bloco e a página pública
 * nunca refaz essas chamadas.
 */

const SUCCESS_TTL = 6 * 60 * 60 * 1000 // 6h
const ERROR_TTL = 5 * 60 * 1000

const KIND_LABELS: Record<SpotifyKind, string> = {
  track: 'Música',
  album: 'Álbum',
  playlist: 'Playlist',
  artist: 'Artista',
  show: 'Podcast',
  episode: 'Episódio',
}

export function spotifyKindLabel(kind: SpotifyKind): string {
  return KIND_LABELS[kind] || 'Spotify'
}

interface OEmbedResponse {
  title?: string
  thumbnail_url?: string
}

/** Extrai tipo e id de links open.spotify.com ou URIs spotify:... */
export function parseSpotifyLink(link: string): { kind: SpotifyKind; id: string } | null {
  const raw = (link || '').trim()
  if (!raw) return null

  const uri = raw.match(/spotify:(track|album|playlist|artist|show|episode):([a-zA-Z0-9]+)/)
  if (uri) return { kind: uri[1] as SpotifyKind, id: uri[2] }

  const url = raw.match(
    /open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(track|album|playlist|artist|show|episode)\/([a-zA-Z0-9]+)/
  )
  if (url) return { kind: url[1] as SpotifyKind, id: url[2] }

  return null
}

function spotifySourceUrl(kind: SpotifyKind, id: string): string {
  return `https://open.spotify.com/${kind}/${id}`
}

function spotifyEmbedUrl(kind: SpotifyKind, id: string): string {
  return `https://open.spotify.com/embed/${kind}/${id}?utm_source=generator&theme=0`
}

function cacheKey(kind: SpotifyKind, id: string): string {
  return `spotify:${kind}:${id}`
}

/**
 * Busca título e capa via oEmbed público. O artista/dono não está disponível
 * no oEmbed e a página do embed não envia headers CORS — ou seja, num app
 * 100% client-side só conseguimos o nome quando o link É do artista (o título
 * do oEmbed nesse caso é o próprio nome). O bloco trata "owner" como opcional.
 * Nunca lança para falhas de rede — devolve degradado; só lança
 * IntegrationError quando o link é inválido.
 */
export async function resolveSpotifyLink(link: string, forceRefresh = false): Promise<SpotifyResolvedMeta> {
  const parsed = parseSpotifyLink(link)
  if (!parsed) {
    throw new IntegrationError('Link do Spotify não reconhecido (use música, álbum, playlist, artista ou podcast)')
  }

  const { kind, id } = parsed
  const key = cacheKey(kind, id)

  if (!forceRefresh) {
    const cached = cacheGet<SpotifyResolvedMeta>(key)
    if (cached) return cached
    if (cacheGetFlag(`${key}:err`)) {
      return degradedMeta(kind, id)
    }
  } else {
    cacheDelete(key)
    cacheDelete(`${key}:err`)
  }

  const meta: SpotifyResolvedMeta = degradedMeta(kind, id)

  try {
    const data = await fetchJson<OEmbedResponse>(
      `https://open.spotify.com/oembed?url=${encodeURIComponent(spotifySourceUrl(kind, id))}`
    )
    const resolved: SpotifyResolvedMeta = {
      ...meta,
      title: data.title || meta.title,
      // Para links de artista, o título do oEmbed É o nome do artista/dono.
      owner: kind === 'artist' ? data.title || undefined : undefined,
      thumbnailUrl: data.thumbnail_url || meta.thumbnailUrl,
      resolvedAt: new Date().toISOString(),
    }
    cacheSet(key, resolved, SUCCESS_TTL)
    return resolved
  } catch {
    cacheSetFlag(`${key}:err`, ERROR_TTL)
    return meta
  }
}

function degradedMeta(kind: SpotifyKind, id: string): SpotifyResolvedMeta {
  return {
    kind,
    id,
    embedUrl: spotifyEmbedUrl(kind, id),
    sourceUrl: spotifySourceUrl(kind, id),
  }
}

/** Serialização estável — útil se o snapshot passar por comparação. */
export function serializeSpotifyMeta(meta: SpotifyResolvedMeta): string {
  return stableStringify(meta)
}
