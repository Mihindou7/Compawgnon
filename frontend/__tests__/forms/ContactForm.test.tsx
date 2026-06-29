import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ContactForm } from '@/components/contact/ContactForm'
import { ApiError } from '@/lib/api/client'

// ---------------------------------------------------------------------------
// Variables hoistées
// ---------------------------------------------------------------------------

const {
  mockSubmit,
  mockToastSuccess,
  mockToastError,
} = vi.hoisted(() => ({
  mockSubmit:       vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError:   vi.fn(),
}))

vi.mock('@/lib/api/contact.api', () => ({
  contactApi: { submit: mockSubmit },
}))

vi.mock('sonner', () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}))

// Radix UI Select ne fonctionne pas dans jsdom → on remplace par un <select> natif
vi.mock('@/components/ui/Select', () => ({
  Select: ({
    label,
    options,
    onValueChange,
    error,
    placeholder,
  }: {
    label?: string
    options?: Array<{ value: string; label: string }>
    onValueChange?: (value: string) => void
    error?: string
    placeholder?: string
  }) => (
    <label>
      {label}
      <select
        onChange={(e) => onValueChange?.(e.target.value)}
        defaultValue=""
      >
        <option value="" disabled>{placeholder}</option>
        {options?.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p role="alert">{error}</p>}
    </label>
  ),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockSubmit.mockResolvedValue({ data: { id: 1, message: 'ok' } })
})

function setup() {
  const user = userEvent.setup()
  render(<ContactForm />)
  return { user }
}

// Accesseurs pour les champs du formulaire
const getName    = () => screen.getByLabelText('Nom complet')
const getEmail   = () => screen.getByLabelText('Adresse email')
const getSubject = () => screen.getByLabelText('Sujet')
const getMessage = () => screen.getByLabelText('Votre message')
const getSubmit  = () => screen.getByRole('button', { name: /envoyer le message/i })

// Données valides
const VALID = {
  name:    'Jean Dupont',
  email:   'jean@test.com',
  message: 'Bonjour, je souhaite vous contacter pour une question.',
} as const

// =============================================================================
// Validation côté client
// =============================================================================

describe('ContactForm — validation', () => {
  it('affiche les erreurs si le formulaire est soumis vide', async () => {
    const { user } = setup()
    await user.click(getSubmit())
    expect(await screen.findByText('Veuillez indiquer votre nom')).toBeInTheDocument()
    expect(await screen.findByText('Email requis')).toBeInTheDocument()
    expect(await screen.findByText('Veuillez choisir un sujet')).toBeInTheDocument()
    expect(
      await screen.findByText('Votre message doit faire au moins 20 caractères'),
    ).toBeInTheDocument()
  })

  it('affiche une erreur si le message est trop court', async () => {
    const { user } = setup()
    await user.type(getName(), VALID.name)
    await user.type(getEmail(), VALID.email)
    await userEvent.selectOptions(getSubject(), 'general')
    await user.type(getMessage(), 'Trop court')   // < 20 chars
    await user.click(getSubmit())
    expect(
      await screen.findByText('Votre message doit faire au moins 20 caractères'),
    ).toBeInTheDocument()
  })
})

// =============================================================================
// Flux envoi réussi
// =============================================================================

describe('ContactForm — soumission réussie', () => {
  async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
    await user.type(getName(), VALID.name)
    await user.type(getEmail(), VALID.email)
    await userEvent.selectOptions(getSubject(), 'general')
    await user.type(getMessage(), VALID.message)
    await user.click(getSubmit())
  }

  it('appelle contactApi.submit avec les données du formulaire', async () => {
    const { user } = setup()
    await fillAndSubmit(user)
    await waitFor(() =>
      expect(mockSubmit).toHaveBeenCalledWith({
        name:    VALID.name,
        email:   VALID.email,
        subject: 'general',
        message: VALID.message,
      }),
    )
  })

  it('affiche un toast de succès après envoi', async () => {
    const { user } = setup()
    await fillAndSubmit(user)
    await waitFor(() =>
      expect(mockToastSuccess).toHaveBeenCalledWith(
        'Message envoyé !',
        expect.objectContaining({ description: expect.any(String) }),
      ),
    )
  })

  it('affiche l\'écran de confirmation après envoi', async () => {
    const { user } = setup()
    await fillAndSubmit(user)
    expect(
      await screen.findByText('Merci pour votre message !'),
    ).toBeInTheDocument()
    // Le formulaire disparaît
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: /envoyer le message/i }),
      ).not.toBeInTheDocument()
    })
  })

  it('le bouton "Envoyer un autre message" reaffiche le formulaire', async () => {
    const { user } = setup()
    await fillAndSubmit(user)
    await screen.findByText('Merci pour votre message !')
    await user.click(screen.getByRole('button', { name: /envoyer un autre message/i }))
    expect(getSubmit()).toBeInTheDocument()
  })
})

// =============================================================================
// Gestion des erreurs API
// =============================================================================

describe('ContactForm — erreurs API', () => {
  it('affiche un toast d\'erreur si l\'API échoue', async () => {
    mockSubmit.mockRejectedValue(new ApiError(500, 'Erreur serveur'))
    const { user } = setup()
    await user.type(getName(), VALID.name)
    await user.type(getEmail(), VALID.email)
    await userEvent.selectOptions(getSubject(), 'general')
    await user.type(getMessage(), VALID.message)
    await user.click(getSubmit())
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith('Erreur serveur'),
    )
  })

  it('n\'affiche pas la confirmation si l\'API échoue', async () => {
    mockSubmit.mockRejectedValue(new ApiError(500, 'Erreur'))
    const { user } = setup()
    await user.type(getName(), VALID.name)
    await user.type(getEmail(), VALID.email)
    await userEvent.selectOptions(getSubject(), 'general')
    await user.type(getMessage(), VALID.message)
    await user.click(getSubmit())
    await waitFor(() => expect(mockToastError).toHaveBeenCalled())
    expect(screen.queryByText('Merci pour votre message !')).not.toBeInTheDocument()
  })
})
