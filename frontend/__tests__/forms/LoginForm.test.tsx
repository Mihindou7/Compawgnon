import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LoginForm } from '@/components/auth/LoginForm'
import { ApiError } from '@/lib/api/client'

type AuthStoreMock = {
  hydrate: () => void
}

// ---------------------------------------------------------------------------
// Variables hoistées — accessibles dans les factories vi.mock
// ---------------------------------------------------------------------------

const {
  mockPush,
  mockLogin,
  mockSetTokens,
  mockHydrate,
  mockToastError,
  searchParamsRef,
} = vi.hoisted(() => ({
  mockPush:        vi.fn(),
  mockLogin:       vi.fn(),
  mockSetTokens:   vi.fn(),
  mockHydrate:     vi.fn(),
  mockToastError:  vi.fn(),
  // Objet mutable pour changer les params entre les tests
  searchParamsRef: { current: new URLSearchParams() } as { current: URLSearchParams },
}))

vi.mock('next/navigation', () => ({
  useRouter:       () => ({ push: mockPush, prefetch: vi.fn() }),
  useSearchParams: () => searchParamsRef.current,
  usePathname:     () => '/connexion',
}))

vi.mock('sonner', () => ({
  toast: { error: mockToastError, success: vi.fn() },
}))

vi.mock('@/lib/api/auth.api', () => ({
  authApi: { login: mockLogin },
}))

vi.mock('@/lib/utils/tokens', () => ({
  setTokens:       mockSetTokens,
  getAccessToken:  vi.fn().mockReturnValue(null),
  getRefreshToken: vi.fn().mockReturnValue(null),
  clearTokens:     vi.fn(),
}))

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: <T,>(selector: (s: AuthStoreMock) => T) => selector({ hydrate: mockHydrate }),
}))

// GoogleLoginButton retourne null si NEXT_PUBLIC_GOOGLE_CLIENT_ID est absent,
// mais l'import de @react-oauth/google peut planter en jsdom → on le mock
vi.mock('@/components/auth/GoogleLoginButton', () => ({
  GoogleLoginButton: () => null,
}))

beforeEach(() => {
  vi.clearAllMocks()
  searchParamsRef.current = new URLSearchParams()
  mockLogin.mockResolvedValue({ token: 'access-tok', refresh_token: 'refresh-tok' })
})

function setup() {
  const user = userEvent.setup()
  render(<LoginForm />)
  return { user }
}

// =============================================================================
// Validation côté client
// =============================================================================

describe('LoginForm — validation', () => {
  it('affiche les erreurs email et mot de passe si soumis vide', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /se connecter/i }))
    expect(await screen.findByText('Email requis')).toBeInTheDocument()
    expect(await screen.findByText('Mot de passe requis')).toBeInTheDocument()
  })

  it('affiche "Email invalide" pour un email mal formé', async () => {
    const { user } = setup()
    await user.type(screen.getByLabelText('Adresse email'), 'pasunemail')
    await user.type(screen.getByLabelText('Mot de passe'), 'secret')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))
    expect(await screen.findByText('Email invalide')).toBeInTheDocument()
  })
})

// =============================================================================
// Flux connexion réussie
// =============================================================================

describe('LoginForm — connexion réussie', () => {
  it('appelle authApi.login avec email et password', async () => {
    const { user } = setup()
    await user.type(screen.getByLabelText('Adresse email'), 'user@test.com')
    await user.type(screen.getByLabelText('Mot de passe'), 'motdepasse')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))
    await waitFor(() =>
      expect(mockLogin).toHaveBeenCalledWith({
        email:    'user@test.com',
        password: 'motdepasse',
      }),
    )
  })

  it('appelle setTokens avec les tokens reçus', async () => {
    const { user } = setup()
    await user.type(screen.getByLabelText('Adresse email'), 'user@test.com')
    await user.type(screen.getByLabelText('Mot de passe'), 'motdepasse')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))
    await waitFor(() =>
      expect(mockSetTokens).toHaveBeenCalledWith('access-tok', 'refresh-tok'),
    )
  })

  it('appelle hydrate() pour mettre à jour le store', async () => {
    const { user } = setup()
    await user.type(screen.getByLabelText('Adresse email'), 'user@test.com')
    await user.type(screen.getByLabelText('Mot de passe'), 'motdepasse')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))
    await waitFor(() => expect(mockHydrate).toHaveBeenCalled())
  })

  it('redirige vers / par défaut (pas de paramètre redirect)', async () => {
    const { user } = setup()
    await user.type(screen.getByLabelText('Adresse email'), 'user@test.com')
    await user.type(screen.getByLabelText('Mot de passe'), 'motdepasse')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'))
  })

  it('redirige vers le paramètre redirect si présent dans l\'URL', async () => {
    searchParamsRef.current = new URLSearchParams('redirect=/tableau-de-bord')
    const { user } = setup()
    await user.type(screen.getByLabelText('Adresse email'), 'user@test.com')
    await user.type(screen.getByLabelText('Mot de passe'), 'motdepasse')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/tableau-de-bord'),
    )
  })
})

// =============================================================================
// Gestion des erreurs API
// =============================================================================

describe('LoginForm — erreurs API', () => {
  it('affiche "Email ou mot de passe incorrect" sur une erreur 401', async () => {
    mockLogin.mockRejectedValue(new ApiError(401, 'Unauthorized'))
    const { user } = setup()
    await user.type(screen.getByLabelText('Adresse email'), 'user@test.com')
    await user.type(screen.getByLabelText('Mot de passe'), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))
    expect(
      await screen.findByText('Email ou mot de passe incorrect'),
    ).toBeInTheDocument()
  })

  it('affiche un toast d\'erreur sur une erreur 403 (compte désactivé)', async () => {
    mockLogin.mockRejectedValue(new ApiError(403, 'Disabled'))
    const { user } = setup()
    await user.type(screen.getByLabelText('Adresse email'), 'user@test.com')
    await user.type(screen.getByLabelText('Mot de passe'), 'motdepasse')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        'Votre compte a été désactivé. Contactez le support.',
      ),
    )
  })

  it('affiche un toast d\'erreur générique sur une erreur serveur', async () => {
    mockLogin.mockRejectedValue(new ApiError(500, 'Erreur serveur'))
    const { user } = setup()
    await user.type(screen.getByLabelText('Adresse email'), 'user@test.com')
    await user.type(screen.getByLabelText('Mot de passe'), 'motdepasse')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        'Une erreur est survenue. Réessayez.',
      ),
    )
  })
})
