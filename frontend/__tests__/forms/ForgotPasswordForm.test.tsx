import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

// ---------------------------------------------------------------------------
// Variables hoistées
// ---------------------------------------------------------------------------

const { mockForgotPassword } = vi.hoisted(() => ({
  mockForgotPassword: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter:   () => ({ push: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/mot-de-passe-oublie',
}))

vi.mock('@/lib/api/auth.api', () => ({
  authApi: { forgotPassword: mockForgotPassword },
}))

// ForgotPasswordForm n'utilise pas sonner, mais on le mock par précaution
// (next/link peut en avoir besoin indirectement)
vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockForgotPassword.mockResolvedValue({ data: { message: 'ok' } })
})

function setup() {
  const user = userEvent.setup()
  render(<ForgotPasswordForm />)
  return { user }
}

const getEmailInput = () => screen.getByLabelText('Adresse email')
const getSubmit     = () => screen.getByRole('button', { name: /envoyer le lien/i })

// =============================================================================
// Validation côté client
// =============================================================================

describe('ForgotPasswordForm — validation', () => {
  it('affiche "Email requis" si le champ est vide', async () => {
    const { user } = setup()
    await user.click(getSubmit())
    expect(await screen.findByText('Email requis')).toBeInTheDocument()
  })

  it('affiche "Email invalide" pour un email mal formé', async () => {
    const { user } = setup()
    await user.type(getEmailInput(), 'pasunemail')
    await user.click(getSubmit())
    expect(await screen.findByText('Email invalide')).toBeInTheDocument()
  })
})

// =============================================================================
// Flux réinitialisation
// =============================================================================

describe('ForgotPasswordForm — soumission', () => {
  it('appelle authApi.forgotPassword avec l\'email saisi', async () => {
    const { user } = setup()
    await user.type(getEmailInput(), 'user@test.com')
    await user.click(getSubmit())
    await waitFor(() =>
      expect(mockForgotPassword).toHaveBeenCalledWith('user@test.com'),
    )
  })

  it('affiche la confirmation après soumission réussie', async () => {
    const { user } = setup()
    await user.type(getEmailInput(), 'user@test.com')
    await user.click(getSubmit())
    expect(await screen.findByText('Email envoyé !')).toBeInTheDocument()
    expect(
      screen.getByText(/si un compte correspond à cette adresse/i),
    ).toBeInTheDocument()
  })

  it('affiche la confirmation même si l\'API échoue (sécurité anti-énumération)', async () => {
    mockForgotPassword.mockRejectedValue(new Error('réseau'))
    const { user } = setup()
    await user.type(getEmailInput(), 'user@test.com')
    await user.click(getSubmit())
    // Le formulaire affiche toujours la confirmation, quelle que soit la réponse API
    expect(await screen.findByText('Email envoyé !')).toBeInTheDocument()
  })

  it('masque le formulaire et affiche l\'écran de confirmation', async () => {
    const { user } = setup()
    await user.type(getEmailInput(), 'user@test.com')
    await user.click(getSubmit())
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /envoyer le lien/i })).not.toBeInTheDocument()
    })
    expect(screen.getByText('Email envoyé !')).toBeInTheDocument()
  })
})
