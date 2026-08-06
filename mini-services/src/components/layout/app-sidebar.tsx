'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  Target,
  CreditCard,
  BarChart3,
  FileText,
  Bot,
  Bell,
  Settings,
  User,
  LogOut,
  Wallet,
} from 'lucide-react'

import { AppRoute } from '@/types'
import { useRouterStore } from '@/store/router-store'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type NavItem = {
  label: string
  route: string
  icon: React.ElementType
  badge?: number
}

const mainNavItems: NavItem[] = [
  { label: 'Dashboard', route: AppRoute.DASHBOARD, icon: LayoutDashboard },
  { label: 'Transactions', route: AppRoute.TRANSACTIONS, icon: ArrowLeftRight },
  { label: 'Budgets', route: AppRoute.BUDGETS, icon: PiggyBank },
  { label: 'Goals', route: AppRoute.GOALS, icon: Target },
  { label: 'Subscriptions', route: AppRoute.SUBSCRIPTIONS, icon: CreditCard },
  { label: 'Analytics', route: AppRoute.ANALYTICS, icon: BarChart3 },
  { label: 'Reports', route: AppRoute.REPORTS, icon: FileText },
]

const secondaryNavItems: NavItem[] = [
  { label: 'AI Assistant', route: AppRoute.CHAT, icon: Bot },
  { label: 'Notifications', route: AppRoute.NOTIFICATIONS, icon: Bell },
]

const bottomNavItems: NavItem[] = [
  { label: 'Settings', route: AppRoute.SETTINGS, icon: Settings },
  { label: 'Profile', route: AppRoute.PROFILE, icon: User },
]

export function AppSidebar() {
  const { route, setRoute, clearAuth, user } = useRouterStore()

  const handleNavClick = (navRoute: string) => {
    setRoute(navRoute)
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
    }
    clearAuth()
  }

  const renderNavItems = (items: NavItem[]) => {
    return items.map((item, index) => {
      const isActive = route === item.route
      const Icon = item.icon

      return (
        <SidebarMenuItem key={item.route}>
          <SidebarMenuButton
            isActive={isActive}
            onClick={() => handleNavClick(item.route)}
            tooltip={item.label}
            className={cn(
              'relative group transition-all duration-150 ease-out',
              'hover:scale-[1.02]',
              isActive && 'font-medium',
            )}
          >
            {isActive && (
              <motion.div
                layoutId="sidebar-active-indicator"
                className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[2px] rounded-full bg-primary"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            <motion.div
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3"
              initial={false}
            >
              <Icon
                className={cn(
                  'size-[18px] shrink-0 transition-colors duration-150',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground group-hover:text-foreground',
                )}
              />
              <span className="truncate">{item.label}</span>
            </motion.div>
          </SidebarMenuButton>
          {item.badge && item.badge > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 20,
                delay: index * 0.05,
              }}
              className="absolute right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/90 px-1.5 text-[10px] font-bold text-primary-foreground shadow-sm"
            >
              {item.badge > 99 ? '99+' : item.badge}
            </motion.div>
          )}
        </SidebarMenuItem>
      )
    })
  }

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 pb-3">
        <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-primary/8 via-primary/4 to-transparent p-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/20">
            <Wallet className="size-[18px] text-primary-foreground" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-[15px] font-bold tracking-tight">FinWise</span>
            <span className="text-[11px] font-medium tracking-wide text-muted-foreground">
              Smart Finance
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator className="opacity-50" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderNavItems(mainNavItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderNavItems(secondaryNavItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator className="opacity-50" />
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{renderNavItems(bottomNavItems)}</SidebarMenu>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                tooltip="Logout"
                className="text-destructive/70 hover:bg-destructive/8 hover:text-destructive transition-colors duration-150"
              >
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-3"
                >
                  <LogOut className="size-[18px] shrink-0" />
                  <span className="truncate">Logout</span>
                </motion.div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarGroupContent>
        </SidebarGroup>

        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="group-data-[collapsible=icon]:hidden p-3 pt-1"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-border/40 bg-background/40 p-3 shadow-sm backdrop-blur-xl">
              <Avatar className="size-9 ring-2 ring-primary/15 ring-offset-1 ring-offset-background">
                <AvatarImage
                  src={user?.avatar ?? undefined}
                  alt={user?.name ?? 'User'}
                />
                <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-primary/20 to-primary/5">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col overflow-hidden">
                <span className="truncate text-[13px] font-semibold">
                  {user?.name ?? 'User'}
                </span>
                <span className="truncate text-[11px] text-muted-foreground">
                  {user?.email ?? ''}
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
