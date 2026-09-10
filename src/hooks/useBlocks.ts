import { useEffect, useState, useCallback } from 'react'
import type { Block, BlockType, BlockDataMap, PageSettings } from '../types'
import {
  createBlock,
  createBlocks,
  deleteBlock,
  subscribeToUserBlocks,
  updateBlockData,
  reorderBlocks as reorderBlocksService,
} from '../services/blockService'
import {
  subscribeToPageSettings,
  savePageSettings as savePageSettingsService,
  getPageSettings,
} from '../services/settingsService'

export function useBlocks(userId?: string) {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setBlocks([])
      setLoading(false)
      return
    }

    setLoading(true)
    const unsub = subscribeToUserBlocks(userId, (items) => {
      setBlocks(items)
      setLoading(false)
    })

    return () => unsub()
  }, [userId])

  const addBlock = useCallback(async <T extends BlockType>(type: T, data: BlockDataMap[T] & { size?: import('../types').BlockSize }) => {
    if (!userId) return
    const maxOrder = blocks.reduce((max, b) => Math.max(max, b.order), -1)
    await createBlock(userId, type, data, maxOrder + 1)
  }, [userId, blocks])

  
  const addBlocks = useCallback(async (templateBlocks: { type: BlockType; data: any; size?: import('../types').BlockSize }[]) => {
    if (!userId) return
    await createBlocks(userId, templateBlocks)
  }, [userId])

  const removeBlock = useCallback(async (id: string) => {
    await deleteBlock(id)
  }, [])

  const updateBlock = useCallback(async (id: string, patch: Partial<Block>) => {
    // Handle size separately from data
    const { size, data, ...rest } = patch as any
    const dataUpdate: any = { ...data, ...rest }
    if (size !== undefined) {
      // We need to update size at the document level
      const { doc, updateDoc } = await import('firebase/firestore')
      const { db } = await import('../firebase')
      const ref = doc(db, 'blocks', id)
      const updates: any = {}
      if (size) updates.size = size
      if (data) updates.data = data
      if (Object.keys(updates).length > 0) {
        await updateDoc(ref, updates)
      }
    } else {
      await updateBlockData(id, dataUpdate)
    }
  }, [])

  const reorder = useCallback(async (newBlocks: Block[]) => {
    setBlocks(newBlocks)
    const updates = newBlocks.map((b, i) => ({ id: b.id, order: i }))
    await reorderBlocksService(updates)
  }, [])

  return { blocks, loading, addBlock, addBlocks, removeBlock, updateBlock, reorder }
}

export function usePageSettings(userId?: string) {
  const [settings, setSettings] = useState<PageSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setSettings(null)
      setLoading(false)
      return
    }

    setLoading(true)
    const unsub = subscribeToPageSettings(userId, (s) => {
      setSettings(s)
      setLoading(false)
    })

    return () => unsub()
  }, [userId])

  const saveSettings = useCallback(async (newSettings: PageSettings) => {
    if (!userId) return
    await savePageSettingsService(userId, newSettings)
  }, [userId])

  // Recarrega as settings direto da fonte (útil após publicar/despublicar,
  // principalmente no caminho de fallback via localStorage).
  const reload = useCallback(async () => {
    if (!userId) return
    const fresh = await getPageSettings(userId)
    setSettings(fresh)
  }, [userId])

  return { settings, loading, saveSettings, reload }
}
