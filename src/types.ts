import type { Timestamp } from 'firebase/firestore'

/* ═══════════════════════════════════════════════════════════════
   LEGACY TYPES
   ═══════════════════════════════════════════════════════════════ */

export interface Link {
  id: string
  title: string
  url: string
  description?: string
  userId: string
  createdAt?: any
  clicks?: number
  order?: number
  isActive?: boolean
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  themeColor: string;
  createdAt: any;
}

export type LinkInput = Omit<Link, 'id' | 'createdAt' | 'clicks' | 'order'>

export type LinkWithId = Required<Pick<Link, 'id' | 'title' | 'url' | 'userId'>> & Omit<Link, 'id' | 'title' | 'url' | 'userId'>

/* ═══════════════════════════════════════════════════════════════
   BLOCK SYSTEM — BlockStack Style
   ═══════════════════════════════════════════════════════════════ */

export type BlockType =
  | 'header'
  | 'link'
  | 'product'
  | 'service'
  | 'gallery'
  | 'video'
  | 'text'
  | 'newsletter'
  | 'socials'
  | 'github'
  | 'spotify'
  | 'youtube'
  | 'calendar'
  | 'form'
  | 'faq'
  | 'testimonial'

export type BlockSize = '1x1' | '2x1' | '2x2' | 'full'

export interface HeaderBlockData {
  displayName: string
  bio: string
  avatarUrl: string
}

export interface LinkBlockData {
  title: string
  url: string
  description: string
  schedule?: BlockSchedule
  smart?: SmartVariation | null
}

export interface ProductBlockData {
  title: string
  description: string
  imageUrl: string
  price: string
  linkUrl: string
  schedule?: BlockSchedule
  smart?: SmartVariation | null
}

export interface ServiceBlockData {
  title: string
  description: string
  actionLabel: string
  actionUrl: string
  schedule?: BlockSchedule
  smart?: SmartVariation | null
}

/* ═══════════════════════════════════════════════════════════════
   BLOCK SCHEDULE — janela de publicação e expiração
   ═══════════════════════════════════════════════════════════════ */

export type AfterExpiryBehavior = 'hide' | 'redirect' | 'replace'

export interface SubstituteContent {
  title: string
  description: string
  buttonLabel?: string
  buttonUrl?: string
}

export interface BlockSchedule {
  /** Data/hora de início da publicação — antes dela o bloco fica oculto */
  startsAt?: Timestamp | null
  /** Data/hora de expiração — depois dela aplica-se `afterExpiry` */
  expiresAt?: Timestamp | null
  /** Comportamento após a expiração (padrão: 'hide') */
  afterExpiry?: AfterExpiryBehavior
  /** Id do bloco-alvo usado quando `afterExpiry === 'redirect'` */
  redirectBlockId?: string | null
  /** Conteúdo do substituto usado quando `afterExpiry === 'replace'` */
  substitute?: SubstituteContent
}

/* ═══════════════════════════════════════════════════════════════
   SMART BLOCKS — variação de conteúdo por origem do tráfego
   ═══════════════════════════════════════════════════════════════ */

export type TrafficSource = 'instagram' | 'youtube' | 'linkedin' | 'google' | 'other'

export interface SmartVariation {
  /** Origem que dispara a variação */
  source: TrafficSource
  /** Campos opcionais — string vazia ou ausente mantém o conteúdo original */
  title?: string
  description?: string
  /** Destino principal: link.url / product.linkUrl / service.actionUrl */
  url?: string
  price?: string
  imageUrl?: string
  actionLabel?: string
}

export const TRAFFIC_SOURCE_LABELS: Record<TrafficSource, string> = {
  instagram: 'Instagram',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  google: 'Google',
  other: 'Outro',
}

export interface GalleryBlockData {
  images: { url: string; caption?: string }[]
}

/* ═══════════════════════════════════════════════════════════════
   SNAPSHOTS DE INTEGRAÇÕES — resolvidos no editor via serviços
   externos (oEmbed / API pública) e salvos junto ao bloco. A página
   pública NUNCA refaz essas chamadas: apenas exibe o snapshot.
   ═══════════════════════════════════════════════════════════════ */

export type VideoProvider = 'youtube' | 'vimeo'

