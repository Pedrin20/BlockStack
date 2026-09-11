import { useEffect, useMemo, useState } from 'react'
import {
  Download,
  Users,
  Inbox,
  Loader2,
  Mail,
  MailOpen,
  Trash2,
  Reply,
  ArrowLeft,
  MessageSquare,
} from 'lucide-react'
import { MainLayout } from '../layouts/MainLayout'
import { Card, Button, EmptyState } from '../components/ui'
import { useAuth } from '../hooks/useAuth'
import {
  subscribeToLeads,
  markLeadRead,
  markLeadUnread,
  deleteLead,
  type Lead,
} from '../services/leadService'

function leadDate(lead: Lead): Date | null {
  const date = lead.createdAt?.toDate?.()
  return date ? date : null
}

/** Data relata curta — "agora", "5 min", "3 h", "2 d" ou data curta. */
function formatRelative(lead: Lead): string {
  const date = leadDate(lead)
  if (!date) return '—'
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'agora'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} d`
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date)
}

function formatFull(lead: Lead): string {
  const date = leadDate(lead)
  return date
    ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date)
    : '—'
}

function csvValue(value: string) {
  return `"${value.replaceAll('"', '""')}"`
}

function sourceBadge(lead: Lead): string {
  return lead.sourceLabel || (lead.source === 'newsletter' ? 'Newsletter' : 'Formulário')
}

