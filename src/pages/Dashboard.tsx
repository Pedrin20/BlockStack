import { useAuth } from '../hooks/useAuth'
import { useBlocks, usePageSettings } from '../hooks/useBlocks'
import { useUserProfile } from '../hooks/useUserProfile'
import { MainLayout } from '../layouts/MainLayout'
import { Card, Button, EmptyState, PageLoading } from '../components/ui'
import {
  LayoutGrid,
  Eye,
  TrendingUp,
  ArrowRight,
  Palette,
  Blocks,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function StatCard({ icon: Icon, label, value, trend }: { icon: any; label: string; value: number | string; trend?: string }) {
  return (
    <Card hover className="p-5">
      <div className="flex items-center justify-between mb-2">
        <div
          className="p-2 rounded-xl"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent-hover)' }}
        >
          <Icon size={20} />
        </div>
        {trend && (
          <span className="badge badge-success">{trend}</span>
        )}
      </div>
      <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
        {value}
      </p>
      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
    </Card>
  )
}

export function Dashboard() {
  const { user } = useAuth()
  const { blocks, loading } = useBlocks(user?.uid)
  const { profile: currentProfile, loading: profileLoading } = useUserProfile(user?.uid)
  const { settings } = usePageSettings(user?.uid)
  const navigate = useNavigate()

  const totalBlocks = blocks.length
  const blockTypes = [...new Set(blocks.map(b => b.type))].length

  if (loading || profileLoading) {
    return (
      <MainLayout>
        <PageLoading />
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
              Olá, {user?.displayName || 'usuário'}
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Aqui está o desempenho da sua página nos últimos 30 dias.
            </p>
          </div>
          <Button onClick={() => navigate('/dashboard/my-page')}>
            <LayoutGrid size={18} />
            Editar página
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard icon={LayoutGrid} label="Total de blocos" value={totalBlocks} />
          <StatCard icon={TrendingUp} label="Tipos de blocos" value={blockTypes} />
          <StatCard icon={Eye} label="Pagina publica" value={settings?.published ? 'Publicada' : 'Não publicada'} />
        </div>

        {/* Quick actions */}
        <Card className="p-5">
          <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
            Ações rápidas
          </h2>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate('/dashboard/my-page')}>
              <LayoutGrid size={18} />
              Minha Página
            </Button>
            <Button variant="secondary" onClick={() => navigate('/dashboard/design')}>
              <Palette size={18} />
              Design
            </Button>

            {currentProfile?.username && (
              <Button variant="secondary" onClick={() => navigate('/' + currentProfile.username)}>
                <Eye size={18} />
                {settings?.published ? 'Ver perfil público' : 'Prévia da página'}
              </Button>
            )}

            <Button variant="secondary" onClick={() => navigate('/dashboard/analytics')}>
              <TrendingUp size={18} />
              Ver analytics
            </Button>
          </div>
        </Card>

        {/* Recent blocks */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Seus blocos
            </h2>
            <button
              onClick={() => navigate('/dashboard/my-page')}
              className="text-sm hover:underline flex items-center gap-1"
              style={{ color: 'var(--accent-hover)' }}
            >
              Ver todos <ArrowRight size={16} />
            </button>
          </div>

          {blocks.length === 0 ? (
            <EmptyState
              icon={<Blocks size={24} />}
              title="Nenhum bloco cadastrado ainda"
              description="Comece adicionando blocos na sua página!"
              action={<Button size="md" onClick={() => navigate('/dashboard/my-page')}>Criar página</Button>}
            />
          ) : (
            <div className="space-y-2">
              {blocks.slice(0, 5).map((block) => (
                <div
                  key={block.id}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ border: '1px solid var(--color-border)' }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate capitalize" style={{ color: 'var(--color-text-primary)' }}>
                      {block.type}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
                      {(block.data as any).title || (block.data as any).displayName || (block.data as any).content?.slice(0, 50) || 'Bloco'}
                    </p>
                  </div>
                  <span className="badge badge-primary capitalize">{block.type}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  )
}
