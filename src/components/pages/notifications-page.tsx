'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  format,
  parseISO,
  isToday,
  isYesterday,
  startOfDay,
  subDays,
  isAfter,
  isBefore,
  endOfDay,
} from 'date-fns'
import {
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Bell,
  BellOff,
  CheckCheck,
  Trash2,
  Loader2,
  ChevronDown,
  Inbox,
  Eye,
} from 'lucide-react'

import { useRouterStore } from '@/store/router-store'
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from '@/hooks/use-notifications'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { ListSkeleton } from '@/components/shared/loading-skeleton'
import { formatRelativeTime } from '@/lib/format'
import type { Notification, AppRoute } from '@/types'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// ============================================================================
// Constants
// ============================================================================

const NOTIFICATION_ICONS: Record<
  Notification['type'],
  { icon: typeof Info; colorClass: string; bgClass: string }
> = {
  info: {
    icon: Info,
    colorClass: 'text-sky-600 dark:text-sky-400',
    bgClass: 'bg-sky-100 dark:bg-sky-900/40',
  },
  warning: {
    icon: AlertTriangle,
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-100 dark:bg-amber-900/40',
  },
  success: {
    icon: CheckCircle,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-100 dark:bg-emerald-900/40',
  },
  error: {
    icon: XCircle,
    colorClass: 'text-red-600 dark:text-red-400',
    bgClass: 'bg-red-100 dark:bg-red-900/40',
  },
}

type FilterTab = 'all' | 'unread' | 'info' | 'warning' | 'success'

// ============================================================================
// Animation Variants
// ============================================================================

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.03, duration: 0.25, ease: 'easeOut' },
  }),
  exit: {
    opacity: 0,
    x: 12,
    height: 0,
    marginTop: 0,
    marginBottom: 0,
    paddingTop: 0,
    paddingBottom: 0,
    transition: { duration: 0.2 },
  },
}

// ============================================================================
// Notification Item
// ============================================================================

