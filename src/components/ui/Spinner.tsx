type SpinnerProps = {
  /** Tamanho em px (padrão 20) */
  size?: number
  className?: string
}

/**
 * Spinner — carregamento padrão do produto, girando no token --accent.
 * Em telas inteiras usar <PageLoading /> de ui/PageLoading.
 */
export function Spinner({ size = 20, className = '' }: SpinnerProps) {
  return (
    <span
      className={`spinner ${className}`}
      style={{ width: size, height: size, borderWidth: Math.max(2, Math.round(size / 10)) }}
      role="status"
      aria-label="Carregando"
    />
  )
}
