'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Archive, Eye, Inbox, Mail, RotateCcw, Send, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { adminApi } from '@/lib/api/admin.api'
import { ApiError } from '@/lib/api/client'
import { AccountHeader } from '@/components/account/AccountHeader'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { FilterTabs } from '@/components/admin/FilterTabs'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { Textarea } from '@/components/ui/Textarea'
import { formatDate } from '@/lib/utils/formatters'
import type { ContactMessage, ContactStatus, ContactSubject } from '@/lib/types/api.types'

const SUBJECT_LABEL: Record<ContactSubject, string> = {
  general:     'Question générale',
  compte:      'Mon compte',
  annonce:     'Une annonce',
  vendeur:     'Devenir vendeur',
  signalement: 'Signalement / abus',
  autre:       'Autre',
}

const STATUS_CONFIG: Record<ContactStatus, { label: string; variant: 'amber' | 'blue' | 'green' | 'gray' }> = {
  new:         { label: 'Nouveau',  variant: 'amber' },
  in_progress: { label: 'En cours', variant: 'blue' },
  resolved:    { label: 'Résolu',   variant: 'green' },
  archived:    { label: 'Archivé',  variant: 'gray' },
}

const FILTERS: { value: ContactStatus | 'all'; label: string }[] = [
  { value: 'all',         label: 'Tous' },
  { value: 'new',         label: 'Nouveaux' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'resolved',    label: 'Résolus' },
  { value: 'archived',    label: 'Archivés' },
]