function NotificationItem({
  notification,
  index,
  onMarkRead,
  onDelete,
  onClick,
}: {
  notification: Notification
  index: number
  onMarkRead: (id: string) => void
  onDelete: (id: string) => void
  onClick: (notification: Notification) => void
}) {
  const { icon: Icon, colorClass, bgClass } =
    NOTIFICATION_ICONS[notification.type]

  return (
    <motion.div
      custom={index}
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      className="group"
    >
      <Card
        className={
          'cursor-pointer overflow-hidden transition-all hover:shadow-sm ' +
          (!notification.isRead
            ? 'border-l-4 border-l-sky-500 bg-sky-50/30 dark:bg-sky-950/10'
            : 'border-l-4 border-l-transparent')
        }
        onClick={() => onClick(notification)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div
              className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg ${bgClass}`}
            >
              <Icon className={`size-4 ${colorClass}`} />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4
                      className={`truncate text-sm ${
                        notification.isRead
                          ? 'font-medium text-muted-foreground'
                          : 'font-semibold'
                      }`}
                    >
                      {notification.title}
                    </h4>
                    {/* Unread indicator */}
                    {!notification.isRead && (
                      <span className="size-2 shrink-0 rounded-full bg-sky-500" />
                    )}
                  </div>
                  <p
                    className={`mt-0.5 text-sm leading-relaxed ${
                      notification.isRead
                        ? 'text-muted-foreground'
                        : 'text-foreground/80'
                    }`}
                  >
                    {notification.message}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                    <Badge
                      variant="outline"
                      className={`h-5 text-[10px] ${
                        notification.type === 'info'
                          ? 'border-sky-200 text-sky-600 dark:border-sky-800 dark:text-sky-400'
                          : notification.type === 'warning'
                            ? 'border-amber-200 text-amber-600 dark:border-amber-800 dark:text-amber-400'
                            : notification.type === 'success'
                              ? 'border-emerald-200 text-emerald-600 dark:border-emerald-800 dark:text-emerald-400'
                              : 'border-red-200 text-red-600 dark:border-red-800 dark:text-red-400'
                      }`}
                    >
                      {notification.type}
                    </Badge>
                  </div>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="6" r="1.5" />
                        <circle cx="12" cy="12" r="1.5" />
                        <circle cx="12" cy="18" r="1.5" />
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!notification.isRead && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          onMarkRead(notification.id)
                        }}
                      >
                        <Eye className="mr-2 size-4" />
                        Mark as read
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 dark:text-red-400"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(notification.id)
                      }}
                    >
                      <Trash2 className="mr-2 size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ============================================================================
// Date Group Header
// ============================================================================

function DateGroupHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </h3>
      <Separator className="flex-1" />
    </div>
  )
}

// ============================================================================
// Notification List with Grouping
// ============================================================================

function NotificationList({
  notifications,
  onMarkRead,
  onDelete,
  onClick,
  loadMore,
  hasMore,
  isLoadingMore,
}: {
  notifications: Notification[]
  onMarkRead: (id: string) => void
  onDelete: (id: string) => void
  onClick: (notification: Notification) => void
  loadMore: () => void
  hasMore: boolean
  isLoadingMore: boolean
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Group notifications by date
  const groups = React.useMemo(() => {
    const result: { label: string; items: Notification[] }[] = []
    let currentLabel = ''
    let currentItems: Notification[] = []

    const sorted = [...notifications].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

    for (const notif of sorted) {
      const d = parseISO(notif.createdAt as unknown as string)
      let label: string
      if (isToday(d)) {
        label = 'Today'
      } else if (isYesterday(d)) {
        label = 'Yesterday'
      } else {
        label = 'Earlier'
      }

      if (label !== currentLabel) {
        if (currentItems.length > 0) {
          result.push({ label: currentLabel, items: currentItems })
        }
        currentLabel = label
        currentItems = [notif]
      } else {
        currentItems.push(notif)
      }
    }
    if (currentItems.length > 0) {
      result.push({ label: currentLabel, items: currentItems })
    }

    return result
  }, [notifications])

  // Infinite scroll observer
  React.useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const sentinel = el.querySelector('[data-sentinel]')
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore()
        }
      },
      { rootMargin: '200px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, isLoadingMore, loadMore])

  let globalIndex = 0

  return (
    <div ref={scrollRef} className="space-y-1">
      <AnimatePresence mode="popLayout">
        {groups.map((group) => (
          <div key={group.label}>
            <DateGroupHeader label={group.label} />
            <div className="space-y-2">
              {group.items.map((notif) => {
                const idx = globalIndex++
                return (
                  <NotificationItem
                    key={notif.id}
                    notification={notif}
                    index={idx}
                    onMarkRead={onMarkRead}
                    onDelete={onDelete}
                    onClick={onClick}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </AnimatePresence>

      {/* Infinite scroll sentinel + Load more button */}
      <div data-sentinel className="flex justify-center py-4">
        {isLoadingMore && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading more...
          </div>
        )}
        {hasMore && !isLoadingMore && (
          <Button variant="ghost" size="sm" onClick={loadMore}>
            <ChevronDown className="mr-1 size-4" />
            Load more
          </Button>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Main Page
// ============================================================================

export function NotificationsPage() {
  const { setRoute } = useRouterStore()

  // ---- Pagination / filter state ----
  const [activeTab, setActiveTab] = React.useState<FilterTab>('all')
  const [page, setPage] = React.useState(1)
  const [allNotifications, setAllNotifications] = React.useState<
    Notification[]
  >([])
  const [hasMore, setHasMore] = React.useState(true)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)

  const PAGE_SIZE = 20

  // ---- Data ----
  const { data, isLoading, isError, isFetching } = useNotifications({
    page,
    limit: PAGE_SIZE,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  const { data: unreadData } = useUnreadNotificationCount()
  const unreadCount = unreadData?.data?.count ?? 0

  const markReadMutation = useMarkNotificationRead()
  const markAllReadMutation = useMarkAllNotificationsRead()
  const deleteMutation = useDeleteNotification()

  // ---- Accumulate notifications for infinite scroll ----
  React.useEffect(() => {
    if (data?.data) {
      if (page === 1) {
        setAllNotifications(data.data)
      } else {
        setAllNotifications((prev) => {
          const existingIds = new Set(prev.map((n) => n.id))
          const newItems = data.data.filter((n) => !existingIds.has(n.id))
          return [...prev, ...newItems]
        })
      }
      setIsLoadingMore(false)
      const totalPages = data.pagination?.totalPages ?? 1
      setHasMore(page < totalPages)
    }
  }, [data, page])

  // ---- Filtered list for tabs ----
  const filteredNotifications = React.useMemo(() => {
    switch (activeTab) {
      case 'unread':
        return allNotifications.filter((n) => !n.isRead)
      case 'info':
        return allNotifications.filter((n) => n.type === 'info')
      case 'warning':
        return allNotifications.filter((n) => n.type === 'warning')
      case 'success':
        return allNotifications.filter((n) => n.type === 'success')
      default:
        return allNotifications
    }
  }, [allNotifications, activeTab])

  // ---- Handlers ----
  const handleLoadMore = React.useCallback(() => {
    setIsLoadingMore(true)
    setPage((prev) => prev + 1)
  }, [])

  const handleMarkRead = React.useCallback(
    (id: string) => {
      markReadMutation.mutate(id)
    },
    [markReadMutation],
  )

  const handleMarkAllRead = React.useCallback(() => {
    markAllReadMutation.mutate()
  }, [markAllReadMutation])

  const handleDelete = React.useCallback(
    (id: string) => {
      deleteMutation.mutate(id)
      // Optimistically remove from local state
      setAllNotifications((prev) => prev.filter((n) => n.id !== id))
    },
    [deleteMutation],
  )

  const handleNotificationClick = React.useCallback(
    (notification: Notification) => {
      // Mark as read
      if (!notification.isRead) {
        handleMarkRead(notification.id)
      }
      // Navigate if actionUrl
      if (notification.actionUrl) {
        setRoute(notification.actionUrl)
      }
    },
    [handleMarkRead, setRoute],
  )

  // Reset page when tab changes
  const handleTabChange = React.useCallback((value: string) => {
    setActiveTab(value as FilterTab)
  }, [])

  // ---- Tab unread counts ----
  const unreadInfoCount = allNotifications.filter(
    (n) => !n.isRead && n.type === 'info',
  ).length
  const unreadWarningCount = allNotifications.filter(
    (n) => !n.isRead && n.type === 'warning',
  ).length
  const unreadSuccessCount = allNotifications.filter(
    (n) => !n.isRead && n.type === 'success',
  ).length

  // ---- Loading ----
  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Notifications" />
        <ListSkeleton count={8} />
      </div>
    )
  }

  // ---- Empty ----
  if (allNotifications.length === 0 && !isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Notifications" />
        <EmptyState
          icon={BellOff}
          title="You're all caught up!"
          description="No notifications yet. We'll let you know when something important happens."
        />
      </div>
    )
  }

  // ---- Filtered empty ----
  const showFilteredEmpty =
    allNotifications.length > 0 && filteredNotifications.length === 0

  // ---- Render ----
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        actions={
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Badge
                variant="secondary"
                className="bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400"
              >
                {unreadCount} unread
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0 || markAllReadMutation.isPending}
            >
              {markAllReadMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <CheckCheck className="mr-2 size-4" />
              )}
              Mark all read
            </Button>
          </div>
        }
      />

      {/* ---- Filter Tabs ---- */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="all" className="gap-1.5">
            All
          </TabsTrigger>
          <TabsTrigger value="unread" className="gap-1.5">
            Unread
            {unreadCount > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-sky-500 text-[10px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="info" className="gap-1.5">
            Info
            {unreadInfoCount > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-sky-500 text-[10px] font-bold text-white">
                {unreadInfoCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="warning" className="gap-1.5">
            Warning
            {unreadWarningCount > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                {unreadWarningCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="success" className="gap-1.5">
            Success
            {unreadSuccessCount > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                {unreadSuccessCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* All Tabs share the same content, filtered */}
        {['all', 'unread', 'info', 'warning', 'success'].map((tab) => (
          <TabsContent key={tab} value={tab}>
            {showFilteredEmpty ? (
              <div className="py-12 text-center">
                <Inbox className="mx-auto mb-3 size-10 text-muted-foreground/50" />
                <p className="text-sm font-medium text-muted-foreground">
                  No {tab === 'all' ? '' : tab + ' '}notifications found
                </p>
              </div>
            ) : (
              <NotificationList
                notifications={filteredNotifications}
                onMarkRead={handleMarkRead}
                onDelete={handleDelete}
                onClick={handleNotificationClick}
                loadMore={handleLoadMore}
                hasMore={activeTab === 'all' && hasMore}
                isLoadingMore={isLoadingMore}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
