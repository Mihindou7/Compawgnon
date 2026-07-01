# 🐾 Compawgnon — Backend API

> Plateforme web d'achat et d'adoption d'animaux de compagnie  
> **Symfony 7.4 · PHP 8.4 · MySQL 8.4 · FrankenPHP · JWT**

---

## Sommaire

- [Stack technique](#stack-technique)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Variables d'environnement](#variables-denvironnement)
- [Commandes Make](#commandes-make)
- [Architecture](#architecture)
- [Authentification](#authentification)
- [Rôles et permissions](#rôles-et-permissions)
- [Routes API](#routes-api)
- [Emails](#emails)
- [Uploads](#uploads)

---

## Stack technique

| Couche | Technologie |
|---|---|
| Langage | PHP 8.4 |
| Framework | Symfony 7.4 |
| Serveur | FrankenPHP (Caddy intégré) |
| Base de données | MySQL 8.4 |
| ORM | Doctrine ORM 3 |
| Authentification | LexikJWT v3 + GesdinetRefreshToken v2 |
| Emails (dev) | Mailpit |
| Templates email | Twig |
| Conteneurisation | Docker + Docker Compose v2 |

---

## Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) ≥ 4.x
- `make` (inclus sur macOS/Linux)

---

## Installation

```bash
# 1. Cloner le projet
git clone <repo> compawgnon-backend
cd compawgnon-backend

# 2. Démarrer les conteneurs (build automatique)
make up

# 3. Générer les clés JWT (première fois uniquement)
make jwt-keys

# 4. Appliquer les migrations
make migrate

# 5. Charger les données de démo (optionnel)
make fixtures
```

L'API est disponible sur **`https://localhost`** dès que les conteneurs sont démarrés.

> **Note SSL :** FrankenPHP génère un certificat auto-signé pour `localhost`.  
> Dans Postman, désactiver la vérification SSL : *Settings → General → SSL certificate verification → OFF*

---

## Données de démo

Après `make fixtures`, les comptes suivants sont disponibles :

| Email | Mot de passe | Rôle |
|---|---|---|
| `admin@compawgnon.fr` | `Admin1234!` | ROLE_ADMIN |
| `elevage@compawgnon.fr` | `Seller1234!` | ROLE_SELLER — Éleveur approuvé |
| `animalerie@compawgnon.fr` | `Seller1234!` | ROLE_SELLER — Animalerie approuvée |
| `vendeur-pending@compawgnon.fr` | `Seller1234!` | Vendeur en attente de validation |
| `marie@example.com` | `User1234!` | ROLE_USER — Acheteur |
| `thomas@example.com` | `User1234!` | ROLE_USER — Acheteur |
| `camille@example.com` | `User1234!` | ROLE_USER — Acheteur |

**Contenu chargé :** 8 espèces · 17 races · 20 animaux · 7 réservations · 3 avis

Pour **remettre la base à zéro** complètement (drop + migrate + fixtures) :

```bash
make db-reset
```

---

## Variables d'environnement

Le fichier `.env` contient toutes les valeurs par défaut pour le développement.  
Pour des overrides locaux, créer un `.env.local` (ignoré par git).

| Variable | Défaut | Description |
|---|---|---|
| `DATABASE_URL` | `mysql://compawgnon:secret@database:3306/compawgnon` | Connexion MySQL |
| `JWT_PASSPHRASE` | `compawgnon_jwt_passphrase` | Passphrase clés JWT |
| `JWT_TTL` | `3600` | Durée access token (secondes) |
| `JWT_REFRESH_TOKEN_TTL` | `2592000` | Durée refresh token (30 jours) |
| `MAILER_DSN` | `smtp://mailer:1025` | Transport email (Mailpit en dev) |
| `MAILER_FROM_ADDRESS` | `noreply@compawgnon.fr` | Expéditeur des emails |
| `FRONTEND_URL` | `http://localhost:3000` | URL frontend (liens dans les emails) |
| `CORS_ALLOW_ORIGIN` | `^https?://(localhost\|127\.0\.0\.1)(:[0-9]+)?$` | Origines autorisées |

---

## Commandes Make

```bash
# ─── Docker ─────────────────────────────
make up              # Démarrer tous les conteneurs
make down            # Arrêter tous les conteneurs
make restart         # Restart le conteneur PHP
make build           # Rebuild l'image PHP (après changement Dockerfile)
make logs            # Logs live de tous les conteneurs
make logs-php        # Logs live PHP uniquement
make ps              # Statut des conteneurs

# ─── Symfony ────────────────────────────
make cc              # Vider le cache
make routes          # Lister toutes les routes
make routes-api      # Lister uniquement les routes /api

# ─── Base de données ────────────────────
make migrate         # Appliquer les migrations en attente
make migrate-diff    # Générer une migration depuis les entités
make migrate-prev    # Annuler la dernière migration
make migrate-status  # Statut des migrations
make schema-validate # Valider le mapping Doctrine

# ─── Dev ────────────────────────────────
make shell           # Shell dans le conteneur PHP
make db-shell        # Shell MySQL (root)
make jwt-keys        # Régénérer les clés JWT
make fixtures        # Charger les données de démo (⚠ vide la base)
make fixtures-append # Charger les fixtures sans vider la base
make db-reset        # Reset complet : drop + migrate + fixtures
make lint            # Vérifier le container Symfony
make test            # Lancer les tests PHPUnit
```

---

## Architecture

```
src/
├── Controller/
│   ├── AbstractApiController.php   ← helpers JSON (success, error, noContent…)
│   ├── Auth/
│   │   └── AuthController.php      ← register, login, verify-email, logout…
│   ├── User/
│   │   ├── UserController.php      ← GET/PATCH/DELETE /api/me
│   │   ├── SellerUserController.php← /api/me/seller
│   │   ├── FavoriteController.php  ← /api/me/favorites
│   │   ├── ReservationController.php← /api/me/reservations
│   │   └── ReviewController.php   ← /api/me/reviews
│   ├── Public/
│   │   ├── SpeciesController.php   ← /api/species
│   │   ├── BreedController.php     ← /api/breeds
│   │   ├── AnimalPublicController.php← /api/animals
│   │   └── SellerPublicController.php← /api/sellers/{id}
│   ├── Seller/
│   │   ├── AnimalSellerController.php← /api/seller/animals
│   │   ├── ReservationSellerController.php
│   │   └── DashboardSellerController.php
│   └── Admin/
│       ├── DashboardAdminController.php
│       ├── UserAdminController.php
│       ├── SellerAdminController.php
│       ├── AnimalAdminController.php
│       ├── ReviewAdminController.php
│       └── AuditLogAdminController.php
│
├── Entity/              ← 13 entités Doctrine
├── Repository/          ← Requêtes Doctrine
├── Service/
│   ├── AuthService.php  ← inscription, vérification email, reset mot de passe
│   ├── MailService.php  ← envoi de tous les emails transactionnels
│   ├── PaginationService.php ← pagination générique QueryBuilder
│   ├── UploadService.php← upload avatars, médias, documents
│   └── AuditService.php ← journal des actions admin
├── DTO/                 ← objets de validation des requêtes
├── Validator/           ← contraintes custom (UniqueEmail)
└── EventListener/
    ├── JWTCreatedListener.php      ← ajoute id, status, seller_id au JWT
    ├── AccountDisabledListener.php ← bloque les tokens si compte désactivé
    └── ApiExceptionListener.php    ← toutes les erreurs /api → JSON
```

---

## Authentification

L'API utilise deux tokens JWT :

| Token | TTL | Usage |
|---|---|---|
| `token` (access token) | 1 heure | Authentifier chaque requête (`Authorization: Bearer <token>`) |
| `refresh_token` | 30 jours | Obtenir un nouvel access token sans reconnexion |

### Flux complet

```
POST /api/auth/register
  → 201 + email de vérification envoyé

GET /api/auth/verify-email?token=xxx
  → 200 + { access_token } (JWT actif)

POST /api/auth/login
  → 200 + { token, refresh_token }

// Requête authentifiée
GET /api/me
  Authorization: Bearer <token>
  → 200 + profil utilisateur

// Renouveler le token
POST /api/auth/token/refresh
  { "refresh_token": "xxx" }
  → 200 + { token, refresh_token }

// Déconnexion
POST /api/auth/logout
  Authorization: Bearer <token>
  { "refresh_token": "xxx" }
  → 204 (refresh token invalidé en base)
```

### Contenu du JWT

```json
{
  "iat": 1234567890,
  "exp": 1234571490,
  "roles": ["ROLE_USER"],
  "username": "user@example.com",
  "id": 1,
  "status": "active",
  "seller_id": 3,          // présent si l'user a un profil vendeur
  "seller_status": "approved"
}
```

---

## Rôles et permissions

| Rôle | Héritage | Description |
|---|---|---|
| `ROLE_USER` | — | Utilisateur connecté (défaut à l'inscription) |
| `ROLE_SELLER` | `ROLE_USER` | Vendeur dont le profil a été approuvé par l'admin |
| `ROLE_ADMIN` | `ROLE_USER` + `ROLE_SELLER` | Administrateur |

> `ROLE_SELLER` est accordé par l'admin via `PATCH /api/admin/sellers/{id}/approve`.  
> Le rôle est actif au prochain login ou refresh token.

### Statuts réservation

```
PENDING → CANCELLED (acheteur)
PENDING → ACCEPTED  (vendeur) → COMPLETED (vendeur)
PENDING → REJECTED  (vendeur)
```

### Statuts annonce

```
DRAFT → PENDING_REVIEW → PUBLISHED → RESERVED → SOLD
                      ↘ DRAFT (rejeté par admin)
                                   ↘ ARCHIVED
```

---

## Routes API

La documentation complète des 62 routes est dans [API_ROUTES.md](./API_ROUTES.md).

### Résumé par module

| Module | Routes | Accès |
|---|---|---|
| Auth | 8 | public / ROLE_USER |
| Profil `/api/me` | 11 | ROLE_USER |
| Catalogue `/api/species`, `/api/breeds`, `/api/animals`, `/api/sellers` | 7 | public |
| Vendeur `/api/seller` | 15 | ROLE_SELLER |
| Admin `/api/admin` | 16 | ROLE_ADMIN |

### Format des réponses

**Succès :**
```json
{ "data": { ... } }
```

**Succès paginé :**
```json
{
  "data": [ ... ],
  "meta": {
    "page": 1, "limit": 20, "total": 87,
    "total_pages": 5, "has_next": true, "has_prev": false
  }
}
```

**Erreur :**
```json
{ "error": "Message d'erreur" }
```

**Erreur de validation (422) :**
```json
{
  "error": "Validation failed",
  "violations": {
    "email": ["This email address is already in use."],
    "password": ["Password must be at least 8 characters."]
  }
}
```

---

## Emails

En développement, tous les emails sont interceptés par **Mailpit** — rien n'est envoyé réellement.

**Interface Mailpit :** `http://localhost:8025`

| Email | Déclencheur |
|---|---|
| Vérification email | `POST /api/auth/register` |
| Réinitialisation mot de passe | `POST /api/auth/forgot-password` |
| Réservation créée (vendeur) | `POST /api/me/reservations` |
| Réservation acceptée (acheteur) | `PATCH /api/seller/reservations/{id}/accept` |
| Réservation refusée (acheteur) | `PATCH /api/seller/reservations/{id}/reject` |
| Réservation annulée (vendeur) | `PATCH /api/me/reservations/{id}/cancel` |
| Vente finalisée (acheteur) | `PATCH /api/seller/reservations/{id}/complete` |
| Vendeur approuvé | `PATCH /api/admin/sellers/{id}/approve` |
| Vendeur rejeté | `PATCH /api/admin/sellers/{id}/reject` |
| Annonce publiée | `PATCH /api/admin/animals/{id}/publish` |
| Annonce rejetée | `PATCH /api/admin/animals/{id}/reject` |

Les templates Twig sont dans `templates/emails/`.

---

## Uploads

| Type | Route | Champ | MIME autorisés | Taille max | Dossier |
|---|---|---|---|---|---|
| Avatar | `PATCH /api/me/avatar` | `avatar` | JPEG, PNG, WebP | 2 Mo | `var/uploads/avatars/` |
| Photo annonce | `POST /api/seller/animals/{id}/media` | `photo` | JPEG, PNG | 5 Mo | `var/uploads/animals/` |
| Document annonce | `POST /api/seller/animals/{id}/documents` | `document` | JPEG, PNG, PDF | 10 Mo | `var/uploads/documents/` |

Les fichiers sont servis statiquement depuis `/uploads/...`.  
En production, remplacer le volume Docker par un stockage S3.

---

## Connexion base de données (DBeaver / TablePlus)

| Champ | Valeur |
|---|---|
| Host | `localhost` |
| Port | `3306` |
| Database | `compawgnon` |
| User | `root` |
| Password | `root` |

> **MySQL 8.4** : dans les propriétés du driver, ajouter  
> `allowPublicKeyRetrieval = true` et `useSSL = false`

---

*Compawgnon — Backend Symfony 7.4 — CDA 2025 — Faez Bacar Zoubeiri*
