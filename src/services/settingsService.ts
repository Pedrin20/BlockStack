import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { PageSettings } from '../types'
import { DEFAULT_PAGE_SETTINGS } from '../types'

const SETTINGS_COLLECTION = 'pageSettings'

function getUserSettingsRef(userId: string) {
  return doc(db, SETTINGS_COLLECTION, userId)
}

function errorCode(err: unknown): string {
  const e = err as { code?: string; message?: string }
  return e?.code || e?.message || String(err)
}

/** Atualiza o cache local usado como fallback quando o Firestore falha. */
function patchLocalCache(userId: string, patch: Partial<PageSettings>) {
  try {
    const cached = localStorage.getItem(`getlink-settings-${userId}`)
    const current = cached ? JSON.parse(cached) : {}
    localStorage.setItem(
      `getlink-settings-${userId}`,
      JSON.stringify({ ...DEFAULT_PAGE_SETTINGS, ...current, ...patch }),
    )
  } catch {
    // localStorage indisponível — ignora
  }
}

/** Publica a página: grava published = true + publishedAt no Firestore. */
export async function publishPage(userId: string): Promise<void> {
  const fallback = { published: true as const, publishedAt: new Date().toISOString() }
  try {
    await setDoc(
      getUserSettingsRef(userId),
      { published: true, publishedAt: serverTimestamp() },
      { merge: true },
    )
    patchLocalCache(userId, fallback)
  } catch (err: unknown) {
    // Firestore indisponível: respeita a ação no cache local (mesmo fallback
    // usado por savePageSettings) para não travar o fluxo do usuário.
    console.warn('[SettingsService] Publish fell back to localStorage:', errorCode(err))
    patchLocalCache(userId, fallback)
  }
}

/** Despublica a página: grava published = false no Firestore. */
export async function unpublishPage(userId: string): Promise<void> {
  const fallback = { published: false as const, publishedAt: null }
  try {
    await updateDoc(getUserSettingsRef(userId), { published: false, publishedAt: null })
    patchLocalCache(userId, fallback)
  } catch (err: unknown) {
    console.warn('[SettingsService] Unpublish fell back to localStorage:', errorCode(err))
    patchLocalCache(userId, fallback)
  }
}

export async function getPageSettings(userId: string): Promise<PageSettings> {
  try {
    const snap = await getDoc(getUserSettingsRef(userId))
    if (snap.exists()) {
      return { ...DEFAULT_PAGE_SETTINGS, ...snap.data() } as PageSettings
    }
  } catch {
    // Firestore failed, try localStorage
  }
  try {
    const cached = localStorage.getItem(`getlink-settings-${userId}`)
    if (cached) {
      return { ...DEFAULT_PAGE_SETTINGS, ...JSON.parse(cached) } as PageSettings
    }
  } catch {}
  return DEFAULT_PAGE_SETTINGS
}

export async function savePageSettings(userId: string, settings: PageSettings): Promise<void> {
  try {
    await setDoc(getUserSettingsRef(userId), settings, { merge: true })
  } catch (err: any) {
    console.error('[SettingsService] Failed to save page settings:', err?.code || err?.message || err)
    // If Firestore fails (e.g. security rules), save to localStorage as fallback
    try {
      localStorage.setItem(`getlink-settings-${userId}`, JSON.stringify(settings))
    } catch {}
    throw err
  }
}

export function subscribeToPageSettings(
  userId: string,
  cb: (settings: PageSettings) => void
): () => void {
  try {
    return onSnapshot(
      getUserSettingsRef(userId),
      (snap) => {
        if (snap.exists()) {
          cb({ ...DEFAULT_PAGE_SETTINGS, ...snap.data() } as PageSettings)
        } else {
          // No Firestore doc — try localStorage fallback
          try {
            const cached = localStorage.getItem(`getlink-settings-${userId}`)
            if (cached) {
              cb({ ...DEFAULT_PAGE_SETTINGS, ...JSON.parse(cached) } as PageSettings)
            } else {
              cb(DEFAULT_PAGE_SETTINGS)
            }
          } catch {
            cb(DEFAULT_PAGE_SETTINGS)
          }
        }
      },
      (err) => {
        console.warn('[SettingsService] onSnapshot error, trying localStorage:', err?.code || err?.message)
        try {
          const cached = localStorage.getItem(`getlink-settings-${userId}`)
          if (cached) {
            cb({ ...DEFAULT_PAGE_SETTINGS, ...JSON.parse(cached) } as PageSettings)
          } else {
            cb(DEFAULT_PAGE_SETTINGS)
          }
        } catch {
          cb(DEFAULT_PAGE_SETTINGS)
        }
      }
    )
  } catch {
    cb(DEFAULT_PAGE_SETTINGS)
    return () => {}
  }
}
