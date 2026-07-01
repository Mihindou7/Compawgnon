'use client'

import { useQuery } from '@tanstack/react-query'
import { MessageSquare } from 'lucide-react'
import Link from 'next/link'

import { messagesApi } from '@/lib/api/messages.api'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils/cn'

export function MessageBell({ className }: { className?: string }) {
  const { isAuthenticated } = useAuth()

  const { data } = useQuery({
    queryKey: ['messages-unread-count'],
    queryFn: () => messagesApi.unreadCount(),
    enabled: isAuthenticated,
    refetchInterval: 20_000,
    staleTime: 15_000,
    select: (res) => res.data?.unread ?? 0,
  })

  const unread = data ?? 0

  return (
    <Link
      href="/compte/messages"
      className={cn(
        'relative flex h-9 w-9 items-center justify-center rounded-xl text-text-body transition-colors hover:bg-surface-cream hover:text-text-ink',
        className,
      )}
      aria-label={unread > 0 ? `${unread} message${unread > 1 ? 's' : ''} non lu${unread > 1 ? 's' : ''}` : 'Messages'}
    >
      <MessageSquare className={cn('h-5 w-5', unread > 0 && 'text-brand-green')} />
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-green text-[10px] font-bold text-white">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  )
}
