'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
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

  const renderNavItems = (
    items: NavItem[],
  ) => {
    return items.map((item) => {
      const isActive = route === item.route
      const Icon = item.icon

      return (
        <SidebarMenuItem key={item.route}>
          <SidebarMenuButton
            isActive={isActive}
            onClick={() => handleNavClick(item.route)}
            tooltip={item.label}
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3"
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </motion.div>
          </SidebarMenuButton>
          {item.badge && item.badge > 0 && (
            <div className="absolute right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
              {item.badge > 99 ? '99+' : item.badge}
            </div>
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
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <Wallet className="size-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-base font-bold tracking-tight">FinWise</span>
            <span className="text-[11px] text-muted-foreground">
              Smart Finance
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderNavItems(mainNavItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderNavItems(secondaryNavItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{renderNavItems(bottomNavItems)}</SidebarMenu>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                tooltip="Logout"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-3"
                >
                  <LogOut className="size-4 shrink-0" />
                  <span className="truncate">Logout</span>
                </motion.div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="group-data-[collapsible=icon]:hidden p-3">
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-2.5">
            <Avatar className="size-8">
              <AvatarImage src={user?.avatar ?? undefined} alt={user?.name ?? 'User'} />
              <AvatarFallback className="text-xs font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-col overflow-hidden">
              <span className="truncate text-sm font-medium">
                {user?.name ?? 'User'}
              </span>
              <span className="truncate text-[11px] text-muted-foreground">
                {user?.email ?? ''}
              </span>
            </div>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
