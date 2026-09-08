import { addDoc, collection, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore'
import { db } from '../firebase'

export type LeadSource = 'newsletter' | 'form'

export interface Lead {
  id: string
  userId: string
  blockId: string
  name: string
  email: string
  source: LeadSource
  createdAt?: { toDate?: () => Date } | null
}

export async function createLead(lead: Omit<Lead, 'id' | 'createdAt'>) {
  await addDoc(collection(db, 'leads'), {
    ...lead,
    createdAt: serverTimestamp(),
  })
}

export function subscribeToLeads(userId: string, callback: (leads: Lead[]) => void) {
  return onSnapshot(
    query(collection(db, 'leads'), where('userId', '==', userId)),
    (snapshot) => {
      const leads = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Lead)
      leads.sort((a, b) => (b.createdAt?.toDate?.().getTime() || 0) - (a.createdAt?.toDate?.().getTime() || 0))
      callback(leads)
    },
    () => callback([]),
  )
}
