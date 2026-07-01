'use client'

import { useGoogleLogin } from '@react-oauth/google'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

import { authApi } from '@/lib/api/auth.api'
import { ApiError } from '@/lib/api/client'
import { setTokens } from '@/lib/utils/tokens'
import { useAuthStore } from '@/stores/auth.store'

interface GoogleLoginButtonProps {
  label?: string
}

export function GoogleLoginButton(props: GoogleLoginButtonProps) {
  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) return null
  return <GoogleLoginButtonInner {...props} />
}

function GoogleLoginButtonInner({ label = 'Continuer avec Google' }: GoogleLoginButtonProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hydrate = useAuthStore((s) => s.hydrate)
  const redirect = searchParams.get('redirect') ?? '/'

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await authApi.googleAuth(tokenResponse.access_token)
        setTokens(res.data.access_token, res.data.refresh_token)
        hydrate()
        router.push(redirect)
      } catch (err) {
        if (err instanceof ApiError && err.status === 403) {
          toast.error('Votre compte a été désactivé.')
        } else {
          toast.error('Connexion Google échouée. Réessayez.')
        }
      }
    },
    onError: () => toast.error('Connexion Google annulée.'),
  })

  return (
    <button
      type="button"
      onClick={() => login()}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-surface-white px-4 py-2.5 text-sm font-medium text-text-ink shadow-sm transition-all hover:bg-surface-cream hover:border-brand-green/30 hover:shadow-md active:scale-[0.98]"
    >
      <GoogleIcon />
      {label}
    </button>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
