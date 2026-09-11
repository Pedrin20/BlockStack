import type { GitHubProfileSnapshot } from '../../types'
import { cacheGet, cacheSet, cacheGetFlag, cacheSetFlag, cacheDelete } from './cache'
import { fetchJson, IntegrationError } from './http'

/**
 * Integração GitHub via API pública REST — sem autenticação (60 req/h por IP).
 * Chamada APENAS no editor quando o usuário digita/edita o username; o snapshot
 * é salvo no bloco e a página pública nunca chama a API (imune a rate limit).
 */

const SUCCESS_TTL = 6 * 60 * 60 * 1000 // 6h — bem abaixo do rate limit
const ERROR_TTL = 5 * 60 * 1000

const USERNAME_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/

interface GitHubUser {
  login: string
  name?: string | null
  bio?: string | null
  avatar_url?: string
  html_url?: string
  public_repos?: number
}

interface GitHubRepo {
  name: string
  language: string | null
  stargazers_count: number
  fork: boolean
}

export function isValidGithubUsername(username: string): boolean {
  return USERNAME_RE.test((username || '').trim())
}

/** Normaliza colas comuns: "https://github.com/user", "@user", "user/". */
export function normalizeGithubUsername(input: string): string {
  const raw = (input || '').trim().replace(/^@/, '')
  const fromUrl = raw.match(/github\.com\/([a-zA-Z0-9-]+)/)
  const login = fromUrl ? fromUrl[1] : raw.replace(/\/+$/, '')
  return login
}

function cacheKey(login: string): string {
  return `github:user:${login.toLowerCase()}`
}

/** Score por repo = 1 + estrelas (log) — valoriza projetos populares sem dominar. */
function topLanguages(repos: GitHubRepo[], max = 6): { name: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const repo of repos) {
    if (repo.fork || !repo.language) continue
    const score = 1 + Math.min(Math.log10(Math.max(repo.stargazers_count, 1)) * 2, 8)
    counts.set(repo.language, (counts.get(repo.language) || 0) + score)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([name, count]) => ({ name, count: Math.round(count) }))
}

/**
 * Busca perfil + repositórios públicos e calcula as linguagens mais usadas.
 * Lança IntegrationError com mensagens prontas para a UI do editor; o chamador
 * decide mostrar o erro e manter o snapshot anterior.
 */
export async function resolveGithubProfile(input: string, forceRefresh = false): Promise<GitHubProfileSnapshot> {
  const login = normalizeGithubUsername(input)
  if (!isValidGithubUsername(login)) {
    throw new IntegrationError('Usuário do GitHub inválido')
  }

  const key = cacheKey(login)
  if (!forceRefresh) {
    const cached = cacheGet<GitHubProfileSnapshot>(key)
    if (cached) return cached
    if (cacheGetFlag(`${key}:err`)) throw new IntegrationError('GitHub indisponível agora — tente novamente em instantes')
  } else {
    cacheDelete(key)
    cacheDelete(`${key}:err`)
  }

  try {
    const headers = { Accept: 'application/vnd.github+json' }
    const user = await fetchJson<GitHubUser>(`https://api.github.com/users/${encodeURIComponent(login)}`, { headers })
    if (!user || !user.login) throw new IntegrationError('Perfil não encontrado', 404)

    // Repos visíveis na primeira página (100) — suficiente para o cálculo
    let repos: GitHubRepo[] = []
    try {
      repos = await fetchJson<GitHubRepo[]>(
        `https://api.github.com/users/${encodeURIComponent(login)}/repos?per_page=100&sort=updated`,
        { headers }
      )
      if (!Array.isArray(repos)) repos = []
    } catch {
      // Sem repos (perfil novo ou rate limit parcial): o card segue com o resto dos dados
    }

    const snapshot: GitHubProfileSnapshot = {
      login: user.login,
      name: user.name || undefined,
      bio: user.bio || undefined,
      avatarUrl: user.avatar_url || undefined,
      profileUrl: user.html_url || `https://github.com/${user.login}`,
      publicRepos: user.public_repos ?? 0,
      topLanguages: topLanguages(repos),
      resolvedAt: new Date().toISOString(),
    }
    cacheSet(key, snapshot, SUCCESS_TTL)
    return snapshot
  } catch (err) {
    cacheSetFlag(`${key}:err`, ERROR_TTL)
    if (err instanceof IntegrationError) {
      if (err.status === 404) throw new IntegrationError('Perfil do GitHub não encontrado', 404)
      if (err.status === 403) {
        throw new IntegrationError('Limite de consultas do GitHub atingido — tente novamente mais tarde', 403)
      }
      throw err
    }
    throw new IntegrationError('Falha ao consultar o GitHub')
  }
}
