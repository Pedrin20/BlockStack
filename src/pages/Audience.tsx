import { useEffect, useState } from 'react'
import { Download, Users } from 'lucide-react'
import { MainLayout } from '../layouts/MainLayout'
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
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2"><Users className="h-6 w-6 text-[var(--color-accent)]" /><h1 className="text-3xl font-bold text-[var(--color-ink)]">Audiência</h1></div>
            <p className="mt-1 text-sm text-[var(--color-muted)]">Contatos capturados pelos seus blocos de Formulário e Newsletter.</p>
          </div>
          <button type="button" onClick={exportCsv} disabled={!leads.length} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" style={{ background: 'var(--color-accent)' }}>
            <Download className="h-4 w-4" /> Exportar CSV
          </button>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4"><h2 className="font-bold text-[var(--color-ink)]">Contatos</h2><span className="text-sm text-[var(--color-muted)]">{leads.length} {leads.length === 1 ? 'contato' : 'contatos'}</span></div>
          {loading ? <div className="flex justify-center py-12"><div className="h-7 w-7 animate-spin rounded-full border-4 border-[var(--color-accent)] border-t-transparent" /></div> : leads.length === 0 ? <p className="py-12 text-center text-sm text-[var(--color-muted)]">Nenhum contato capturado ainda.</p> : (
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-[var(--color-border)] text-left text-[var(--color-muted)]"><th className="px-5 py-3 font-medium">Nome</th><th className="px-5 py-3 font-medium">E-mail</th><th className="px-5 py-3 font-medium">Origem</th><th className="px-5 py-3 font-medium">Data</th></tr></thead><tbody>{leads.map((lead) => <tr key={lead.id} className="border-b border-[var(--color-border)] last:border-0"><td className="px-5 py-3 font-medium text-[var(--color-ink)]">{lead.name || '—'}</td><td className="px-5 py-3 text-[var(--color-muted)]">{lead.email}</td><td className="px-5 py-3 text-[var(--color-muted)]">{lead.source === 'newsletter' ? 'Newsletter' : 'Formulário'}</td><td className="px-5 py-3 text-[var(--color-muted)]">{formatDate(lead)}</td></tr>)}</tbody></table></div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
