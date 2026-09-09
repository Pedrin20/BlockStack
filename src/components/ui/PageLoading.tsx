import { Spinner } from './Spinner'

type PageLoadingProps = {
  label?: string
  /** Altura mínima da área de carregamento */
  minHeight?: string
}

/**
 * PageLoading — estado de carregamento de página/seção inteira.
 * Mesmo padrão em todas as telas: spinner accent + rótulo sutil.
 */
export function PageLoading({ label = 'Carregando...', minHeight = '60vh' }: PageLoadingProps) {
  return (
    <div className="flex items-center justify-center" style={{ minHeight }}>
      <div className="flex flex-col items-center gap-3">
        <Spinner size={40} />
        <p className="animate-pulse text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {label}
        </p>
      </div>
    </div>
  )
}
