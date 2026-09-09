import type { ReactNode } from 'react'

type EmptyStateProps = {
  /** Ícone ilustrativo (lucide) exibido no círculo */
  icon: ReactNode
  title: string
  description?: string
  /** Ação opcional abaixo do texto (ex: botão "Criar bloco") */
  action?: ReactNode
  className?: string
}

/**
 * EmptyState — padrão único de estado vazio/loading do produto
 * (Audiência, Analytics, listas do builder).
 * Ícone em círculo accent-soft + título + texto de apoio no mesmo tom,
 * nunca texto "esmaecido quebrado".
 */
export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`empty-state ${className}`}>
      <div className="empty-state-icon">{icon}</div>
      <p className="empty-state-title">{title}</p>
      {description ? <p className="empty-state-description">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
