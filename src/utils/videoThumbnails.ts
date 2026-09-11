/**
 * Deriva a thumbnail de um vídeo a partir da URL de embed/assistir.
 * Usado como fallback quando não há snapshot do oEmbed salvo no bloco.
 */
export function extractVideoThumbnail(url: string): string | null {
  if (!url) return null
  const yt = url.match(/(?:youtube\.com\/(?:embed\/|watch\?v=|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/)
  if (yt) return `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg`
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeo) return `https://vumbnail.com/${vimeo[1]}.jpg`
  return null
}

/**
 * Normaliza qualquer URL de vídeo conhecida (watch, youtu.be, shorts, vimeo)
 * para a URL de embed usável em <iframe>. Legacy: blocos antigos guardavam
 * a URL crua — sem isso o player não carregaria.
 */
export function toVideoEmbedUrl(url: string): string {
  if (!url) return ''
  const yt = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return url
}
