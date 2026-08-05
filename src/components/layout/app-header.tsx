'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Bell,
  Menu,
  X,
  User,
  Settings,
  LogOut,
} from 'lucide-react'

import { AppRoute } from '@/types'
import { useRouterStore } from '@/store/router-store'
import { useAppStore } from '@/store/app-store'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { cn } from '@/lib/utils'

const ROUTE_LABELS: Record<string, string> = {
  [AppRoute.DASHBOARD]: 'Dashboard',
  [AppRoute.TRANSACTIONS]: 'Transactions',
  [AppRoute.BUDGETS]: 'Budgets',
  [AppRoute.GOALS]: 'Goals',
  [AppRoute.SUBSCRIPTIONS]: 'Subscriptions',
  [AppRoute.ANALYTICS]: 'Analytics',
  [AppRoute.REPORTS]: 'Reports',
  [AppRoute.CHAT]: 'AI Assistant',
  [AppRoute.NOTIFICATIONS]: 'Notifications',
  [AppRoute.SETTINGS]: 'Settings',
  [AppRoute.PROFILE]: 'Profile',
}

export function AppHeader() {
  const { route, setRoute, user, clearAuth } = useRouterStore()
  const { searchQuery, setSearchQuery } = useAppStore()
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [searchFocused, setSearchFocused] = React.useState(false)
  const notificationCount = 3

  const currentLabel = ROUTE_LABELS[route] ?? 'Dashboard'

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
    }
    clearAuth()
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
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b/60 bg-background/60 px-4 backdrop-blur-xl sm:px-6">
      <SidebarTrigger className="-ml-1" />

      <Separator orientation="vertical" className="mr-1 h-6 opacity-40" />

      {/* Breadcrumbs */}
      <Breadcrumb className="hidden sm:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              onClick={() => setRoute(AppRoute.DASHBOARD)}
              className="cursor-pointer text-muted-foreground/70 hover:text-foreground transition-colors duration-150"
            >
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-muted-foreground/30" />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-medium text-foreground">
              {currentLabel}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Mobile page title */}
      <motion.span
        key={currentLabel}
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="text-sm font-semibold sm:hidden"
      >
        {currentLabel}
      </motion.span>

      <div className="ml-auto flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60 transition-colors duration-150" />
          <Input
            placeholder="Search transactions..."
            className={cn(
              'h-9 w-64 rounded-xl border-border/60 bg-muted/40 pl-10 pr-4 text-sm',
              'transition-all duration-200 ease-out',
              'placeholder:text-muted-foreground/50',
              searchFocused
                ? 'w-80 border-primary/40 bg-background ring-4 ring-primary/5 shadow-sm'
                : 'hover:border-border hover:bg-muted/60',
            )}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>

        {/* Mobile search toggle */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 200, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="relative overflow-hidden md:hidden"
            >
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                placeholder="Search..."
                className="h-9 w-full rounded-xl border-border/60 bg-muted/40 pl-10 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setSearchOpen(!searchOpen)}
        >
          {searchOpen ? <X className="size-4" /> : <Search className="size-4" />}
          <span className="sr-only">Toggle search</span>
        </Button>

        {/* Notifications */}
        <motion.div whileTap={{ scale: 0.92 }}>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 rounded-xl"
            onClick={() => setRoute(AppRoute.NOTIFICATIONS)}
          >
            <Bell className="size-[18px] text-muted-foreground" />
            {notificationCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4.5 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white shadow-sm shadow-destructive/30">
                <motion.span
                  className="absolute inset-0 rounded-full bg-destructive"
                  animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                <span className="relative z-10">{notificationCount}</span>
              </span>
            )}
            <span className="sr-only">Notifications</span>
          </Button>
        </motion.div>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="transition-shadow duration-200"
            >
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full p-0 hover:ring-2 hover:ring-primary/20 hover:ring-offset-2 hover:ring-offset-background transition-all duration-200"
              >
                <Avatar className="size-9">
                  <AvatarImage
                    src={user?.avatar ?? undefined}
                    alt={user?.name ?? 'User'}
                  />
                  <AvatarFallback className="text-xs font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </motion.div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 rounded-xl border-border/60 p-1.5"
            align="end"
            forceMount
          >
            <DropdownMenuLabel className="font-normal px-2 py-1.5">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none">
                  {user?.name ?? 'User'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email ?? ''}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="opacity-60" />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => setRoute(AppRoute.PROFILE)}
                className="rounded-lg px-2 py-1.5 cursor-pointer transition-colors duration-150"
              >
                <User className="mr-2 size-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setRoute(AppRoute.SETTINGS)}
                className="rounded-lg px-2 py-1.5 cursor-pointer transition-colors duration-150"
              >
                <Settings className="mr-2 size-4" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="opacity-60" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive rounded-lg px-2 py-1.5 cursor-pointer transition-colors duration-150"
            >
              <LogOut className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