export default function AdminContactsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<ContactStatus | 'all'>('all')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ContactMessage | null>(null)

  const status = filter === 'all' ? undefined : filter

  const { data, isLoading } = useQuery({
    queryKey: ['admin-contacts', page, status],
    queryFn: () => adminApi.listContacts({ page, status }),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-contacts'] })
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
  }

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteContact(id),
    onSuccess: () => {
      toast.success('Demande supprimée.')
      setDeleteTarget(null)
      invalidate()
    },
    onError: () => toast.error('Suppression impossible.'),
  })

  const stats = data?.stats
  const total = data?.meta?.total ?? data?.data?.length ?? 0

  const columns: Column<ContactMessage>[] = [
    {
      key: 'from',
      header: 'Expéditeur',
      render: (c) => (
        <div>
          <p className="font-medium text-text-ink">{c.name}</p>
          <p className="text-xs text-text-subtle">{c.email}</p>
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Sujet',
      render: (c) => <Badge variant="gray">{SUBJECT_LABEL[c.subject] ?? c.subject}</Badge>,
    },
    {
      key: 'excerpt',
      header: 'Message',
      render: (c) => (
        <p className="max-w-xs truncate text-sm text-text-subtle">{c.excerpt ?? '—'}</p>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      render: (c) => <Badge variant={STATUS_CONFIG[c.status].variant} dot>{STATUS_CONFIG[c.status].label}</Badge>,
    },
    {
      key: 'date',
      header: 'Reçu le',
      render: (c) => <span className="text-xs">{formatDate(c.created_at)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '150px',
      render: (c) => (
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" leftIcon={Eye} onClick={() => setSelectedId(c.id)}>
            Ouvrir
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => setDeleteTarget(c)} aria-label="Supprimer">
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ]

  const filterTabs = FILTERS.map((f) => ({
    ...f,
    count:
      f.value === 'all'
        ? stats ? stats.new + stats.in_progress + stats.resolved + stats.archived : undefined
        : stats?.[f.value],
  }))

  return (
    <div>
      <AccountHeader
        icon={Inbox}
        title="Demandes de contact"
        description="Consultez et répondez aux messages envoyés via le formulaire de contact."
        count={total}
        countLabel={total > 1 ? 'messages' : 'message'}
      />

      {stats && stats.new > 0 && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <Mail className="h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{stats.new}</span>
            {' '}nouveau{stats.new > 1 ? 'x' : ''} message{stats.new > 1 ? 's' : ''} en attente de traitement.
          </p>
        </div>
      )}

      <FilterTabs
        filters={filterTabs}
        value={filter}
        onChange={(v) => { setFilter(v); setPage(1) }}
        className="mb-5"
      />

      <DataTable
        columns={columns}
        data={data?.data}
        isLoading={isLoading}
        keyExtractor={(c) => c.id}
        emptyMessage="Aucune demande de contact"
      />

      {data?.meta && data.meta.total_pages > 1 && (
        <Pagination meta={data.meta} onPageChange={setPage} className="mt-6" />
      )}

      <ContactDetailModal
        contactId={selectedId}
        onClose={() => setSelectedId(null)}
        onChanged={invalidate}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Supprimer la demande"
        description={`Supprimer définitivement le message de ${deleteTarget?.name} ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        isLoading={deleteMutation.isPending}
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id) }}
      />
    </div>
  )
}

function ContactDetailModal({
  contactId,
  onClose,
  onChanged,
}: {
  contactId: number | null
  onClose: () => void
  onChanged: () => void
}) {
  const queryClient = useQueryClient()
  const [reply, setReply] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-contact', contactId],
    queryFn: () => adminApi.getContact(contactId!),
    enabled: contactId !== null,
    select: (res) => res.data,
  })

  const contact = data

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-contact', contactId] })
    onChanged()
  }

  const statusMutation = useMutation({
    mutationFn: (status: ContactStatus) => adminApi.updateContactStatus(contactId!, status),
    onSuccess: () => { toast.success('Statut mis à jour.'); refresh() },
    onError: () => toast.error('Mise à jour impossible.'),
  })

  const replyMutation = useMutation({
    mutationFn: (message: string) => adminApi.replyContact(contactId!, message),
    onSuccess: () => {
      toast.success('Réponse envoyée par email.')
      setReply('')
      refresh()
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Envoi impossible.'),
  })

  return (
    <Modal
      open={contactId !== null}
      onOpenChange={(open) => { if (!open) { setReply(''); onClose() } }}
      title="Demande de contact"
      size="lg"
    >
      {isLoading || !contact ? (
        <div className="space-y-3">
          <div className="h-5 w-1/3 animate-pulse rounded bg-surface-cream" />
          <div className="h-24 animate-pulse rounded bg-surface-cream" />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium text-text-ink">{contact.name}</p>
              <a href={`mailto:${contact.email}`} className="text-sm text-brand-green hover:underline">
                {contact.email}
              </a>
              <p className="mt-1 text-xs text-text-subtle">
                {SUBJECT_LABEL[contact.subject] ?? contact.subject} · {formatDate(contact.created_at)}
              </p>
            </div>
            <Badge variant={STATUS_CONFIG[contact.status].variant} dot>
              {STATUS_CONFIG[contact.status].label}
            </Badge>
          </div>

          <div className="rounded-xl border border-border bg-surface-cream/50 p-4">
            <p className="whitespace-pre-line text-sm text-text-body">{contact.message}</p>
          </div>

          {contact.admin_reply && (
            <div className="rounded-xl border border-brand-green/20 bg-brand-green-lt p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-green">
                Réponse envoyée{contact.handled_by ? ` par ${contact.handled_by.first_name ?? contact.handled_by.email}` : ''}
              </p>
              <p className="whitespace-pre-line text-sm text-text-body">{contact.admin_reply}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <span className="text-xs font-medium uppercase tracking-wide text-text-subtle">Statut :</span>
            {contact.status !== 'in_progress' && contact.status !== 'resolved' && (
              <Button size="sm" variant="outline" isLoading={statusMutation.isPending} onClick={() => statusMutation.mutate('in_progress')}>
                Marquer en cours
              </Button>
            )}
            {contact.status !== 'resolved' && (
              <Button size="sm" variant="outline" isLoading={statusMutation.isPending} onClick={() => statusMutation.mutate('resolved')}>
                Marquer résolu
              </Button>
            )}
            {contact.status !== 'archived' && (
              <Button size="sm" variant="ghost" leftIcon={Archive} isLoading={statusMutation.isPending} onClick={() => statusMutation.mutate('archived')}>
                Archiver
              </Button>
            )}
            {contact.status === 'archived' && (
              <Button size="sm" variant="ghost" leftIcon={RotateCcw} isLoading={statusMutation.isPending} onClick={() => statusMutation.mutate('new')}>
                Désarchiver
              </Button>
            )}
          </div>

          <div className="border-t border-border pt-4">
            <div className="mb-2 flex items-center gap-2">
              <Mail className="h-4 w-4 text-brand-green" />
              <h3 className="font-serif text-lg text-text-ink">Répondre par email</h3>
            </div>
            <Textarea
              placeholder="Écrivez votre réponse… Elle sera envoyée à l'adresse de l'expéditeur."
              rows={5}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              maxLength={5000}
              showCount
            />
            <div className="mt-3 flex justify-end">
              <Button
                rightIcon={Send}
                isLoading={replyMutation.isPending}
                disabled={reply.trim().length < 10}
                onClick={() => replyMutation.mutate(reply.trim())}
              >
                Envoyer la réponse
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
