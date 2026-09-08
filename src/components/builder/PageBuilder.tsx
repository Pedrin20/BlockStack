import { useEffect, useRef, useState } from 'react'
import type { Block, BlockType, BlockTypeDef } from '../../types'
import type { Template } from '../../lib/templates'
import { useBlocks } from '../../hooks/useBlocks'
import { BlockLibrary } from './BlockLibrary'
import { TemplatePicker } from './TemplatePicker'
import { BlockCard } from './BlockCard'
import { PropertiesPanel } from './PropertiesPanel'
import { Monitor, Smartphone, Eye, Share2, Sparkles, ArrowLeft, LayoutGrid, QrCode } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useUserProfile } from '../../hooks/useUserProfile'
import { QRCodeModal } from '../QRCodeModal'

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

export function PageBuilder({ userId }: { userId: string }) {
  const { blocks, loading, addBlock, addBlocks, removeBlock, updateBlock, reorder } = useBlocks(userId)
  const { profile } = useUserProfile(userId)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const navigate = useNavigate()
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [showPicker, setShowPicker] = useState(true)
  const [showQrCode, setShowQrCode] = useState(false)
  const dragIndex = useRef<number | null>(null)

  // Relógio para refletir status de agendamento no canvas do editor
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const selected = blocks.find((b) => b.id === selectedId) ?? null
  const publicUrl = profile?.username ? `${window.location.origin}/${profile.username}` : ''

  function getDefaultData(type: BlockType): any {
    const defaults: Record<BlockType, any> = {
      header: { displayName: 'Seu nome', bio: 'Escreva sua bio aqui', avatarUrl: '' },
      link: { title: 'Novo link', url: 'https://', description: '' },
      product: { title: 'Novo produto', description: 'Descrição curta', imageUrl: '', price: '0', linkUrl: '' },
      service: { title: 'Novo serviço', description: 'Descrição', actionLabel: 'Agendar', actionUrl: '' },
      gallery: { images: [] },
      video: { title: 'Vídeo', embedUrl: '' },
      text: { content: 'Seu texto aqui' },
      newsletter: { title: 'Assine minha lista', description: 'Novidades no seu e-mail', placeholder: 'seu@email.com', buttonText: 'Assinar' },
      socials: { items: [{ platform: 'instagram', url: '' }] },
      github: { username: '', showPinned: true },
      spotify: { uri: '', variant: 'track' },
      youtube: { videoUrl: '', title: '' },
      calendar: { title: 'Agendar consulta', description: 'Escolha o melhor horário', calUrl: '', availableHours: 'Seg-Sex, 9h às 18h' },
      form: { title: 'Fale comigo', fields: ['Nome', 'E-mail', 'Mensagem'], buttonText: 'Enviar', successMessage: 'Mensagem enviada!' },
      faq: { title: 'Perguntas frequentes', items: [{ question: 'Como funciona?', answer: 'Responda aqui...' }] },
      testimonial: { title: 'O que dizem sobre mim', items: [{ name: 'Cliente', role: 'Empresa', text: 'Excelente profissional!', avatarUrl: '' }] },
    }
    return defaults[type]
  }

  async function addBlockFromDef(def: BlockTypeDef) {
    try {
      await addBlock(def.type, { ...getDefaultData(def.type), size: def.defaultSize })
      toast.success('Bloco adicionado!')
    } catch {
      toast.error('Erro ao adicionar bloco')
    }
  }

  
  async function handleTemplateSelect(template: Template) {
    try {
      const blocksToAdd = template.blocks.map((b) => ({
        type: b.type,
        data: { ...b.data },
        size: b.size,
      }))
      await addBlocks(blocksToAdd)
      setShowPicker(false)
      toast.success(template.name + ' aplicado com sucesso!')
    } catch {
      toast.error('Erro ao aplicar template')
    }
  }

  async function updateBlockData(patch: Partial<Block>) {
    if (!selectedId) return
    try {
      await updateBlock(selectedId, patch)
    } catch {
      toast.error('Erro ao atualizar bloco')
    }
  }

  async function deleteBlock() {
    if (!selectedId) return
    try {
      await removeBlock(selectedId)
      setSelectedId(null)
      toast.success('Bloco removido!')
    } catch {
      toast.error('Erro ao remover bloco')
    }
  }

  function handleDrop(targetIndex: number) {
    const from = dragIndex.current
    if (from === null || from === targetIndex) return
    const next = [...blocks]
    const [moved] = next.splice(from, 1)
    next.splice(targetIndex, 0, moved)
    reorder(next)
    dragIndex.current = null
  }

  if (showPicker && blocks.length === 0 && !loading) {
    return (
      <div className="flex h-full flex-col">
        <header
          className="flex items-center justify-between gap-4 border-b px-4 py-3 md:px-6"
          style={{ borderColor: 'oklch(1 0 0 / 10%)' }}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-white hover:bg-white/5"
              title="Voltar"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">Minha Página</h1>
            </div>
          </div>
        </header>
        <TemplatePicker
          onSelect={handleTemplateSelect}
          onSkip={() => setShowPicker(false)}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-[oklch(0.58_0.24_285)] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <header
        className="flex items-center justify-between gap-4 border-b px-4 py-3 md:px-6"
        style={{ borderColor: 'oklch(1 0 0 / 10%)' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-white hover:bg-white/5"
            title="Voltar"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-white">
              Minha Página
            </h1>
            <p className="hidden text-xs text-gray-400 sm:block">
              {profile?.username ? `${window.location.host}/${profile.username}` : 'Defina seu username para publicar'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="hidden items-center gap-1 rounded-lg border p-1 sm:flex"
            style={{ borderColor: 'oklch(1 0 0 / 12%)', background: 'oklch(0.21 0.018 285)' }}
          >
            <button
              type="button"
              onClick={() => setDevice('desktop')}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                device === 'desktop'
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white',
              )}
              style={device === 'desktop' ? { background: 'oklch(0.58 0.24 285)' } : undefined}
              aria-label="Visualizar desktop"
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setDevice('mobile')}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                device === 'mobile'
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white',
              )}
              style={device === 'mobile' ? { background: 'oklch(0.58 0.24 285)' } : undefined}
              aria-label="Visualizar mobile"
            >
              <Smartphone className="h-4 w-4" />
            </button>
          </div>


          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="hidden items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/5 sm:flex"
            style={{ borderColor: 'oklch(1 0 0 / 12%)' }}
          >
            <LayoutGrid className="h-4 w-4" />
            Templates
          </button>
          <button
            type="button"
            className="hidden items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-white transition-colors sm:flex"
            style={{ borderColor: 'oklch(1 0 0 / 12%)', background: 'oklch(0.21 0.018 285)' }}
          >
            <Eye className="h-4 w-4" />
            Prévia
          </button>
          <button
            type="button"
            disabled={!publicUrl}
            onClick={() => setShowQrCode(true)}
            className="hidden items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:flex"
            style={{ borderColor: 'oklch(1 0 0 / 12%)', background: 'oklch(0.21 0.018 285)' }}
          >
            <QrCode className="h-4 w-4" /> QR Code
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
            style={{ background: 'oklch(0.58 0.24 285)' }}
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Publicar</span>
          </button>
        </div>
      </header>

      {/* Studio */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: block library */}
        <div
          className="hidden w-56 shrink-0 overflow-y-auto lg:block xl:w-64"
          style={{ borderRight: '1px solid oklch(1 0 0 / 10%)' }}
        >
          <BlockLibrary onAdd={addBlockFromDef} />
        </div>

        {/* Center: live canvas */}
        <div
          className="flex-1 overflow-y-auto"
          style={{
            background: 'radial-gradient(circle at 1px 1px, oklch(1 0 0 / 10%) 1px, transparent 0)',
            backgroundSize: '22px 22px',
          }}
        >
          <div className="flex min-h-full items-start justify-center p-4 md:p-8">
            <div
              className={cn(
                'w-full transition-all duration-300',
                device === 'mobile' ? 'max-w-sm' : 'max-w-2xl',
              )}
            >
              <div className="mb-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                <Sparkles className="h-3.5 w-3.5" style={{ color: 'oklch(0.7 0.19 35)' }} />
                Prévia ao vivo — arraste os blocos para reordenar
              </div>
              <div
                className="rounded-3xl p-4 shadow-2xl md:p-6"
                style={{
                  border: '1px solid oklch(1 0 0 / 12%)',
                  background: 'oklch(0.145 0 0 / 60%)',
                  boxShadow: '0 25px 50px -12px oklch(0.58 0.24 285 / 5%)',
                }}
              >
                <div className="grid auto-rows-[132px] grid-cols-2 gap-3 sm:grid-cols-4">
                  {blocks.map((block, i) => (
                    <BlockCard
                      key={block.id}
                      block={block}
                      now={now}
                      selected={block.id === selectedId}
                      onSelect={() => setSelectedId(block.id)}
                      draggable
                      onDragStart={() => { dragIndex.current = i }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop(i)}
                    />
                  ))}
                </div>
                {blocks.length === 0 && !showPicker ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                    <p className="text-sm font-medium text-white">Sua página está vazia</p>
                    <p className="text-xs text-gray-400">
                      Adicione blocos pela biblioteca à esquerda
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowPicker(true)}
                      className="mt-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
                      style={{ background: 'oklch(0.58 0.24 285)' }}
                    >
                      Escolher template
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Right: properties */}
        <div
          className="hidden w-64 shrink-0 overflow-y-auto md:block xl:w-72"
          style={{ borderLeft: '1px solid oklch(1 0 0 / 10%)' }}
        >
          <PropertiesPanel block={selected} blocks={blocks} onChange={updateBlockData} onDelete={deleteBlock} />
        </div>
      </div>
      {publicUrl && profile?.username ? <QRCodeModal isOpen={showQrCode} onClose={() => setShowQrCode(false)} url={publicUrl} username={profile.username} /> : null}
    </div>
  )
}