/** Resultado do oEmbed de YouTube/Vimeo resolvido no editor. */
export interface ResolvedVideoMeta {
  provider: VideoProvider
  videoId: string
  title?: string
  authorName?: string
  thumbnailUrl?: string
  embedUrl: string
  /** ISO date — permite ao editor sugerir "Atualizar dados" */
  resolvedAt?: string
}

export interface VideoBlockData {
  title: string
  embedUrl: string
  /** URL original colada pelo usuário (watch link, youtu.be etc.) */
  sourceUrl?: string
  /** Snapshot do oEmbed — ausente = fallback gracioso (sem thumbnail) */
  resolved?: ResolvedVideoMeta | null
}

export interface TextBlockData {
  content: string
}

export interface NewsletterBlockData {
  title: string
  description: string
  placeholder: string
  buttonText: string
}

export interface SocialsBlockData {
  items: { platform: string; url: string }[]
}


/** Snapshot do perfil GitHub (API pública) resolvido no editor. */
export interface GitHubProfileSnapshot {
  login: string
  name?: string
  bio?: string
  avatarUrl?: string
  profileUrl: string
  publicRepos: number
  /** Linguagens mais usadas (contagem ponderada por estrelas) */
  topLanguages?: { name: string; count: number }[]
  resolvedAt?: string
}

export interface GitHubBlockData {
  username: string
  showPinned: boolean
  /** Snapshot resolvido no editor — página pública não chama a API */
  profile?: GitHubProfileSnapshot | null
}

export type SpotifyKind = 'track' | 'album' | 'playlist' | 'artist' | 'show' | 'episode'

/** Snapshot do oEmbed do Spotify (+ meta do embed) resolvido no editor. */
export interface SpotifyResolvedMeta {
  kind: SpotifyKind
  id: string
  title?: string
  /** Artista (track/album) ou dono (playlist/artist) */
  owner?: string
  thumbnailUrl?: string
  embedUrl?: string
  sourceUrl?: string
  resolvedAt?: string
}

export interface SpotifyBlockData {
  uri: string
  variant: SpotifyKind
  /** Snapshot resolvido no editor — página pública não refaz oEmbed */
  resolved?: SpotifyResolvedMeta | null
  /** Quando true, a página pública renderiza o player compacto direto */
  autoplayEmbed?: boolean
}

export interface YouTubeBlockData {
  videoUrl: string
  title: string
  /** Snapshot do oEmbed — ausente = fallback (thumbnail derivada do ID) */
  resolved?: ResolvedVideoMeta | null
}

export interface CalendarBlockData {
  title: string
  description: string
  calUrl: string
  availableHours: string
}

export interface FormBlockData {
  title: string
  /** Subtítulo opcional exibido abaixo do título do formulário */
  description: string
  fields: string[]
  buttonText: string
  successMessage: string
}

export interface FaqItem {
  question: string
  answer: string
}

export interface FaqBlockData {
  title: string
  items: FaqItem[]
}

export interface TestimonialItem {
  name: string
  role: string
  text: string
  avatarUrl: string
}

export interface TestimonialBlockData {
  title: string
  items: TestimonialItem[]
}

export type BlockDataMap = {
  header: HeaderBlockData
  link: LinkBlockData
  product: ProductBlockData
  service: ServiceBlockData
  gallery: GalleryBlockData
  video: VideoBlockData
  text: TextBlockData
  newsletter: NewsletterBlockData
  socials: SocialsBlockData
  github: GitHubBlockData
  spotify: SpotifyBlockData
  youtube: YouTubeBlockData
  calendar: CalendarBlockData
  form: FormBlockData
  faq: FaqBlockData
  testimonial: TestimonialBlockData
}

export interface Block<T extends BlockType = BlockType> {
  id: string
  type: T
  size: BlockSize
  order: number
  userId: string
  data: BlockDataMap[T]
}

/* ═══════════════════════════════════════════════════════════════
   BLOCK TYPE DEFINITIONS
   ═══════════════════════════════════════════════════════════════ */

export interface BlockTypeDef {
  type: BlockType
  label: string
  description: string
  defaultSize: BlockSize
  allowedSizes: BlockSize[]
}