/** Abre o cliente de e-mail do dono com a resposta pré-preenchida. */
function buildReplyUrl(lead: Lead): string {
  const subject = `Re: ${sourceBadge(lead)}`
  const body = `Olá ${lead.name || ''},\n\n\n\n—\nResposta via BlockStack`
  return `mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export function Audience() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.uid) return
    return subscribeToLeads(user.uid, (items) => {
      setLeads(items)
      setLoading(false)
    })
  }, [user?.uid])

  const unreadCount = useMemo(() => leads.filter((l) => !l.read).length, [leads])
  const visible = useMemo(
    () => (filter === 'unread' ? leads.filter((l) => !l.read) : leads),
    [leads, filter],
  )
  const selected = useMemo(
    () => leads.find((l) => l.id === selectedId) ?? null,
    [leads, selectedId],
  )

  function openLead(lead: Lead) {
    setSelectedId(lead.id)
    if (!lead.read) {
      // Marca como lida de forma otimista — o snapshot confirma em seguida.
      setLeads((current) => current.map((l) => (l.id === lead.id ? { ...l, read: true } : l)))
      markLeadRead(lead.id).catch(() => {})
    }
  }

  function toggleRead(lead: Lead) {
    if (lead.read) {
      setLeads((current) => current.map((l) => (l.id === lead.id ? { ...l, read: false } : l)))
      markLeadUnread(lead.id).catch(() => {})
    } else {
      setLeads((current) => current.map((l) => (l.id === lead.id ? { ...l, read: true } : l)))
      markLeadRead(lead.id).catch(() => {})
    }
  }

  async function removeLead(lead: Lead) {
    if (!window.confirm(`Excluir a mensagem de ${lead.name || lead.email || 'remetente desconhecido'}?`)) return
    setDeletingId(lead.id)
    try {
      await deleteLead(lead.id)
      if (selectedId === lead.id) setSelectedId(null)
    } finally {
      setDeletingId(null)
    }
  }

  function exportCsv() {
    const rows = [
      ['Nome', 'E-mail', 'Origem', 'Mensagem', 'Lida', 'Data'],
      ...leads.map((lead) => [
        lead.name,
        lead.email,
        sourceBadge(lead),
        lead.message || '',
        lead.read ? 'Sim' : 'Não',
        formatFull(lead),
      ]),
    ]
    const csv = `\uFEFF${rows.map((row) => row.map(csvValue).join(',')).join('\r\n')}`
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `audiencia-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <MainLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6" style={{ color: 'var(--accent-hover)' }} />
              <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Audiência</h1>
            </div>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Mensagens e contatos capturados pelos seus blocos de Formulário e Newsletter.
            </p>
          </div>
          <Button onClick={exportCsv} disabled={!leads.length}>
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        </div>

        <Card className="overflow-hidden">
          {/* Cabeçalho do inbox: abas + contador de não lidas */}
          <div
            className="flex items-center justify-between gap-3 border-b px-5 py-3"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
                style={{
                  color: filter === 'all' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  background: filter === 'all' ? 'var(--color-surface-hover)' : 'transparent',
                }}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
                style={{
                  color: filter === 'unread' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  background: filter === 'unread' ? 'var(--color-surface-hover)' : 'transparent',
                }}
              >
                Não lidas
                {unreadCount > 0 ? (
                  <span
                    className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold"
                    style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
                  >
                    {unreadCount}
                  </span>
                ) : null}
              </button>
            </div>
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {leads.length} {leads.length === 1 ? 'mensagem' : 'mensagens'}
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <Loader2
                className="animate-spin"
                size={28}
                style={{ color: 'var(--accent)' }}
                aria-label="Carregando"
              />
            </div>
          ) : leads.length === 0 ? (
            <EmptyState
              icon={<Inbox size={24} />}
              title="Nenhuma mensagem recebida ainda"
              description="Quando alguém preencher um bloco de Formulário ou Newsletter na sua página, a mensagem aparece aqui."
            />
          ) : (
            <div className="flex h-[560px]">
              {/* Lista de mensagens */}
              <div
                className={`w-full shrink-0 overflow-y-auto sm:w-80 md:w-96 ${selected ? 'hidden sm:block' : 'block'}`}
                style={{ borderRight: '1px solid var(--color-border)' }}
              >
                {visible.length === 0 ? (
                  <p className="px-5 py-10 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Nenhuma mensagem não lida. 🎉
                  </p>
                ) : (
                  visible.map((lead) => {
                    const active = lead.id === selectedId
                    return (
                      <button
                        key={lead.id}
                        type="button"
                        onClick={() => openLead(lead)}
                        className="flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-white/5"
                        style={{
                          borderColor: 'var(--color-border)',
                          background: active ? 'var(--color-surface-hover)' : 'transparent',
                        }}
                      >
                        <span
                          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                          style={{
                            background: lead.read ? 'var(--color-surface-hover)' : 'var(--accent-soft)',
                            color: lead.read ? 'var(--color-text-secondary)' : 'var(--accent-hover)',
                          }}
                        >
                          {(lead.name || lead.email || '?').charAt(0).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span
                              className="min-w-0 truncate text-sm font-semibold"
                              style={{ color: 'var(--color-text-primary)' }}
                            >
                              {lead.name || lead.email.split('@')[0] || 'Sem nome'}
                            </span>
                            <span className="shrink-0 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                              {formatRelative(lead)}
                            </span>
                          </span>
                          <span
                            className="mt-0.5 block truncate text-xs"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            {sourceBadge(lead)}
                          </span>
                          <span className="mt-0.5 flex items-center gap-1.5">
                            {!lead.read ? (
                              <span
                                className="h-2 w-2 shrink-0 rounded-full"
                                style={{ background: 'var(--accent)' }}
                                aria-label="Não lida"
                              />
                            ) : null}
                            <span
                              className="min-w-0 truncate text-xs"
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              {lead.message || lead.email || 'Sem conteúdo'}
                            </span>
                          </span>
                        </span>
                      </button>
                    )
                  })
                )}
              </div>

              {/* Painel de detalhe */}
              <div className={`min-w-0 flex-1 flex-col overflow-y-auto ${selected ? 'flex' : 'hidden md:flex'}`}>
                {selected ? (
                  <LeadDetail
                    key={selected.id}
                    lead={selected}
                    onToggleRead={() => toggleRead(selected)}
                    onDelete={() => removeLead(selected)}
                    deleting={deletingId === selected.id}
                    onBack={() => setSelectedId(null)}
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-full"
                      style={{ background: 'var(--color-surface-hover)', color: 'var(--color-text-secondary)' }}
                    >
                      <MailOpen className="h-5 w-5" />
                    </span>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      Selecione uma mensagem
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      Clique em um item da lista para ler a mensagem completa.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  )
}

function LeadDetail({
  lead,
  onToggleRead,
  onDelete,
  deleting,
  onBack,
}: {
  lead: Lead
  onToggleRead: () => void
  onDelete: () => void
  deleting: boolean
  onBack: () => void
}) {
  const fieldEntries = Object.entries(lead.fields || {})
  const hasStructuredFields = fieldEntries.length > 0

  return (
    <div className="flex h-full flex-col">
      {/* Barra de ações */}
      <div
        className="flex items-center justify-between gap-2 border-b px-4 py-2.5"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors hover:bg-white/5 sm:hidden"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <div className="flex flex-1 items-center justify-end gap-1">
          <button
            type="button"
            onClick={onToggleRead}
            title={lead.read ? 'Marcar como não lida' : 'Marcar como lida'}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/5"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {lead.read ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            title="Excluir mensagem"
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/5 hover:text-[var(--color-error)] disabled:opacity-40"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Conteúdo da mensagem */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {lead.name || lead.email.split('@')[0] || 'Sem nome'}
            </h2>
            <p className="truncate text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {lead.email || '—'}
            </p>
          </div>
          <span className="badge badge-primary shrink-0">{sourceBadge(lead)}</span>
        </div>

        <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {formatFull(lead)}
        </p>

        {/* Respostas campo-a-campo do formulário */}
        {hasStructuredFields ? (
          <div className="mt-5 flex flex-col gap-2">
            {fieldEntries.map(([field, value]) => (
              <div
                key={field}
                className="rounded-xl px-4 py-3"
                style={{
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface-raised)',
                }}
              >
                <p
                  className="text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {field}
                </p>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5">
            {lead.message ? (
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
                {lead.message}
              </p>
            ) : (
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Esta captura não inclui mensagem — apenas o contato.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Responder */}
      <div className="border-t p-4" style={{ borderColor: 'var(--color-border)' }}>
        {lead.email ? (
          <a
            href={buildReplyUrl(lead)}
            className="btn btn-primary btn-sm w-full"
            onClick={() => {
              if (!lead.read) onToggleRead()
            }}
          >
            <Reply className="h-4 w-4" />
            Responder para {lead.email}
          </a>
        ) : (
          <p className="flex items-center justify-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <MessageSquare className="h-3.5 w-3.5" />
            Sem e-mail informado — resposta indisponível
          </p>
        )}
      </div>
    </div>
  )
}
