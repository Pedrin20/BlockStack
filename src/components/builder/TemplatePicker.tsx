import { useState } from 'react'
import { TEMPLATES, type Template } from '../../lib/templates'
import { Search } from 'lucide-react'

const CATEGORIES = [
  { id: 'objective' as const, label: 'Por objetivo', emoji: '🎯' },
  { id: 'profession' as const, label: 'Por profissão', emoji: '💼' },
]

interface Props {
  onSelect: (template: Template) => void
  onSkip: () => void
}

export function TemplatePicker({ onSelect, onSkip }: Props) {
  const [category, setCategory] = useState<'objective' | 'profession'>('objective')
  const [search, setSearch] = useState('')

  const templates = TEMPLATES.filter((t) => t.category === category)
  const filtered = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div
      className="flex h-full flex-col items-center justify-center p-6"
      style={{
        background:
          'var(--canvas-dots, radial-gradient(circle at 1px 1px, rgba(255,255,255,0.10) 1px, transparent 0))',
        backgroundSize: '22px 22px',
      }}
    >
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-ink">
            Como quer começar?
          </h2>
          <p className="mt-1 text-sm text-dim">
            Escolha um template ou comece do zero. Você pode editar tudo depois.
          </p>
        </div>

        {/* Category tabs */}
        <div className="mb-4 flex justify-center">
          <div
            className="flex gap-1 rounded-xl p-1"
            style={{
              border: '1px solid var(--color-border-strong)',
              background: 'var(--color-surface-raised)',
            }}
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  background:
                    category === cat.id
                      ? 'var(--accent)'
                      : 'transparent',
                  color: category === cat.id ? 'var(--accent-text)' : 'var(--color-text-secondary)',
                }}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-5 mx-auto max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <input
            type="text"
            placeholder="Buscar template..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-faint outline-none transition-colors focus:border-[var(--accent)]"
            style={{
              borderColor: 'var(--color-border)',
              background: 'var(--color-surface-raised)',
            }}
          />
        </div>

        {/* Template grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filtered.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template)}
              className="group overflow-hidden rounded-xl border p-4 text-left transition-all hover:border-[var(--accent)] hover:shadow-lg"
              style={{
                borderColor: 'var(--color-border-strong)',
                background: 'var(--color-surface-raised)',
              }}
            >
              <span className="mb-2 block text-2xl">{template.emoji}</span>
              <span className="mb-1 block text-sm font-semibold text-ink">
                {template.name}
              </span>
              <span className="block text-xs text-dim">
                {template.description}
              </span>
              <span className="mt-2 block text-[11px] text-faint">
                {template.blocks.length} blocos
              </span>
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-dim">
            Nenhum template encontrado.
          </p>
        )}

        {/* Skip */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-dim underline-offset-4 hover:text-ink hover:underline"
          >
            Começar do zero
          </button>
        </div>
      </div>
    </div>
  )
}
