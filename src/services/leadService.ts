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
  try {
    await addDoc(collection(db, 'leads'), {
      ...lead,
      // O visitante nunca escolhe o estado inicial da captura.
      read: false,
      createdAt: serverTimestamp(),
    })
  } catch (error) {
    // Não registre nome/e-mail: o código e o contexto técnico já bastam
    // para diferenciar bloqueador de navegador, regra negada e indisponibilidade.
    console.error('[leadService] Falha ao criar lead', {
      error,
      userId: lead.userId,
      blockId: lead.blockId,
      source: lead.source,
    })
    throw error
  }
}

export function subscribeToLeads(userId: string, callback: (leads: Lead[]) => void) {
  return onSnapshot(
    query(collection(db, 'leads'), where('userId', '==', userId)),
    (snapshot) => {
      const leads = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Lead)
      leads.sort((a, b) => (b.createdAt?.toDate?.().getTime() || 0) - (a.createdAt?.toDate?.().getTime() || 0))
      callback(leads)
    },
    (error) => {
      // Antes este erro virava silenciosamente uma lista vazia, o que
      // mascarava permission-denied e problemas de rede no painel.
      console.error('[leadService] Falha ao assinar leads', { error, userId })
      callback([])
    },
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
