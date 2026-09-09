import type { ReactNode, CSSProperties } from 'react'

type CardProps = {
  children: ReactNode
  className?: string
  /** Elevação no hover (usar em cards clicáveis) */
  hover?: boolean
  /** Sombra permanente de elevação */
  elevated?: boolean
  style?: CSSProperties
}

/**
 * Card — bloco-base do produto (Analytics, Audiência, Configurações, ...).
 * Vidro escuro translúcido + borda 1px sutil + radius 2xl, via tokens.
 * Nenhuma cor fixa: tudo vem de --color-surface / --color-border.
 */
export function Card({ children, className = '', hover = false, elevated = false, style }: CardProps) {
  const cls = [
    'card',
    hover ? 'card-hover' : '',
    elevated ? 'card-elevated' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cls} style={style}>
      {children}
    </div>
  )
}
