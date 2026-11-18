import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LucideIcon } from 'lucide-react'

export interface SidebarNavItemProps {
  to: string
  icon: LucideIcon
  label: string
  collapsed?: boolean
  badge?: number | string
  badgeVariant?: 'primary' | 'gray'
  onClick?: () => void
}

export const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
  to,
  icon: Icon,
  label,
  collapsed = false,
  badge,
  badgeVariant = 'gray',
  onClick,
}) => {
  const location = useLocation()
  const isActive = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to))

  return (
    <NavLink
      to={to}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 select-none ${
        isActive
          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold shadow-xs'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
      } ${collapsed ? 'justify-center px-0 w-10 h-10 mx-auto' : ''}`}
    >
      {/* Active accent indicator bar */}
      {isActive && !collapsed && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 dark:bg-blue-400 rounded-r-full" />
      )}

      <Icon
        className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-105 ${
          isActive
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
        }`}
      />

      {!collapsed && (
        <span className="truncate flex-1 tracking-tight">{label}</span>
      )}

      {!collapsed && badge !== undefined && (
        <span
          className={`ml-auto text-xs px-2 py-0.5 rounded-full font-semibold ${
            badgeVariant === 'primary'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
          }`}
        >
          {badge}
        </span>
      )}

      {/* Tooltip for collapsed view */}
      {collapsed && (
        <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-lg">
          {label}
        </div>
      )}
    </NavLink>
  )
}

export default SidebarNavItem
