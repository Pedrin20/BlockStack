import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { MainLayout } from '../layouts/MainLayout'
import { Shield, Trash2, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  deleteUser,
} from 'firebase/auth'
import toast from 'react-hot-toast'
import { useUserProfile } from '../hooks/useUserProfile'
import { QRCodeModal } from '../components/QRCodeModal'

export function Settings() {
  const { user, logout } = useAuth()
  const { profile } = useUserProfile(user?.uid)
  const [showQrCode, setShowQrCode] = useState(false)
  const publicUrl = profile?.username ? `${window.location.origin}/${profile.username}` : ''

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const [deletePassword, setDeletePassword] = useState('')
  const [showDeletePassword, setShowDeletePassword] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.email) return

    if (newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas nao coincidem.')
      return
    }
    if (currentPassword === newPassword) {
      toast.error('A nova senha deve ser diferente da atual.')
      return
    }

    setIsChangingPassword(true)
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, newPassword)
      toast.success('Senha alterada com sucesso!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        toast.error('Senha atual incorreta.')
      } else if (err.code === 'auth/weak-password') {
        toast.error('A nova senha e muito fraca.')
      } else {
        toast.error('Erro ao alterar senha. Tente novamente.')
      }
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.email) return

    if (!deletePassword) {
      toast.error('Digite sua senha para confirmar.')
      return
    }

    setIsDeleting(true)
    try {
      const credential = EmailAuthProvider.credential(user.email, deletePassword)
      await reauthenticateWithCredential(user, credential)
      await deleteUser(user)
      toast.success('Conta deletada com sucesso.')
      await logout()
    } catch (err: any) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        toast.error('Senha incorreta.')
      } else {
        toast.error('Erro ao deletar conta. Tente novamente.')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Configurações</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">
            Gerencie sua senha e conta.
          </p>
        </div>

        {/* Alterar Senha */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-soft)] flex items-center justify-center">
              <Shield size={20} className="text-[var(--color-primary)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Alterar senha</h2>
              <p className="text-xs text-[var(--color-text-secondary)]">Atualize sua senha de acesso</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="label">Senha atual</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input pr-11"
                  placeholder="Digite sua senha atual"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost p-1"
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Nova senha</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input pr-11"
                  placeholder="Digite a nova senha"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost p-1"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">Minimo de 6 caracteres</p>
            </div>

            <div>
              <label className="label">Confirmar nova senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
                placeholder="Confirme a nova senha"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPassword}
              className="btn btn-primary btn-lg w-full"
            >
              {isChangingPassword ? (
                <>
                  <span className="spinner spinner-white" />
                  Alterando...
                </>
              ) : (
                'Alterar senha'
              )}
            </button>
          </form>
        </div>

        {/* Zona de Perigo */}
        <div className="card p-6 border-[var(--color-error)]/30">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-error-soft)] flex items-center justify-center">
              <AlertTriangle size={20} className="text-[var(--color-error)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-error)]">Zona de perigo</h2>
              <p className="text-xs text-[var(--color-text-secondary)]">Ações irreversíveis para sua conta</p>
            </div>
          </div>

          {!showDeleteConfirm ? (
            <button onClick={() => setShowDeleteConfirm(true)} className="btn btn-outline border-[var(--color-error)] text-[var(--color-error)] hover:bg-[var(--color-error-soft)]">
              <Trash2 size={16} />
              Deletar minha conta
            </button>
          ) : (
            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div className="alert alert-error">
                <AlertTriangle size={18} />
                <div>
                  <p className="font-medium">⚠️ Esta ação é irreversível!</p>
                  <p className="text-xs opacity-80">Todos os seus dados, links e perfil serão permanentemente deletados.</p>
                </div>
              </div>

              <div>
                <label className="label">Confirme com sua senha</label>
                <div className="relative">
                  <input type={showDeletePassword ? 'text' : 'password'} value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} className="input input-error pr-11" placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowDeletePassword(!showDeletePassword)} className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost p-1">
                    {showDeletePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowDeleteConfirm(false); setDeletePassword('') }} className="btn btn-secondary btn-md flex-1">
                  Cancelar
                </button>
                <button type="submit" disabled={isDeleting} className="btn btn-destructive btn-md flex-1">
                  {isDeleting ? (<><span className="spinner spinner-white" /> Deletando...</>) : (<><Trash2 size={16} /> Deletar conta</>)}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      {publicUrl && profile?.username ? <QRCodeModal isOpen={showQrCode} onClose={() => setShowQrCode(false)} url={publicUrl} username={profile.username} /> : null}
    </MainLayout>
  )
}
