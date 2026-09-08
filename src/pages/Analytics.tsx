import { useAuth } from '../hooks/useAuth'
import { useBlocks } from '../hooks/useBlocks'
import { MainLayout } from '../layouts/MainLayout'
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
import { LayoutGrid, MousePointer, Eye, ArrowLeft, ArrowDownRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { subscribeToAnalytics, type AnalyticsDay } from '../services/analyticsService'

const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#1F2937', '#06B6D4']

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
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-accent)] border-t-transparent" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
            title="Voltar"
            style={{ color: 'var(--color-muted)' }}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-ink)]">Analytics</h1>
          <p className="text-[var(--color-muted)] text-sm">
            Acompanhe o desempenho dos seus blocos.
          </p>
          </div>
        </div>

        <p className="text-sm text-[var(--color-muted)]">Últimos 30 dias, comparados aos 30 dias anteriores.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-[var(--color-border)] p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--color-accent-light)] rounded-xl text-[var(--color-accent)]">
                <LayoutGrid size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--color-ink)]">{currentViews}</p>
                <p className="text-sm text-[var(--color-muted)]">Visualizações</p>
                <p className="text-xs text-[var(--color-muted)] mt-1">{changeLabel(currentViews, previousViews)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[var(--color-border)] p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--color-accent-light)] rounded-xl text-[var(--color-accent)]">
                <MousePointer size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--color-ink)]">{currentClicks}</p>
                <p className="text-sm text-[var(--color-muted)]">Cliques</p>
                <p className="text-xs text-[var(--color-muted)] mt-1">{changeLabel(currentClicks, previousClicks)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[var(--color-border)] p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--color-accent-light)] rounded-xl text-[var(--color-accent)]">
                <LayoutGrid size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--color-ink)]">{totalBlocks}</p>
                <p className="text-sm text-[var(--color-muted)]">Total de blocos</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[var(--color-border)] p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--color-accent-light)] rounded-xl text-[var(--color-accent)]">
                <Eye size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--color-ink)]">
                  {currentViews ? `${((currentClicks / currentViews) * 100).toFixed(1)}%` : '—'}
                </p>
                <p className="text-sm text-[var(--color-muted)]">Taxa de cliques</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white rounded-2xl border border-[var(--color-border)] p-5 shadow-sm">
            <h2 className="text-lg font-bold text-[var(--color-ink)]">Blocos com mais cliques</h2>
            <p className="text-sm text-[var(--color-muted)] mt-1">Ranking dos últimos 30 dias.</p>
            {topClickedBlocks.length === 0 ? <p className="text-sm text-[var(--color-muted)] py-8 text-center">Ainda não há cliques no período.</p> : (
              <ol className="mt-4 space-y-3">
                {topClickedBlocks.map(({ block, clicks }, index) => <li key={block.id} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-accent-light)] text-xs font-bold text-[var(--color-accent)]">{index + 1}</span>
                  <span className="min-w-0 flex-1 truncate font-medium text-[var(--color-ink)]">{blockTitle(block)}</span>
                  <span className="text-sm text-[var(--color-muted)]">{clicks} cliques</span>
                </li>)}
              </ol>
            )}
          </section>

          <section className="bg-white rounded-2xl border border-[var(--color-border)] p-5 shadow-sm">
            <div className="flex items-start gap-2"><ArrowDownRight className="mt-1 h-5 w-5 text-amber-500" /><div><h2 className="text-lg font-bold text-[var(--color-ink)]">Oportunidades</h2><p className="text-sm text-[var(--color-muted)]">10+ visualizações e taxa de cliques abaixo de 5%.</p></div></div>
            {opportunities.length === 0 ? <p className="text-sm text-[var(--color-muted)] py-8 text-center">Nenhum bloco se encaixa nesse indicador.</p> : (
              <ul className="mt-4 space-y-3">
                {opportunities.map(({ block, views, clicks }) => <li key={block.id} className="flex items-center justify-between gap-3"><span className="min-w-0 truncate font-medium text-[var(--color-ink)]">{blockTitle(block)}</span><span className="shrink-0 text-sm text-[var(--color-muted)]">{views} vis. · {clicks} cliques</span></li>)}
              </ul>
            )}
          </section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-[var(--color-border)] p-5 shadow-sm">
            <h2 className="text-lg font-bold text-[var(--color-ink)] mb-4">Blocos mais usados</h2>
            {topTypes.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)] py-8 text-center">
                Nenhum bloco adicionado ainda.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topTypes} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip formatter={(value) => [`${value} blocos`, 'Quantidade']} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {topTypes.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[var(--color-border)] p-5 shadow-sm">
            <h2 className="text-lg font-bold text-[var(--color-ink)] mb-4">Distribuição de tipos</h2>
            {pieData.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)] py-8 text-center">
                Nenhum bloco cadastrado.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="value"
                    label={(props: any) => `${props.name || ''}: ${((props.percent || 0) * 100).toFixed(0)}%`}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[var(--color-border)] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[var(--color-ink)]">Todos os blocos</h2>
            <span className="text-sm text-[var(--color-muted)]">{totalBlocks} blocos</span>
          </div>

          {blocks.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)] py-8 text-center">
              Nenhum bloco cadastrado ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="text-left py-3 px-2 font-medium text-[var(--color-muted)]">Tipo</th>
                    <th className="text-left py-3 px-2 font-medium text-[var(--color-muted)]">Conteudo</th>
                    <th className="text-right py-3 px-2 font-medium text-[var(--color-muted)]">Ordem</th>
                  </tr>
                </thead>
                <tbody>
                  {blocks.map((block) => (
                    <tr key={block.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-accent-light)] transition">
                      <td className="py-3 px-2 font-medium text-[var(--color-ink)] capitalize">
                        {BLOCK_TYPE_LABELS[block.type] || block.type}
                      </td>
                      <td className="py-3 px-2 text-[var(--color-muted)] truncate max-w-[200px]">
                        {(block.data as any).title || (block.data as any).displayName || (block.data as any).content?.slice(0, 50) || '—'}
                      </td>
                      <td className="py-3 px-2 text-right font-medium text-[var(--color-ink)]">
                        {block.order + 1}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
