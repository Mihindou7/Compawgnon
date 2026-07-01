'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Send } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'
import { toast } from 'sonner'

import { messagesApi, type ChatMessage } from '@/lib/api/messages.api'
import { cn } from '@/lib/utils/cn'

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function groupByDate(messages: ChatMessage[]): { date: string; messages: ChatMessage[] }[] {
  const groups: Record<string, ChatMessage[]> = {}
  messages.forEach((m) => {
    const date = new Date(m.created_at).toLocaleDateString('fr-FR')
    if (!groups[date]) groups[date] = []
    groups[date].push(m)
  })
  return Object.entries(groups).map(([date, messages]) => ({ date, messages }))
}

export default function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const convId = Number(id)
  const queryClient = useQueryClient()
  const [content, setContent] = React.useState('')
  const bottomRef = React.useRef<HTMLDivElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['conversation', convId],
    queryFn: () => messagesApi.get(convId),
    refetchInterval: () => document.visibilityState === 'visible' ? 10_000 : false,
  })

  const conversation = data?.data?.conversation
  const messages = data?.data?.messages ?? []
  const groups = groupByDate(messages)

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const sendMutation = useMutation({
    mutationFn: (text: string) => messagesApi.send(convId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', convId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: () => toast.error('Impossible d\'envoyer le message.'),
  })

  function handleSend() {
    const text = content.trim()
    if (!text || sendMutation.isPending) return
    setContent('')
    sendMutation.mutate(text)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-white">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Link href="/compte/messages" className="flex h-8 w-8 items-center justify-center rounded-xl text-text-subtle transition-colors hover:bg-surface-cream hover:text-text-ink">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        {conversation ? (
          <div className="min-w-0">
            <p className="truncate font-medium text-text-ink">{conversation.animal.title}</p>
            <p className="text-xs text-text-subtle">{conversation.interlocutor.name}</p>
          </div>
        ) : (
          <div className="h-8 w-40 animate-pulse rounded-lg bg-surface-cream" />
        )}
        {conversation && (
          <Link href={`/animaux/${conversation.animal.id}`} className="ml-auto shrink-0 rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-text-body transition-colors hover:bg-surface-cream">
            Voir l&apos;annonce
          </Link>
        )}
      </div>

      {/* Messages */}
      <div className="h-[calc(100vh-22rem)] overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={cn('flex', i % 2 === 0 ? 'justify-end' : 'justify-start')}>
                <div className="h-10 w-48 animate-pulse rounded-2xl bg-surface-cream" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="py-12 text-center text-sm text-text-subtle">
            Démarrez la conversation en envoyant un message.
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map(({ date, messages: dayMsgs }) => (
              <div key={date}>
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[11px] text-text-subtle">{formatDate(dayMsgs[0].created_at)}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="space-y-1.5">
                  {dayMsgs.map((msg) => (
                    <div key={msg.id} className={cn('flex', msg.is_mine ? 'justify-end' : 'justify-start')}>
                      <div className={cn(
                        'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
                        msg.is_mine
                          ? 'rounded-br-sm bg-brand-green text-white'
                          : 'rounded-bl-sm bg-surface-cream text-text-ink',
                      )}>
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className={cn('mt-1 text-right text-[10px]', msg.is_mine ? 'text-white/60' : 'text-text-subtle')}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Votre message… (Entrée pour envoyer, Shift+Entrée pour sauter une ligne)"
            rows={1}
            className="flex-1 resize-none overflow-hidden rounded-xl border border-border bg-surface-cream px-3 py-2.5 text-sm text-text-ink placeholder:text-text-subtle focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20"
            style={{ maxHeight: '120px' }}
            onInput={(e) => {
              const t = e.currentTarget
              t.style.height = 'auto'
              t.style.height = `${Math.min(t.scrollHeight, 120)}px`
            }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!content.trim() || sendMutation.isPending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-green text-white transition-all hover:bg-brand-green-dk disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
