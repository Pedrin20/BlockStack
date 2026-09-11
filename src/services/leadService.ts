import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { db } from '../firebase'

export type LeadSource = 'newsletter' | 'form'

export interface Lead {
  id: string
  userId: string
  blockId: string
  name: string
  email: string
  source: LeadSource
  /** Rótulo de origem exibido na Audiência — ex: "Formulário: Fale comigo" */
  sourceLabel?: string
  /** Conteúdo livre (mensagem/campos customizados) enviado no bloco */
  message?: string
  /** Respostas campo-a-campo enviadas no bloco de formulário */
  fields?: Record<string, string>
  /** Controle do inbox — true depois que o dono abre a mensagem */
  read?: boolean
  createdAt?: { toDate?: () => Date } | null
}

export async function createLead(lead: Omit<Lead, 'id' | 'createdAt'>) {
  await addDoc(collection(db, 'leads'), {
    ...lead,
    read: false,
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

/** Marca uma mensagem como lida (chamado ao abrir no inbox). */
export function markLeadRead(id: string) {
  return updateDoc(doc(db, 'leads', id), { read: true })
}

/** Volta a mensagem para não lida. */
export function markLeadUnread(id: string) {
  return updateDoc(doc(db, 'leads', id), { read: false })
}

/** Remove a mensagem do inbox. */
export function deleteLead(id: string) {
  return deleteDoc(doc(db, 'leads', id))
}
