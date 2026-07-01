'use client'

import * as Popover from '@radix-ui/react-popover'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, BellRing, CheckCheck, Package, Star, Tag } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

import { notificationsApi, type Notification } from '@/lib/api/notifications.api'
import { cn } from '@/lib/utils/cn'

const TYPE_ICON: Record<string, React.ElementType> = {
  reservation_created:  Package,
  reservation_accepted: Star,
  reservation_rejected: Tag,
  new_message:          Bell,
  review_received:      Star,
}

const TYPE_LABEL: Record<string, string> = {
  reservation_created:  'Nouvelle demande de réservation',
  reservation_accepted: 'Réservation acceptée',
  reservation_rejected: 'Réservation refusée',
  new_message:          'Nouveau message',
  review_received:      'Avis reçu',
}

function NotifItem({ notif, onRead }: { notif: Notification; onRead: (id: number) => void }) {
  const Icon = TYPE_ICON[notif.type] ?? Bell
  const animalTitle = notif.payload.animal_title as string | undefined

  return (
    <button
      type="button"
      onClick={() => !notif.read && onRead(notif.id)}
      className={cn(
        'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-cream',
        !notif.read && 'bg-brand-green-lt/30',
      )}
    >
      <span className={cn(
        'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
        notif.read ? 'bg-surface-cream text-text-subtle' : 'bg-brand-green text-white',
      )}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm', notif.read ? 'text-text-body' : 'font-medium text-text-ink')}>
          {TYPE_LABEL[notif.type] ?? notif.type}
        </p>
        {animalTitle && (
          <p className="truncate text-xs text-text-subtle">{animalTitle}</p>
        )}
        <p className="mt-0.5 text-[11px] text-text-subtle">
          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: fr })}
        </p>
      </div>
      {!notif.read && (
        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-green" />
      )}
    </button>
  )
}

export function NotificationBell() {
  const queryClient = useQueryClient()
  const [open, setOpen] = React.useState(false)

  const { data: countData } = useQuery({
    queryKey: ['notif-count'],
    queryFn: () => notificationsApi.count(),
    refetchInterval: 30_000,
    staleTime: 20_000,
  })

  const { data: listData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list(),
    enabled: open,
    staleTime: 0,
  })

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notif-count'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notif-count'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const unread = countData?.data?.unread ?? 0
  const notifications = listData?.data ?? []

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-text-body transition-colors hover:bg-surface-cream hover:text-text-ink"
          aria-label="Notifications"
        >
          {unread > 0 ? <BellRing className="h-5 w-5 text-brand-green" /> : <Bell className="h-5 w-5" />}
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-green text-[10px] font-bold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-80 overflow-hidden rounded-2xl border border-border bg-surface-white shadow-xl animate-scale-in"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="font-medium text-text-ink">Notifications</h3>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending}
                className="flex items-center gap-1 text-xs text-brand-green transition-colors hover:text-brand-green-dk"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Tout marquer lu
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-text-subtle">
                Aucune notification
              </div>
            ) : (
              notifications.slice(0, 10).map((notif) => (
                <NotifItem
                  key={notif.id}
                  notif={notif}
                  onRead={(id) => markReadMutation.mutate(id)}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border p-2">
            <Link
              href="/compte/reservations"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center rounded-xl py-2 text-sm font-medium text-brand-green transition-colors hover:bg-brand-green-lt"
            >
              Voir mes réservations
            </Link>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
