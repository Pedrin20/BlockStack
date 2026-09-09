import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive'
type Size = 'sm' | 'md' | 'lg' | 'xl'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  loading?: boolean
  children: ReactNode
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  outline: 'btn-outline',
  destructive: 'btn-destructive',
}

const SIZE_CLASS: Record<Size, string> = {
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
  xl: 'btn-xl',
}

/**
 * Button — variantes e tamanhos via classes de token (.btn-*).
 * Cores sempre de --accent / semantic tokens, nunca fixas.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const cls = ['btn', VARIANT_CLASS[variant], SIZE_CLASS[size], className]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={cls} disabled={disabled || loading} {...rest}>
      {loading ? (
        <>
          <span className={`spinner ${variant === 'primary' || variant === 'destructive' ? 'spinner-white' : ''}`} />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  )
}