export const BLOCK_LIBRARY: BlockTypeDef[] = [
  {
    type: 'header',
    label: 'Cabeçalho',
    description: 'Sua foto, nome e bio',
    defaultSize: 'full',
    allowedSizes: ['full', '2x1'],
  },
  {
    type: 'link',
    label: 'Link',
    description: 'Botão para qualquer URL',
    defaultSize: '2x1',
    allowedSizes: ['1x1', '2x1'],
  },
  {
    type: 'product',
    label: 'Produto',
    description: 'Item com preço e imagem',
    defaultSize: '2x2',
    allowedSizes: ['2x1', '2x2'],
  },
  {
    type: 'service',
    label: 'Serviço',
    description: 'Agendamento ou orçamento',
    defaultSize: '2x1',
    allowedSizes: ['1x1', '2x1', '2x2'],
  },
  {
    type: 'gallery',
    label: 'Galeria',
    description: 'Grade de imagens',
    defaultSize: '2x2',
    allowedSizes: ['2x1', '2x2'],
  },
  {
    type: 'video',
    label: 'Vídeo',
    description: 'YouTube, Vimeo, embed',
    defaultSize: '2x2',
    allowedSizes: ['2x1', '2x2'],
  },
  {
    type: 'text',
    label: 'Texto',
    description: 'Bloco de texto livre',
    defaultSize: '2x1',
    allowedSizes: ['1x1', '2x1', 'full'],
  },
  {
    type: 'newsletter',
    label: 'Newsletter',
    description: 'Captura de e-mails',
    defaultSize: '2x1',
    allowedSizes: ['2x1', 'full'],
  },
  {
    type: 'socials',
    label: 'Redes sociais',
    description: 'Ícones de perfis',
    defaultSize: '1x1',
    allowedSizes: ['1x1', '2x1'],
  },
  {
    type: 'github',
    label: 'GitHub',
    description: 'Perfil ou repositório',
    defaultSize: '2x1',
    allowedSizes: ['2x1', '2x2'],
  },
  {
    type: 'spotify',
    label: 'Spotify',
    description: 'Música ou playlist embed',
    defaultSize: '2x1',
    allowedSizes: ['2x1', 'full'],
  },
  {
    type: 'youtube',
    label: 'YouTube',
    description: 'Embed de vídeo',
    defaultSize: '2x2',
    allowedSizes: ['2x1', '2x2'],
  },
  {
    type: 'calendar',
    label: 'Agendamento',
    description: 'Marque um horário',
    defaultSize: '2x1',
    allowedSizes: ['2x1', 'full'],
  },
  {
    type: 'form',
    label: 'Formulário',
    description: 'Captura de contatos',
    defaultSize: '2x1',
    allowedSizes: ['2x1', 'full'],
  },
  {
    type: 'faq',
    label: 'FAQ',
    description: 'Perguntas frequentes',
    defaultSize: 'full',
    allowedSizes: ['2x1', 'full'],
  },
  {
    type: 'testimonial',
    label: 'Depoimentos',
    description: 'Avaliações de clientes',
    defaultSize: '2x2',
    allowedSizes: ['2x1', '2x2', 'full'],
  },
]

export const SIZE_LABELS: Record<BlockSize, string> = {
  '1x1': 'Pequeno',
  '2x1': 'Largo',
  '2x2': 'Grande',
  'full': 'Faixa',
}

/* ═══════════════════════════════════════════════════════════════
   PAGE DESIGN SETTINGS
   ═══════════════════════════════════════════════════════════════ */

export type DesignPreset = 'neon' | 'editorial' | 'minimal-mono' | 'sunset' | 'brutalist'
export type TitleFont = 'grotesk' | 'sans' | 'serifada' | 'mono'
export type BlockStyle = 'filled' | 'outline' | 'glass'
export type Density = 'compact' | 'standard' | 'spaced'
export type CornerStyle = 'sharp' | 'soft' | 'medium' | 'round'

export interface PageSettings {
  preset: DesignPreset
  accentColor: string
  titleFont: TitleFont
  blockStyle: BlockStyle
  density: Density
  corners: CornerStyle
  /** Quando true, a página fica acessível publicamente em /:username */
  published?: boolean
  /** Data/hora da última publicação (Timestamp do Firestore ou ISO em cache local) */
  publishedAt?: any
}

export const DEFAULT_PAGE_SETTINGS: PageSettings = {
  preset: 'neon',
  accentColor: '#8B5CF6',
  titleFont: 'grotesk',
  blockStyle: 'glass',
  density: 'standard',
  corners: 'medium',
  published: false,
  publishedAt: null,
}
