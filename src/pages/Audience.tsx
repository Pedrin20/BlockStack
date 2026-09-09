import { useEffect, useState } from 'react'
import { Download, Users, Inbox, Loader2 } from 'lucide-react'
import { MainLayout } from '../layouts/MainLayout'
import { Card, Button, EmptyState } from '../components/ui'
import { useAuth } from '../hooks/useAuth'
import { subscribeToLeads, type Lead } from '../services/leadService'

function formatDate(lead: Lead) {
  const date = lead.createdAt?.toDate?.()
  return date ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date) : '—'
}

function csvValue(value: string) {
  return `"${value.replaceAll('"', '""')}"`
}

export function Audience() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) return
    return subscribeToLeads(user.uid, (items) => {
      setLeads(items)
      setLoading(false)
    })
  }, [user?.uid])

  function exportCsv() {
    const rows = [
      ['Nome', 'E-mail', 'Origem', 'Data'],
      ...leads.map((lead) => [lead.name, lead.email, lead.source === 'newsletter' ? 'Newsletter' : 'Formulário', formatDate(lead)]),
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
              Contatos capturados pelos seus blocos de Formulário e Newsletter.
            </p>
          </div>
          <Button onClick={exportCsv} disabled={!leads.length}>
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        </div>

        <Card className="overflow-hidden">
          <div
            className="flex items-center justify-between border-b px-5 py-4"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <h2 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Contatos</h2>
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {leads.length} {leads.length === 1 ? 'contato' : 'contatos'}
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
              title="Nenhum contato capturado ainda"
              description="Quando alguém preencher um bloco de Formulário ou Newsletter, o contato aparece aqui."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                    <th className="px-5 py-3 font-medium">Nome</th>
                    <th className="px-5 py-3 font-medium">E-mail</th>
                    <th className="px-5 py-3 font-medium">Origem</th>
                    <th className="px-5 py-3 font-medium">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b transition-colors last:border-0 hover:bg-white/5"
                      style={{ borderColor: 'var(--color-border)' }}
                    >
                      <td className="px-5 py-3 font-medium" style={{ color: 'var(--color-text-primary)' }}>{lead.name || '—'}</td>
                      <td className="px-5 py-3" style={{ color: 'var(--color-text-secondary)' }}>{lead.email}</td>
                      <td className="px-5 py-3">
                        <span className="badge badge-primary">{lead.source === 'newsletter' ? 'Newsletter' : 'Formulário'}</span>
                      </td>
                      <td className="px-5 py-3" style={{ color: 'var(--color-text-secondary)' }}>{formatDate(lead)}</td>
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
