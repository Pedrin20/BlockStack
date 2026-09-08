import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  orderBy,
  query,
  serverTimestamp,
  where,
  onSnapshot,
  updateDoc,
  writeBatch,
  getDocs,
  getDoc,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { Block, BlockType, BlockSize, BlockDataMap, PageSettings } from '../types'
import { DEFAULT_PAGE_SETTINGS } from '../types'

const blocksCol = collection(db, 'blocks')

export async function createBlock<T extends BlockType>(
  userId: string,
  type: T,
  data: BlockDataMap[T] & { size?: BlockSize },
  currentMaxOrder: number = 0
): Promise<string> {
  const size = (data as any).size || '2x1'
  const { size: _, ...cleanData } = data as any
  const docRef = await addDoc(blocksCol, {
    userId,
    type,
    size,
    data: cleanData,
    order: currentMaxOrder,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}



export async function createBlocks(
  userId: string,
  blocks: { type: BlockType; data: any; size?: BlockSize }[]
): Promise<string[]> {
  const ids: string[] = []
  for (let i = 0; i < blocks.length; i++) {
    const { type, data, size } = blocks[i]
    const blockSize = size || '2x1'
    const { size: _, ...cleanData } = data
    const docRef = await addDoc(blocksCol, {
      userId,
      type,
      size: blockSize,
      data: cleanData,
      order: i,
      createdAt: serverTimestamp(),
    })
    ids.push(docRef.id)
  }
  return ids
}

export async function updateBlockData<T extends BlockType>(
  id: string,
  data: Partial<BlockDataMap[T]>
) {
  const ref = doc(db, 'blocks', id)
  await updateDoc(ref, { data })
}

export async function deleteBlock(id: string) {
  const ref = doc(db, 'blocks', id)
  await deleteDoc(ref)
}

export async function reorderBlocks(updates: { id: string; order: number }[]) {
  const batch = writeBatch(db)
  updates.forEach(({ id, order }) => {
    const ref = doc(db, 'blocks', id)
    batch.update(ref, { order })
  })
  await batch.commit()
}

export function subscribeToUserBlocks(
  userId: string,
  cb: (blocks: Block[]) => void
): () => void {
  const q = query(
    blocksCol,
    where('userId', '==', userId),
    orderBy('order', 'asc')
  )

  try {
    return onSnapshot(
      q,
      (snap) => {
        const items: Block[] = snap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            type: data.type as BlockType,
            size: (data.size as BlockSize) || '2x1',
            order: data.order ?? 0,
            userId: data.userId || '',
            data: data.data || {},
          } as Block
        })
        cb(items)
      },
      () => {
        // On permission error, return empty
        cb([])
      }
    )
  } catch {
    cb([])
    return () => {}
  }
}

export async function fetchUserBlocks(userId: string): Promise<Block[]> {
  const q = query(
    blocksCol,
    where('userId', '==', userId),
    orderBy('order', 'asc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      type: data.type as BlockType,
      size: (data.size as BlockSize) || '2x1',
      order: data.order ?? 0,
      userId: data.userId || '',
      data: data.data || {},
    } as Block
  })
}

// Fetch page settings for public profile
export async function fetchPageSettings(userId: string): Promise<PageSettings> {
  try {
    const settingsRef = doc(db, 'pageSettings', userId)
    const snap = await getDoc(settingsRef)
    if (snap.exists()) {
      return { ...DEFAULT_PAGE_SETTINGS, ...snap.data() } as PageSettings
    }
  } catch {
    // Firestore failed — try localStorage
  }
  try {
    const cached = localStorage.getItem(`getlink-settings-${userId}`)
    if (cached) {
      return { ...DEFAULT_PAGE_SETTINGS, ...JSON.parse(cached) } as PageSettings
    }
  } catch {}
  return DEFAULT_PAGE_SETTINGS
}

// ─── Migration from old link/old block types ───

const MIGRATION_KEY = 'getlink-links-migrated'

export function hasMigratedLinks(userId: string): boolean {
  try {
    return localStorage.getItem(`${MIGRATION_KEY}-${userId}`) === 'done'
  } catch {
    return false
  }
}

// Map old block types to new ones
function migrateBlockType(oldType: string): BlockType {
  const map: Record<string, BlockType> = {
    profile: 'header',
    'link-featured': 'product',
    project: 'service',
    image: 'gallery',
  }
  return map[oldType] || (oldType as BlockType)
}

function migrateBlockData(type: string, data: any): any {
  switch (type) {
    case 'profile':
      return { displayName: data.displayName || '', bio: data.bio || '', avatarUrl: data.avatarUrl || '' }
    case 'link':
      return {
        title: data.title || '',
        url: data.url || '',
        description: data.description || '',
        ...(data.schedule ? { schedule: data.schedule } : {}),
      }
    case 'link-featured':
      return { title: data.title || '', description: data.description || '', imageUrl: data.imageUrl || '', price: '', linkUrl: data.url || '' }
    case 'socials':
      return { items: data.items || [] }
    case 'project':
      return { title: data.title || '', description: data.description || '', actionLabel: 'Ver projeto', actionUrl: data.linkUrl || '' }
    case 'image':
      return { images: data.imageUrl ? [{ url: data.imageUrl, caption: data.caption || '' }] : [] }
    default:
      return data
  }
}

export async function migrateLinksToBlocks(userId: string): Promise<number> {
  if (hasMigratedLinks(userId)) return 0

  const existingBlocks = await fetchUserBlocks(userId)
  if (existingBlocks.length > 0) {
    // Check if old types need migration
    const hasOldTypes = existingBlocks.some(b =>
      ['profile', 'link-featured', 'project', 'image'].includes(b.type)
    )
    if (hasOldTypes) {
      const batch = writeBatch(db)
      existingBlocks.forEach(block => {
        if (['profile', 'link-featured', 'project', 'image'].includes(block.type)) {
          const newType = migrateBlockType(block.type)
          const ref = doc(db, 'blocks', block.id)
          batch.update(ref, {
            type: newType,
            data: migrateBlockData(block.type, block.data),
          })
        }
      })
      await batch.commit()
    }
    markMigrated(userId)
    return 0
  }

  // Migrate from old links collection
  const linksQuery = query(
    collection(db, 'links'),
    where('userId', '==', userId),
    orderBy('order', 'asc')
  )
  const linksSnap = await getDocs(linksQuery)

  if (linksSnap.empty) {
    markMigrated(userId)
    return 0
  }

  const batch = writeBatch(db)
  let order = 0

  linksSnap.docs.forEach((linkDoc) => {
    const linkData = linkDoc.data()
    const blockRef = doc(collection(db, 'blocks'))
    batch.set(blockRef, {
      userId,
      type: 'link',
      data: {
        title: linkData.title || '',
        url: linkData.url || '',
        description: linkData.description || '',
      },
      order: order++,
      createdAt: serverTimestamp(),
      _migratedFrom: linkDoc.id,
    })
  })

  await batch.commit()
  markMigrated(userId)
  return linksSnap.docs.length
}

function markMigrated(userId: string) {
  try {
    localStorage.setItem(`${MIGRATION_KEY}-${userId}`, 'done')
  } catch {
    // ignore
  }
}
