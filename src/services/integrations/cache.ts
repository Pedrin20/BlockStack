/**
 * Cache TTL simples (memória + localStorage) para respostas de serviços externos.
 * Usado pela camada de integrações para não estourar rate limits (ex: GitHub 60/h)
 * e para a página pública nunca refazer chamadas — o resultado resolvido é salvo
 * junto aos dados do bloco no momento da edição.
 */

const PREFIX = 'blockstack-integrations'

type Entry = { value: unknown; expiresAt: number }

const memory = new Map<string, Entry>()

export function cacheGet<T>(key: string): T | null {
  const k = `${PREFIX}:${key}`
  try {
    const mem = memory.get(k)
    if (mem) {
      if (mem.expiresAt > Date.now()) return mem.value as T
      memory.delete(k)
    }
    const raw = localStorage.getItem(k)
    if (!raw) return null
    const entry = JSON.parse(raw) as Entry
    if (entry.expiresAt > Date.now()) {
      memory.set(k, entry)
      return entry.value as T
    }
    localStorage.removeItem(k) // expirado — limpa para não crescer sem limite
    return null
  } catch {
    return null
  }
}

export function cacheSet(key: string, value: unknown, ttlMs: number) {
  const k = `${PREFIX}:${key}`
  const entry: Entry = { value, expiresAt: Date.now() + ttlMs }
  memory.set(k, entry)
  try {
    localStorage.setItem(k, JSON.stringify(entry))
  } catch {
    // quota cheia ou storage indisponível — segue só com a memória
  }
}

/** Cache de "erro recente": evita martelar um endpoint que acabou de falhar. */
export function cacheGetFlag(key: string): boolean {
  return cacheGet<{ flag: boolean }>(key)?.flag === true
}

export function cacheSetFlag(key: string, ttlMs: number) {
  cacheSet(key, { flag: true }, ttlMs)
}

/** Remove a chave do cache (usado no "Atualizar dados"). */
export function cacheDelete(key: string) {
  memory.delete(`${PREFIX}:${key}`)
  try {
    localStorage.removeItem(`${PREFIX}:${key}`)
  } catch {
    // ignore
  }
}
