/**
 * Helper de fetch para as integrações externas — sempre com timeout e erros
 * tipados, para que nenhuma falha de rede quebre a UI dos blocos.
 */

export class IntegrationError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'IntegrationError'
    this.status = status
  }
}

/** JSON.stringify estável para montar chaves de cache determinísticas. */
export function stableStringify(value: unknown): string {
  const json = JSON.stringify(value, (_key, val) => {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      return Object.fromEntries(Object.entries(val as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)))
    }
    return val
  })
  return json ?? ''
}

export async function fetchJson<T>(url: string, init?: RequestInit, timeoutMs = 10_000): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...init, signal: controller.signal })
    if (!res.ok) {
      throw new IntegrationError(`HTTP ${res.status}`, res.status)
    }
    return (await res.json()) as T
  } catch (err) {
    if (err instanceof IntegrationError) throw err
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new IntegrationError('Tempo de resposta excedido')
    }
    throw new IntegrationError(err instanceof Error ? err.message : 'Falha de rede')
  } finally {
    clearTimeout(timer)
  }
}
