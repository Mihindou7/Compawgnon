'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle, Send, User, Mail } from 'lucide-react'
import * as React from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { contactApi } from '@/lib/api/contact.api'
import { ApiError } from '@/lib/api/client'
import { CONTACT_SUBJECTS, contactSchema, type ContactData } from '@/lib/schemas/contact.schema'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'

export function ContactForm() {
  const [submitted, setSubmitted] = React.useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactData>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', subject: undefined, message: '' },
  })

  async function onSubmit(data: ContactData) {
    try {
      await contactApi.submit(data)
      toast.success('Message envoyé !', { description: 'Nous vous répondrons dans les plus brefs délais.' })
      reset()
      setSubmitted(true)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "L'envoi a échoué. Veuillez réessayer."
      toast.error(message)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center animate-slide-up">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-green-lt">
          <CheckCircle className="h-8 w-8 text-brand-green" />
        </div>
        <div>
          <p className="font-medium text-text-ink">Merci pour votre message !</p>
          <p className="mt-1 text-sm text-text-subtle">
            Notre équipe vous recontactera par email sous 48 heures ouvrées.
          </p>
        </div>
        <Button variant="outline" onClick={() => setSubmitted(false)}>
          Envoyer un autre message
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          label="Nom complet"
          leftIcon={User}
          placeholder="Jean Dupont"
          autoComplete="name"
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="Adresse email"
          type="email"
          leftIcon={Mail}
          placeholder="vous@exemple.fr"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
      </div>

      <Controller
        control={control}
        name="subject"
        render={({ field }) => (
          <Select
            label="Sujet"
            placeholder="Choisissez un sujet"
            options={CONTACT_SUBJECTS.map((s) => ({ value: s.value, label: s.label }))}
            value={field.value}
            onValueChange={field.onChange}
            error={errors.subject?.message}
          />
        )}
      />

      <Textarea
        label="Votre message"
        placeholder="Décrivez votre demande en quelques mots…"
        rows={6}
        showCount
        maxLength={2000}
        error={errors.message?.message}
        {...register('message')}
      />

      <Button type="submit" size="lg" className="w-full sm:w-auto" rightIcon={Send} isLoading={isSubmitting}>
        Envoyer le message
      </Button>
    </form>
  )
}
