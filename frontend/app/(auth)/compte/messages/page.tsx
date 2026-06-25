'use client'

import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { MessageSquare } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { messagesApi } from '@/lib/api/messages.api'
import { resolveUploadUrl } from '@/lib/utils/urls'
import { AccountHeader } from '@/components/account/AccountHeader'
import { cn } from '@/lib/utils/cn'

export default function MessagesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagesApi.list(),
    refetchInterval: 15_000,
  })

  const conversations = data?.data ?? []

  return (
    <div className="max-w-2xl">
      <AccountHeader
        icon={MessageSquare}
        title="Messages"
        description="Vos échanges avec les vendeurs et acheteurs."
        count={conversations.filter((c) => c.unread_count > 0).length || undefined}
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface-cream" />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-green-lt text-brand-green">
            <MessageSquare className="h-8 w-8" />
          </span>
          <div>
            <p className="font-medium text-text-ink">Aucun message</p>
            <p className="mt-1 text-sm text-text-subtle">
              Contactez un vendeur depuis une annonce pour démarrer une conversation.
            </p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface-white">
          {conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/compte/messages/${conv.id}`}
              className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-cream"
            >
              {/* Animal cover */}
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-cream">
                {conv.animal.cover_url ? (
                  <Image
                    src={resolveUploadUrl(conv.animal.cover_url) ?? ''}
                    alt={conv.animal.title}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <MessageSquare className="m-auto h-6 w-6 text-text-subtle" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className={cn('truncate text-sm', conv.unread_count > 0 ? 'font-semibold text-text-ink' : 'font-medium text-text-body')}>
                    {conv.animal.title}
                  </p>
                  {conv.unread_count > 0 && (
                    <span className="shrink-0 rounded-full bg-brand-green px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-subtle">{conv.interlocutor.name}</p>
                {conv.last_message && (
                  <p className="mt-0.5 truncate text-xs text-text-subtle">
                    {conv.last_message.content}
                  </p>
                )}
              </div>

              {conv.last_message_at && (
                <p className="shrink-0 text-[11px] text-text-subtle">
                  {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false, locale: fr })}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
