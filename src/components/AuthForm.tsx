import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { createUserProfile, generateUniqueUsername } from '../services/userService'
import { Button, Input } from './ui'
import { Mail, Lock, LogIn, UserPlus, Blocks, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

export function AuthForm() {
  const { login, register } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleAction = async (action: 'login' | 'register') => {
    setError(null)
    setIsLoading(true)
    try {
      if (action === 'login') {
        await login(email, password)
        toast.success('Login realizado com sucesso!')
      } else {
        const userCredential = await register(email, password)
        const uid = userCredential.user.uid
        const baseUsername = email.split('@')[0]
        const username = await generateUniqueUsername(baseUsername)
        await createUserProfile(uid, username)
        toast.success('Conta criada com sucesso! 🎉')
      }
    } catch (err: any) {
      const message = err.message || 'Ocorreu um erro. Tente novamente.'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-background)' }}>
      <div className="w-full max-w-md relative animate-fade-in">
        {/* Glow decorativo no accent da marca */}
        <div className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full blur-3xl" style={{ background: 'var(--accent-glow)', opacity: 0.25 }} />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full blur-3xl" style={{ background: 'var(--accent-glow)', opacity: 0.2 }} />

        <div
          className="relative rounded-[var(--radius-2xl)] border p-8 md:p-10 backdrop-blur-xl"
          style={{
            background: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            boxShadow: 'var(--shadow-xl)',
          }}
        >
          <div className="flex flex-col items-center text-center mb-8">
            <div
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: 'var(--accent)', color: 'var(--accent-text)', boxShadow: 'var(--shadow-accent)' }}
            >
              <Blocks className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
              Olá, <span style={{ color: 'var(--accent-hover)' }}>seja bem vindo!</span>
            </h2>
            <p className="mt-2 max-w-xs text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Entre ou crie sua conta para organizar seus links com estilo.
            </p>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
            <div>
              <label htmlFor="email" className="label">
                E-mail
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
                icon={<Mail size={18} />}
                autoComplete="email"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                icon={<Lock size={18} />}
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="alert alert-error">
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                type="button"
                size="lg"
                className="flex-1"
                loading={isLoading}
                onClick={() => handleAction('login')}
              >
                <LogIn size={18} /> Entrar
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="flex-1"
                loading={isLoading}
                onClick={() => handleAction('register')}
              >
                <UserPlus size={18} /> Registrar
              </Button>
            </div>

            <p className="pt-2 text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
              Ao continuar, você concorda com nossos termos.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}