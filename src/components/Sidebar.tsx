import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { subscribeToLeads } from '../services/leadService'
import {
  LayoutDashboard,
  LayoutTemplate,
  Palette,
  BarChart3,
  Users,
  DollarSign,
  Settings,
  LogOut,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/my-page', icon: LayoutTemplate, label: 'Minha Página' },
  { to: '/dashboard/design', icon: Palette, label: 'Design' },
  { to: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/dashboard/audience', icon: Users, label: 'Audiência' },
  { to: '/dashboard/monetization', icon: DollarSign, label: 'Monetização' },
  { to: '/dashboard/settings', icon: Settings, label: 'Configurações' },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed] = useState(false)
  const [unreadLeads, setUnreadLeads] = useState(0)

  // Contador de mensagens não lidas para o badge da Audiência.
  useEffect(() => {
    if (!user?.uid) return
    return subscribeToLeads(user.uid, (leads) => {
      setUnreadLeads(leads.filter((lead) => !lead.read).length)
    })
  }, [user?.uid])

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <nav
      className={`fixed left-0 top-0 z-40 h-screen shrink-0 flex flex-col border-r transition-all duration-300 ${
        collapsed ? 'w-[68px] items-center' : 'w-60 items-stretch'
      }`}
      style={{
        background: 'var(--color-background-elevated)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Marca */}
      <div className={`mb-4 flex items-center gap-2.5 px-4 pt-4 ${collapsed ? 'justify-center px-0' : 'px-3'}`}>
        <img
          src={collapsed ? '/brand/icon-compact.svg' : '/brand/app-icon.svg'}
          alt=""
          className="h-9 w-9 shrink-0"
        />
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            BlockStack
          </span>
        )}
      </div>

      {/* Navigation */}
      <div className={`flex-1 flex flex-col gap-1 overflow-y-auto px-3 ${collapsed ? 'px-2' : ''}`}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={item.label}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                collapsed ? 'justify-center' : 'justify-start'
              } ${
                isActive
                  ? 'nav-item-active'
                  : 'nav-item'
              }`
            }
          >
            <span className="relative shrink-0">
            <item.icon className="h-5 w-5" />
            {item.to === '/dashboard/audience' && unreadLeads > 0 ? (
              <span
                className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold"
                style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
              >
                {unreadLeads > 9 ? '9+' : unreadLeads}
              </span>
            ) : null}
          </span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </div>

      {/* User info + Sair */}
      <div className="border-t p-3" style={{ borderColor: 'var(--color-border)' }}>
        <div
          className="flex items-center gap-3 rounded-lg p-2.5"
          style={{ background: 'var(--color-surface-raised)' }}
        >
          <img
            src={user?.photoURL || ''}
            alt={user?.displayName || ''}
            className="h-8 w-8 rounded-full object-cover shrink-0"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {user?.displayName || user?.email?.split('@')[0] || 'Usuário'}
              </p>
              <p className="truncate text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                Plano Pro
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Sair"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-white/5 hover:text-[var(--color-error)]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </nav>
  )
}
