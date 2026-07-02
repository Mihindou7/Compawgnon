import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RegisterForm } from '@/components/auth/RegisterForm'
import { ApiError } from '@/lib/api/client'

// ---------------------------------------------------------------------------
// Variables hoistées
// ---------------------------------------------------------------------------

const {
  mockPush,
  mockRegister,
  mockToastSuccess,
  mockToastError,
} = vi.hoisted(() => ({
  mockPush:         vi.fn(),
  mockRegister:     vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError:   vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter:   () => ({ push: mockPush, prefetch: vi.fn() }),
  usePathname: () => '/inscription',
}))

vi.mock('sonner', () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}))

vi.mock('@/lib/api/auth.api', () => ({
  authApi: { register: mockRegister },
}))

vi.mock('@/components/auth/GoogleLoginButton', () => ({
  GoogleLoginButton: () => null,
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockRegister.mockResolvedValue({ data: { message: 'Compte créé' } })
})

function setup() {
  const user = userEvent.setup()
  render(<RegisterForm />)
  return { user }
}

// Helpers pour trouver les champs récurrents
const getEmail    = () => screen.getByLabelText('Adresse email')
const getPassword = () => screen.getByLabelText('Mot de passe')
const getTerms    = () => screen.getByRole('checkbox')
const getSubmit   = () => screen.getByRole('button', { name: /créer mon compte/i })

// Données valides pour un submit réussi
const VALID_EMAIL    = 'nouveau@test.com'
const VALID_PASSWORD = 'Password1'

// =============================================================================
// Validation côté client
// =============================================================================

describe('RegisterForm — validation', () => {
  it('affiche une erreur si l\'email est invalide', async () => {
    const { user } = setup()
    await user.type(getEmail(), 'pas-un-email')
    await user.type(getPassword(), VALID_PASSWORD)
    await user.click(getTerms())
    await user.click(getSubmit())
    expect(await screen.findByText('Email invalide')).toBeInTheDocument()
  })

  it('affiche une erreur si le mot de passe est trop court', async () => {
    const { user } = setup()
    await user.type(getEmail(), VALID_EMAIL)
    await user.type(getPassword(), 'Ab1')   // < 8 chars
    await user.click(getTerms())
    await user.click(getSubmit())
    expect(await screen.findByText('Minimum 8 caractères')).toBeInTheDocument()
  })

  it('affiche une erreur si le mot de passe n\'a pas de majuscule', async () => {
    const { user } = setup()
    await user.type(getEmail(), VALID_EMAIL)
    await user.type(getPassword(), 'password1')  // pas de majuscule
    await user.click(getTerms())
    await user.click(getSubmit())
    expect(await screen.findByText('Au moins une majuscule')).toBeInTheDocument()
  })

  it('affiche une erreur si le mot de passe n\'a pas de chiffre', async () => {
    const { user } = setup()
    await user.type(getEmail(), VALID_EMAIL)
    await user.type(getPassword(), 'Passwordsans')  // pas de chiffre
    await user.click(getTerms())
    await user.click(getSubmit())
    expect(await screen.findByText('Au moins un chiffre')).toBeInTheDocument()
  })

  it('affiche une erreur si les CGU ne sont pas acceptées', async () => {
    const { user } = setup()
    await user.type(getEmail(), VALID_EMAIL)
    await user.type(getPassword(), VALID_PASSWORD)
    // Ne coche pas la case
    await user.click(getSubmit())
    expect(await screen.findByText('Vous devez accepter les CGU')).toBeInTheDocument()
  })
})

// =============================================================================
// Flux inscription réussie
// =============================================================================

describe('RegisterForm — inscription réussie', () => {
  it('appelle authApi.register avec email, password et termsAccepted=true', async () => {
    const { user } = setup()
    await user.type(getEmail(), VALID_EMAIL)
    await user.type(getPassword(), VALID_PASSWORD)
    await user.click(getTerms())
    await user.click(getSubmit())
    await waitFor(() =>
      expect(mockRegister).toHaveBeenCalledWith(
        expect.objectContaining({
          email:         VALID_EMAIL,
          password:      VALID_PASSWORD,
          termsAccepted: true,
        }),
      ),
    )
  })

  it('affiche un toast de succès après inscription', async () => {
    const { user } = setup()
    await user.type(getEmail(), VALID_EMAIL)
    await user.type(getPassword(), VALID_PASSWORD)
    await user.click(getTerms())
    await user.click(getSubmit())
    await waitFor(() =>
      expect(mockToastSuccess).toHaveBeenCalledWith(
        'Compte créé ! Vous pouvez vous connecter.',
      ),
    )
  })

  it('redirige vers /connexion après inscription réussie', async () => {
    const { user } = setup()
    await user.type(getEmail(), VALID_EMAIL)
    await user.type(getPassword(), VALID_PASSWORD)
    await user.click(getTerms())
    await user.click(getSubmit())
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/connexion'),
    )
  })
})

// =============================================================================
// Gestion des erreurs API
// =============================================================================

describe('RegisterForm — erreurs API', () => {
  it('affiche "email déjà utilisé" pour une erreur 409', async () => {
    mockRegister.mockRejectedValue(new ApiError(409, 'Email already used'))
    const { user } = setup()
    await user.type(getEmail(), VALID_EMAIL)
    await user.type(getPassword(), VALID_PASSWORD)
    await user.click(getTerms())
    await user.click(getSubmit())
    expect(
      await screen.findByText('Cette adresse email est déjà utilisée'),
    ).toBeInTheDocument()
  })

  it('affiche un toast d\'erreur générique pour une erreur 500', async () => {
    mockRegister.mockRejectedValue(new ApiError(500, 'Erreur serveur'))
    const { user } = setup()
    await user.type(getEmail(), VALID_EMAIL)
    await user.type(getPassword(), VALID_PASSWORD)
    await user.click(getTerms())
    await user.click(getSubmit())
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        'Une erreur est survenue. Réessayez.',
      ),
    )
  })
})
