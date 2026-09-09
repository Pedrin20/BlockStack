import type { InputHTMLAttributes, ReactNode } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  /** Ícone exibido à esquerda do campo (opcional) */
  icon?: ReactNode
  /** Elemento absoluto à direita (ex: botão olho de senha) */
  trailing?: ReactNode
  hasError?: boolean
}

/**
 * Input — padrão único de campo de texto do produto (login, configurações, builder).
 * Mesma classe .input em todas as telas: fundo translúcido escuro, borda 1px,
 * foco violeta. Ícones internos são opcionais e herdam a cor do texto.
 */
export function Input({ icon, trailing, hasError = false, className = '', ...rest }: InputProps) {
  const cls = ['input', hasError ? 'input-error' : '', className].filter(Boolean).join(' ')

  if (!icon && !trailing) {
    return <input className={cls} {...rest} />
  }

  return (
    <div className="relative">
      {icon ? (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }}>
          {icon}
        </span>
      ) : null}
      <input
        className={`${cls} ${icon ? 'pl-11' : ''} ${trailing ? 'pr-11' : ''}`}
        {...rest}
      />
      {trailing ? (
        <span className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</span>
      ) : null}
    </div>
  )
}
