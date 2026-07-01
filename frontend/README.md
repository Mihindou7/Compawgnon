# Compawgnon — Frontend

> Interface web de la plateforme d'achat et d'adoption d'animaux de compagnie  
> **Next.js 16 · React 19 · TypeScript · Tailwind CSS 4**

---

## Sommaire

- [Stack technique](#stack-technique)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Variables d'environnement](#variables-denvironnement)
- [Scripts](#scripts)
- [Architecture](#architecture)
- [Pages principales](#pages-principales)
- [Authentification](#authentification)
- [Client API](#client-api)
- [Conventions](#conventions)

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4 |
| Composants | Radix UI, Lucide React |
| Données | TanStack Query v5 |
| État global | Zustand |
| Formulaires | React Hook Form + Zod |
| Animations | Framer Motion |
| Notifications | Sonner |
| Polices | Crimson Pro (titres), DM Sans (corps) |

---

## Prérequis

- Node.js ≥ 20
- npm (ou pnpm / yarn)
- Backend API Compawgnon en cours d'exécution (voir [`../backend/README.md`](../backend/README.md))

---

## Installation

```bash
cd frontend
npm install
cp .env.local.example .env.local   # si le fichier exemple existe, sinon créer .env.local
npm run dev
```

L'application est disponible sur **http://localhost:3000**.

> En développement avec Docker, l'API est souvent exposée sur `http://localhost` (port 80) ou `http://localhost:8000` selon la configuration du backend. Adaptez `NEXT_PUBLIC_API_URL` en conséquence.

---

## Variables d'environnement

Créer un fichier `.env.local` à la racine du dossier `frontend` :

```env
# URL de l'API Symfony (obligatoire)
NEXT_PUBLIC_API_URL=http://localhost

# Optionnel — URL publique du frontend (liens, OAuth, etc.)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

| Variable | Description | Défaut |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL de l'API backend | `http://localhost:8000` dans `client.ts`, `http://localhost` dans `resolveUploadUrl` |
| `NEXT_PUBLIC_APP_URL` | URL du frontend | `http://localhost:3000` |

---

## Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement (Turbopack) |
| `npm run build` | Build de production |
| `npm run start` | Serveur de production |
| `npm run lint` | ESLint |

---

## Architecture

```
frontend/
├── app/                    # App Router (routes par groupes)
│   ├── page.tsx            # Accueil
│   ├── (public)/           # Pages publiques (navbar + footer)
│   ├── (auth)/             # Espace compte utilisateur
│   ├── (seller)/           # Espace vendeur
│   └── (admin)/            # Back-office admin
├── components/
│   ├── animal/             # Cartes, filtres, grille catalogue
│   ├── auth/               # Formulaires connexion, inscription, reset
│   ├── contact/            # Formulaire de contact
│   ├── home/               # Hero, stats, showcase (page d'accueil)
│   ├── layout/             # Navbar, Footer, Sidebar
│   ├── legal/              # Coquille pages CGU / confidentialité
│   └── ui/                 # Design system (Button, Input, Modal…)
├── hooks/                  # useAuth, useAnimalFilters, useFavorites…
├── lib/
│   ├── api/                # Clients REST par domaine
│   ├── schemas/            # Schémas Zod (validation formulaires)
│   ├── types/              # Types TypeScript partagés
│   └── utils/              # Helpers (tokens, formatters, urls)
├── stores/                 # Zustand (auth, ui)
└── proxy.ts                # Protection des routes par rôle (Next.js proxy)
```

Les **route groups** `(public)`, `(auth)`, `(seller)` et `(admin)` permettent des layouts distincts sans impacter l'URL.

---

## Pages principales

### Public

| Route | Description |
|---|---|
| `/` | Accueil (hero animé, stats, espèces, annonces récentes) |
| `/animaux` | Catalogue avec filtres, recherche texte et pagination |
| `/animaux/[id]` | Fiche détail d'un animal |
| `/especes` | Liste des espèces (filtres rapides, coup de cœur) |
| `/especes/[slug]` | Détail espèce et races |
| `/vendeurs/[id]` | Profil public vendeur |
| `/contact` | Formulaire de contact |
| `/cgu` | Conditions générales d'utilisation |
| `/confidentialite` | Politique de confidentialité |
| `/connexion` | Connexion |
| `/inscription` | Inscription |
| `/mot-de-passe-oublie` | Demande de réinitialisation |
| `/reinitialiser-mot-de-passe` | Nouveau mot de passe (token par email) |
| `/auth/verify-email` | Vérification d'email après inscription |

### Compte utilisateur (`/compte`)

| Route | Description |
|---|---|
| `/compte` | Tableau de bord (stats favoris, réservations, avis) |
| `/compte/profil` | Modifier le profil |
| `/compte/favoris` | Animaux favoris |
| `/compte/reservations` | Mes demandes de réservation |
| `/compte/avis` | Mes avis |
| `/compte/devenir-vendeur` | Candidature vendeur |

### Espace vendeur (`/vendeur`)

Dashboard, gestion des annonces, réservations et profil boutique.

### Administration (`/admin`)

Dashboard, modération annonces/vendeurs/utilisateurs, avis, contacts, espèces, journal d'audit.

---

## Authentification

- **JWT** : access token (1 h) + refresh token (30 j) stockés en **cookies** (`access_token`, `refresh_token`).
- **Hydratation** : au chargement, le store Zustand décode le JWT pour peupler l'utilisateur (`stores/auth.store.ts`).
- **Refresh automatique** : `lib/api/client.ts` intercepte les réponses 401, tente un refresh via `POST /api/auth/token/refresh`, puis rejoue la requête.
- **Protection des routes** : `proxy.ts` redirige vers `/connexion` si le cookie est absent, expiré ou si le rôle est insuffisant.

| Préfixe route | Rôle requis |
|---|---|
| `/compte/*` | `ROLE_USER` |
| `/vendeur/*` | `ROLE_SELLER` |
| `/admin/*` | `ROLE_ADMIN` |

---

## Client API

Tous les appels passent par `lib/api/client.ts` :

```ts
import { api } from '@/lib/api/client'

api.get<T>('/api/animals')
api.post<T>('/api/contact', body)
api.patch<T>('/api/me/profile', body)
api.delete<T>('/api/favorites/1')
api.upload<T>('/api/seller/animals/1/media', formData)
```

Modules par domaine dans `lib/api/` :

| Fichier | Endpoints |
|---|---|
| `auth.api.ts` | Connexion, logout, refresh, verify-email, reset password |
| `animals.api.ts` | Catalogue public (`GET /api/animals`) |
| `species.api.ts` | Espèces et races |
| `favorites.api.ts` | Favoris utilisateur |
| `reservations.api.ts` | Réservations (`/api/me/reservations`) |
| `reviews.api.ts` | Avis (`/api/me/reviews`) |
| `sellers_apply.api.ts` | Candidature vendeur (`/api/me/seller/apply`) |
| `seller_animals.api.ts` | CRUD annonces vendeur |
| `contact.api.ts` | Formulaire de contact public |
| `admin.api.ts` | Back-office admin |
| `users.api.ts` | Profil utilisateur |

Les erreurs API sont typées via `ApiError` (status + message).

---

## Conventions

### Filtres catalogue (`/animaux`)

Les filtres sont synchronisés avec l'URL via `hooks/useAnimalFilters.ts` :

| Paramètre URL | Filtre API |
|---|---|
| `q` | Recherche texte |
| `espece` | `species_id` |
| `race` | `breed_id` |
| `ville` | `city` |
| `prix_min` / `prix_max` | `price_min` / `price_max` |
| `sexe` | `sex` |
| `vendeur` | `seller_type` |
| `tri` | `sort` |
| `page` | Pagination |

### Images uploadées

Les chemins relatifs du backend (`/uploads/...`) sont résolus avec `resolveUploadUrl()` (`lib/utils/urls.ts`) pour construire l'URL complète vers l'API.

### Validation formulaires

Schémas Zod dans `lib/schemas/`, branchés sur React Hook Form via `@hookform/resolvers/zod`.

### Animations

Framer Motion sur les pages d'accueil, espèces et catalogue. Les animations respectent `prefers-reduced-motion` via `useReducedMotion()`.

### Styles

- Variables CSS et tokens dans `app/globals.css`
- Utilitaires : `cn()` (`lib/utils/cn.ts`) pour fusionner les classes Tailwind
- Composants UI réutilisables dans `components/ui/`

---

## Liens utiles

- [Backend API — README](../backend/README.md)
- [Documentation Next.js](https://nextjs.org/docs)
- [TanStack Query](https://tanstack.com/query/latest)
