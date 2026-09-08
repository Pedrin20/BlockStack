import { collection, doc, increment, onSnapshot, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

export interface AnalyticsDay {
  date: string
  views: number
  clicks: number
  blockViews: Record<string, number>
  blockClicks: Record<string, number>
}

function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

/**
 * Stores aggregated counters instead of an event for each visit. This keeps the
 * analytics collection small and makes the 30-day comparison cheap to load.
 */
export function recordProfileView(userId: string, blockIds: string[]) {
  const key = dayKey()
  const updates: Record<string, unknown> = {
    date: key,
    views: increment(1),
    updatedAt: serverTimestamp(),
  }

  blockIds.forEach((id) => {
    updates[`blockViews.${id}`] = increment(1)
  })

  return setDoc(doc(db, 'analytics', userId, 'days', key), updates, { merge: true })
}

export function recordBlockClick(userId: string, blockId: string) {
  const key = dayKey()
  return setDoc(doc(db, 'analytics', userId, 'days', key), {
    date: key,
    clicks: increment(1),
    [`blockClicks.${blockId}`]: increment(1),
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

export function subscribeToAnalytics(userId: string, cb: (days: AnalyticsDay[]) => void) {
  const days = collection(db, 'analytics', userId, 'days')
  return onSnapshot(
    query(days, orderBy('date', 'desc')),
    (snapshot) => cb(snapshot.docs.map((item) => {
      const data = item.data()
      return {
        date: data.date || item.id,
        views: Number(data.views || 0),
        clicks: Number(data.clicks || 0),
        blockViews: data.blockViews || {},
        blockClicks: data.blockClicks || {},
      }
    })),
    () => cb([]),
  )
}
