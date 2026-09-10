import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Lock } from 'lucide-react'
import { useUserProfile } from '../hooks/useUserProfile'
import { useAuth } from '../hooks/useAuth'
import { fetchUserBlocks, fetchPageSettings } from '../services/blockService'
import type { Block, PageSettings } from '../types'
import { DEFAULT_PAGE_SETTINGS } from '../types'
import { PublicProfile as PublicProfileComponent } from '../components/public/PublicProfile'
import { getFontFamily, getPresetVars, getRadius } from '../lib/publicPresets'

function ProfileOfflineScreen() {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: 'var(--color-background)', color: 'var(--color-text-secondary)' }}
    >
      <div className="w-full max-w-md rounded-2xl p-8 text-center" style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: 'var(--accent-soft)' }}
        >
          <Lock size={24} style={{ color: 'var(--accent-hover)' }} />
        </div>
        <h1 className="mb-2 text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Página não publicada
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Esta página ainda não está disponível. O dono pode estar editando ou ainda não a publicou.
        </p>
      </div>
    </div>
  )
}

export function PublicProfile() {
  const { username } = useParams<{ username: string }>()
  const { profile, loading: profileLoading, error } = useUserProfile(undefined, username)
  const { user, loading: authLoading } = useAuth()
  const [blocks, setBlocks] = useState<Block[]>([])
  const [pageSettings, setPageSettings] = useState<PageSettings>(DEFAULT_PAGE_SETTINGS)
  const [blocksLoading, setBlocksLoading] = useState(false)

  useEffect(() => {
    if (!profile?.id) {
      setBlocksLoading(false)
      return
    }
    setBlocksLoading(true)
    Promise.all([
      fetchUserBlocks(profile.id),
      fetchPageSettings(profile.id),
    ]).then(([blocksData, settings]) => {
      setBlocks(blocksData)
      setPageSettings(settings)
      setBlocksLoading(false)
    }).catch(() => setBlocksLoading(false))
  }, [profile?.id])

  if (profileLoading || blocksLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-background)' }}>
        <div
          className="animate-spin rounded-full h-12 w-12 border-4"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--color-background)', color: 'var(--color-text-secondary)' }}
      >
        <div className="text-center">
          <p className="text-2xl mb-2">:(</p>
          <p>Perfil não encontrado</p>
        </div>
      </div>
    )
  }

  const isOwner = user?.uid === profile.id
  const isPublished = pageSettings.published === true

  // Página despublicada: só o dono pode enxergá-la (em modo de prévia).
  if (!isPublished && !isOwner) {
    return <ProfileOfflineScreen />
  }

  const siteUrl = window.location.origin
  const profileUrl = `${siteUrl}/${profile.username}`
  const headerBlock = blocks.find((b) => b.type === 'header')
  const headerData = headerBlock?.data as any
  const title = headerData?.displayName
    ? `${headerData.displayName} | BlockStack`
    : `${profile.displayName} | BlockStack`
  const description = headerData?.bio || profile.bio || `${profile.displayName} está no BlockStack!`
  const imageUrl = headerData?.avatarUrl || profile.avatarUrl || `${siteUrl}/default-og-image.png`

  // Tokens do tema escolhido na tela Design (fonte única: lib/publicPresets).
  // O accent respeita a cor escolhida pelo dono do perfil; fontDisplay/radius
  // vêm das mesmas settings — nada de estilos fixos aqui.
  const themeVars = {
    ...getPresetVars(pageSettings.preset, pageSettings.accentColor),
    fontDisplay: getFontFamily(pageSettings.titleFont),
  }

  return (
    <>
      <Helmet>
        <title>{title}</title>
        {!isPublished && <meta name="robots" content="noindex, nofollow" />}
        <meta name="description" content={description} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={profileUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={profileUrl} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={imageUrl} />
        <link rel="canonical" href={profileUrl} />
      </Helmet>

      {/* Aviso para o dono vendo a própria página ainda despublicada */}
      {!isPublished && isOwner && (
        <div
          className="flex items-center justify-center gap-2 px-4 py-2 text-center text-xs font-medium"
          style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
        >
          <Lock size={13} />
          Prévia privada — sua página ainda não foi publicada. Outras pessoas veem um aviso de página indisponível.
        </div>
      )}

      <PublicProfileComponent
        blocks={blocks}
        theme={{
          vars: themeVars,
          blockStyle: pageSettings.blockStyle,
          density: pageSettings.density,
          radius: getRadius(pageSettings.corners),
          fontDisplay: getFontFamily(pageSettings.titleFont),
        }}
        preview={!isPublished && isOwner}
      />
    </>
  )
}
