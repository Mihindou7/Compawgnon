import { jwtDecode } from 'jwt-decode'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import type { JwtPayload } from '@/lib/types/auth.types'

const ROLE_ROUTES: Record<string, string> = {
  '/compte':  'ROLE_USER',
  '/vendeur': 'ROLE_SELLER',
  '/admin':   'ROLE_ADMIN',
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('access_token')?.value
  const refreshToken = request.cookies.get('refresh_token')?.value

  const requiredRole = Object.entries(ROLE_ROUTES).find(([path]) => pathname.startsWith(path))?.[1]
  if (!requiredRole) return NextResponse.next()

  if (!token) {
    // Access token absent mais refresh token présent : on laisse passer,
    // le client rafraîchira la session au premier appel API.
    if (refreshToken) return NextResponse.next()
    return NextResponse.redirect(new URL(`/connexion?redirect=${encodeURIComponent(pathname)}`, request.url))
  }

  try {
    const decoded = jwtDecode<JwtPayload>(token)
    const expired = decoded.exp * 1000 < Date.now()

    // Access token expiré : on ne déconnecte que s'il n'y a aucun refresh token.
    // Sinon on laisse passer et le client se charge du refresh (le payload reste
    // décodable même expiré, donc le contrôle de rôle/statut ci-dessous tient).
    if (expired && !refreshToken) {
      return NextResponse.redirect(new URL('/connexion?error=session_expired', request.url))
    }

    if (decoded.status === 'disabled') {
      return NextResponse.redirect(new URL('/connexion?error=disabled', request.url))
    }

    if (!decoded.roles.includes(requiredRole)) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  } catch {
    if (refreshToken) return NextResponse.next()
    return NextResponse.redirect(new URL('/connexion', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/compte/:path*', '/vendeur/:path*', '/admin/:path*'],
}
