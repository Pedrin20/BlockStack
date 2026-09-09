import { useAuth } from '../hooks/useAuth'
import { useBlocks } from '../hooks/useBlocks'
import { MainLayout } from '../layouts/MainLayout'
import { Card, EmptyState, PageLoading } from '../components/ui'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts'
import { LayoutGrid, MousePointer, Eye, ArrowLeft, ArrowDownRight, MousePointerClick, BarChart3, PieChart as PieIcon, Table2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { subscribeToAnalytics, type AnalyticsDay } from '../services/analyticsService'

// Paleta categórica de data-viz — exceção documentada à regra do accent único:
// gráficos precisam distinguir séries; violeta do produto ancora a escala.
const COLORS = ['#8B5CF6', '#06B6D4', '#34D399', '#FBBF24', '#F87171', '#EC4899', '#818CF8', '#A78BFA']

const BLOCK_TYPE_LABELS: Record<string, string> = {
  header: 'Cabecalho',
  link: 'Link',
  product: 'Produto',
  service: 'Servico',
  gallery: 'Galeria',
  video: 'Video',
  text: 'Texto',
  newsletter: 'Newsletter',
  socials: 'Redes Sociais',
}

const PERIOD_DAYS = 30
const OPPORTUNITY_MIN_VIEWS = 10
const OPPORTUNITY_CTR_THRESHOLD = 0.05

function relativeDate(daysAgo: number) {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString().slice(0, 10)
}

function sumDays(days: AnalyticsDay[], startDaysAgo: number, endDaysAgo: number) {
  const start = relativeDate(startDaysAgo)
  const end = relativeDate(endDaysAgo)
  return days.filter((day) => day.date <= start && day.date >= end)
}

function changeLabel(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 'Sem dados anteriores' : 'Novo no período'
  const percentage = ((current - previous) / previous) * 100
  return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(0)}% vs. período anterior`
}

function blockTitle(block: { type: string; data: unknown }) {
  const data = block.data as Record<string, unknown>
  const title = typeof data.title === 'string' ? data.title : undefined
  const displayName = typeof data.displayName === 'string' ? data.displayName : undefined
  const content = typeof data.content === 'string' ? data.content.slice(0, 50) : undefined
  return title || displayName || content || BLOCK_TYPE_LABELS[block.type] || block.type
}

const chartTooltipStyle = {
  background: 'var(--color-background-elevated)',
  border: '1px solid var(--color-border-strong)',
  borderRadius: 'var(--radius-lg)',
  color: 'var(--color-text-primary)',
  fontSize: 'var(--text-sm)',
}

export function Analytics() {
  const { user } = useAuth()
  const { blocks, loading } = useBlocks(user?.uid)
  const [days, setDays] = useState<AnalyticsDay[]>([])
  const [analyticsLoading, setAnalyticsLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) {
      return
    }
    setAnalyticsLoading(true)
    return subscribeToAnalytics(user.uid, (items) => {
      setDays(items)
      setAnalyticsLoading(false)
    })
  }, [user?.uid])

  const typeCounts = blocks.reduce((acc: Record<string, number>, b) => {
    acc[b.type] = (acc[b.type] || 0) + 1
    return acc
  }, {})

  const topTypes = Object.entries(typeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([type, count]) => ({
      name: BLOCK_TYPE_LABELS[type] || type,
      count,
    }))

  const pieData = Object.entries(typeCounts).map(([type, count]) => ({
    name: BLOCK_TYPE_LABELS[type] || type,
    value: count,
  }))

  const navigate = useNavigate()
  const totalBlocks = blocks.length
  const currentDays = useMemo(() => sumDays(days, 0, PERIOD_DAYS - 1), [days])
  const previousDays = useMemo(() => sumDays(days, PERIOD_DAYS, PERIOD_DAYS * 2 - 1), [days])
  const sumMetric = (items: AnalyticsDay[], metric: 'views' | 'clicks') => items.reduce((total, day) => total + day[metric], 0)
  const currentViews = sumMetric(currentDays, 'views')
  const previousViews = sumMetric(previousDays, 'views')
  const currentClicks = sumMetric(currentDays, 'clicks')
  const previousClicks = sumMetric(previousDays, 'clicks')
  const blockMetrics = useMemo(() => blocks.map((block) => ({
    block,
    views: currentDays.reduce((total, day) => total + Number(day.blockViews[block.id] || 0), 0),
    clicks: currentDays.reduce((total, day) => total + Number(day.blockClicks[block.id] || 0), 0),
  })), [blocks, currentDays])
  const topClickedBlocks = [...blockMetrics].filter((item) => item.clicks > 0).sort((a, b) => b.clicks - a.clicks).slice(0, 5)
  const opportunities = [...blockMetrics]
    .filter((item) => item.views >= OPPORTUNITY_MIN_VIEWS && item.clicks / item.views < OPPORTUNITY_CTR_THRESHOLD)
    .sort((a, b) => b.views - a.views)

  if (loading || analyticsLoading) {
    return (
      <MainLayout>
        <PageLoading />
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-white/5"
            title="Voltar"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Analytics</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Acompanhe o desempenho dos seus blocos.
          </p>
          </div>
        </div>

        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Últimos 30 dias, comparados aos 30 dias anteriores.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card hover className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background: 'var(--accent-soft)', color: 'var(--accent-hover)' }}>
                <LayoutGrid size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{currentViews}</p>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Visualizações</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{changeLabel(currentViews, previousViews)}</p>
              </div>
            </div>
          </Card>

          <Card hover className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background: 'var(--accent-soft)', color: 'var(--accent-hover)' }}>
                <MousePointer size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{currentClicks}</p>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Cliques</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{changeLabel(currentClicks, previousClicks)}</p>
              </div>
            </div>
          </Card>

          <Card hover className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background: 'var(--accent-soft)', color: 'var(--accent-hover)' }}>
                <LayoutGrid size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{totalBlocks}</p>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total de blocos</p>
              </div>
            </div>
          </Card>

          <Card hover className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background: 'var(--accent-soft)', color: 'var(--accent-hover)' }}>
                <Eye size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {currentViews ? `${((currentClicks / currentViews) * 100).toFixed(1)}%` : '—'}
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Taxa de cliques</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-5">
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Blocos com mais cliques</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Ranking dos últimos 30 dias.</p>
            {topClickedBlocks.length === 0 ? (
              <EmptyState icon={<MousePointerClick size={24} />} title="Ainda não há cliques no período" />
            ) : (
              <ol className="mt-4 space-y-3">
                {topClickedBlocks.map(({ block, clicks }, index) => <li key={block.id} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold" style={{ background: 'var(--accent-soft)', color: 'var(--accent-hover)' }}>{index + 1}</span>
                  <span className="min-w-0 flex-1 truncate font-medium" style={{ color: 'var(--color-text-primary)' }}>{blockTitle(block)}</span>
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{clicks} cliques</span>
                </li>)}
              </ol>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-start gap-2"><ArrowDownRight className="mt-1 h-5 w-5" style={{ color: 'var(--color-warning)' }} /><div><h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Oportunidades</h2><p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>10+ visualizações e taxa de cliques abaixo de 5%.</p></div></div>
            {opportunities.length === 0 ? (
              <EmptyState icon={<ArrowDownRight size={24} />} title="Nenhum bloco se encaixa nesse indicador" />
            ) : (
              <ul className="mt-4 space-y-3">
                {opportunities.map(({ block, views, clicks }) => <li key={block.id} className="flex items-center justify-between gap-3"><span className="min-w-0 truncate font-medium" style={{ color: 'var(--color-text-primary)' }}>{blockTitle(block)}</span><span className="shrink-0 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{views} vis. · {clicks} cliques</span></li>)}
              </ul>
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-5">
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>Blocos mais usados</h2>
            {topTypes.length === 0 ? (
              <EmptyState icon={<BarChart3 size={24} />} title="Nenhum bloco adicionado ainda" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topTypes} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis type="number" tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                  <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: 'var(--color-surface-hover)' }} formatter={(value) => [`${value} blocos`, 'Quantidade']} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {topTypes.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>Distribuição de tipos</h2>
            {pieData.length === 0 ? (
              <EmptyState icon={<PieIcon size={24} />} title="Nenhum bloco cadastrado" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="var(--color-background)"
                    label={(props: any) => `${props.name || ''}: ${((props.percent || 0) * 100).toFixed(0)}%`}
                    labelLine={{ stroke: 'var(--color-text-muted)' }}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ color: 'var(--color-text-secondary)' }} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Todos os blocos</h2>
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{totalBlocks} blocos</span>
          </div>

          {blocks.length === 0 ? (
            <EmptyState
              icon={<Table2 size={24} />}
              title="Nenhum bloco cadastrado ainda"
              description="Adicione blocos na sua página para acompanhar o desempenho aqui."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Tipo</th>
                    <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Conteudo</th>
                    <th className="text-right py-3 px-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Ordem</th>
                  </tr>
                </thead>
                <tbody>
                  {blocks.map((block) => (
                    <tr key={block.id} className="border-b transition-colors last:border-0 hover:bg-white/5" style={{ borderColor: 'var(--color-border)' }}>
                      <td className="py-3 px-2 font-medium capitalize" style={{ color: 'var(--color-text-primary)' }}>
                        {BLOCK_TYPE_LABELS[block.type] || block.type}
                      </td>
                      <td className="py-3 px-2 truncate max-w-[200px]" style={{ color: 'var(--color-text-secondary)' }}>
                        {(block.data as any).title || (block.data as any).displayName || (block.data as any).content?.slice(0, 50) || '—'}
                      </td>
                      <td className="py-3 px-2 text-right font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        {block.order + 1}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  )
}
