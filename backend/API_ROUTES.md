# Compawgnon — API Routes
> Base URL : `https://localhost` | Format : JSON | Auth : Bearer JWT

---

## Légende

| Badge | Signification |
|---|---|
| `public` | Aucun token requis |
| `ROLE_USER` | Token JWT valide |
| `ROLE_SELLER` | Token JWT + rôle vendeur approuvé |
| `ROLE_ADMIN` | Token JWT + rôle administrateur |

---

## AUTHENTIFICATION — `/api/auth`

### `POST /api/auth/register`
**Accès :** `public`

**Body :**
```json
{
  "email": "string",
  "password": "string (min 8, 1 maj, 1 chiffre)",
  "firstName": "string (optionnel)",
  "lastName": "string (optionnel)",
  "termsAccepted": true
}
```

**Réponse `201` :**
```json
{ "data": { "message": "Compte créé avec succès. Un email de vérification a été envoyé." } }
```

**Erreurs :** `409` email déjà utilisé · `422` validation échouée

---

### `POST /api/auth/login`
**Accès :** `public`

**Body :**
```json
{ "email": "string", "password": "string" }
```

**Réponse `200` :**
```json
{ "token": "string", "refresh_token": "string" }
```

**Erreurs :** `401` identifiants incorrects · `403` compte désactivé

---

### `POST /api/auth/token/refresh`
**Accès :** `public`

**Body :**
```json
{ "refresh_token": "string" }
```

**Réponse `200` :**
```json
{ "token": "string", "refresh_token": "string" }
```

**Erreurs :** `401` token invalide ou expiré

---

### `POST /api/auth/logout`
**Accès :** `ROLE_USER`

**Body :**
```json
{ "refresh_token": "string" }
```

**Réponse `204` :** no content

---

### `GET /api/auth/verify-email`
**Accès :** `public`

**Query params :** `token=string`

**Réponse `200` :**
```json
{ "data": { "access_token": "string", "expires_in": 3600, "message": "Email vérifié avec succès" } }
```

**Erreurs :** `410` token invalide ou expiré

---

### `POST /api/auth/resend-verification`
**Accès :** `ROLE_USER`

**Body :** aucun

**Réponse `200` :**
```json
{ "data": { "message": "Mail de vérification renvoyé" } }
```

---

### `POST c`
**Accès :** `public`

**Body :**
```json
{ "email": "string" }
```

**Réponse `200` :** réponse identique que l'email existe ou non (anti-énumération)

---

### `POST /api/auth/reset-password`
**Accès :** `public`

**Body :**
```json
{
  "token": "string",
  "password": "string (min 8, 1 maj, 1 chiffre)",
  "passwordConfirm": "string"
}
```

**Réponse `200` :**
```json
{ "data": { "message": "Mot de passe modifié avec succès" } }
```

**Erreurs :** `410` token invalide · `422` passwords ne correspondent pas

---

## PROFIL — `/api/me`

### `GET /api/me`
**Accès :** `ROLE_USER`

**Réponse `200` :**
```json
{
  "data": {
    "id": 1, "email": "user@example.com",
    "first_name": "Jean", "last_name": "Dupont",
    "phone": "0612345678", "avatar_url": "/uploads/avatars/xxx.jpg",
    "roles": ["ROLE_USER"], "is_verified": true, "status": "active",
    "seller": { "id": 3, "name": "Élevage du Val", "verified_status": "approved" },
    "created_at": "2026-04-01T10:00:00Z"
  }
}
```

---

### `PATCH /api/me`
**Accès :** `ROLE_USER`

**Body (tous optionnels) :**
```json
{ "firstName": "string", "lastName": "string", "phone": "string" }
```

**Réponse `200` :** profil mis à jour (même structure que GET /api/me)

---

### `PATCH /api/me/password`
**Accès :** `ROLE_USER`

**Body :**
```json
{
  "currentPassword": "string (ignoré si compte Google)",
  "newPassword": "string (min 8, 1 maj, 1 chiffre)",
  "newPasswordConfirm": "string"
}
```

**Réponse `200` :**
```json
{ "data": { "message": "Mot de passe modifié" } }
```

**Erreurs :** `400` mot de passe actuel incorrect · `422` passwords ne correspondent pas

---

### `PATCH /api/me/avatar`
**Accès :** `ROLE_USER`

**Body :** `multipart/form-data`, champ `avatar` (image JPEG/PNG/WebP, max 2 Mo)

**Réponse `200` :**
```json
{ "data": { "avatar_url": "/uploads/avatars/uuid.jpg" } }
```

**Erreurs :** `400` aucun fichier · `413` fichier trop lourd · `415` MIME non autorisé

---

### `DELETE /api/me`
**Accès :** `ROLE_USER`

**Body :**
```json
{ "password": "string (ignoré si compte Google)" }
```

**Réponse `204` :** no content (anonymisation RGPD)

---

## VENDEUR UTILISATEUR — `/api/me/seller`

### `GET /api/me/seller`
**Accès :** `ROLE_USER`

**Réponse `200` :**
```json
{
  "data": {
    "id": 3, "name": "Élevage du Val", "type": "breeder",
    "siret": "12345678901234", "verified_status": "pending | approved | rejected",
    "rejection_reason": "string | null", "city": "Lyon", "postal_code": "69001"
  }
}
```
*(ou `null` si aucun profil vendeur)*

---

### `POST /api/me/seller/apply`
**Accès :** `ROLE_USER` + email vérifié

**Body :**
```json
{
  "name": "string", "type": "breeder | pet_shop",
  "siret": "string (14 chiffres)", "city": "string",
  "postalCode": "string", "address": "string (opt)", "description": "string (opt)"
}
```

**Réponse `201` :**
```json
{ "data": { "id": 3, "verified_status": "pending" } }
```

**Erreurs :** `403` email non vérifié · `409` demande déjà en cours

---

### `PATCH /api/me/seller`
**Accès :** `ROLE_USER`

**Body (tous optionnels) :** mêmes champs que le POST

**Réponse `200` :** profil mis à jour *(repasse en `pending` si statut était `rejected`)*

---

## FAVORIS — `/api/me/favorites`

### `GET /api/me/favorites`
**Accès :** `ROLE_USER`

**Query params :** `page` (défaut: 1) · `limit` (défaut: 20, max: 50)

**Réponse `200` :**
```json
{
  "data": [{ "id": 1, "animal": { "id": 42, "title": "...", "price": 800, "status": "published", "cover_url": "..." }, "created_at": "..." }],
  "meta": { "page": 1, "limit": 20, "total": 5, "total_pages": 1, "has_next": false, "has_prev": false }
}
```

---

### `POST /api/me/favorites/{animalId}`
**Accès :** `ROLE_USER`

**Réponse `200` :** `{ "data": { "message": "Ajouté aux favoris" } }` *(idempotent)*

**Erreurs :** `404` animal introuvable

---

### `DELETE /api/me/favorites/{animalId}`
**Accès :** `ROLE_USER`

**Réponse `204` :** no content *(idempotent)*

---

## RÉSERVATIONS ACHETEUR — `/api/me/reservations`

### `GET /api/me/reservations`
**Accès :** `ROLE_USER`

**Query params :** `status` · `page` · `limit`

**Réponse `200` :** liste paginée avec `animal`, `seller`, `seller_response`

---

### `POST /api/me/reservations`
**Accès :** `ROLE_USER` + email vérifié

**Body :**
```json
{ "animalId": 42, "message": "string (opt, max 500)" }
```

**Réponse `201` :**
```json
{ "data": { "id": 10, "status": "pending", "animal": { "id": 42, "title": "..." }, "created_at": "..." } }
```

**Erreurs :** `403` email non vérifié · `404` animal non disponible · `409` déjà réservé ou demande existante

---

### `GET /api/me/reservations/{id}`
**Accès :** `ROLE_USER`

**Réponse `200` :** détail complet · **Erreurs :** `403` pas ton acheteur · `404`

---

### `PATCH /api/me/reservations/{id}/cancel`
**Accès :** `ROLE_USER`

**Réponse `200` :** `{ "data": { "status": "cancelled" } }`

**Erreurs :** `403` pas ton acheteur · `409` statut incompatible

---

## AVIS — `/api/me/reviews`

### `POST /api/me/reviews`
**Accès :** `ROLE_USER` + email vérifié

**Body :**
```json
{ "reservationId": 10, "rating": 5, "comment": "string (opt, max 1000)" }
```

**Réponse `201` :**
```json
{ "data": { "id": 7, "rating": 5, "status": "pending", "message": "Votre avis a été soumis. Il sera visible après modération." } }
```

**Erreurs :** `403` réservation pas à toi · `409` avis déjà déposé · `422` réservation non `completed`

---

### `GET /api/me/reviews`
**Accès :** `ROLE_USER`

**Query params :** `page` · `limit`

**Réponse `200` :** liste paginée avec `seller`, `status` de l'avis

---

## CATALOGUE PUBLIC

### `GET /api/species`
**Accès :** `public`

**Réponse `200` :** liste alphabétique avec `breeds_count` et `available_animals_count`

---

### `GET /api/species/{slug}`
**Accès :** `public`

**Réponse `200` :** détail espèce + tableau `breeds` avec `available_animals_count`

**Erreurs :** `404`

---

### `GET /api/breeds`
**Accès :** `public`

**Query params :** `species_id` · `species_slug`

**Réponse `200` :** liste avec `available_animals_count`

---

### `GET /api/breeds/{slug}`
**Accès :** `public`

**Réponse `200` :** détail race avec `description`, `temperament`, `available_animals_count`

**Erreurs :** `404`

---

### `GET /api/animals`
**Accès :** `public`

**Query params :**

| Param | Description |
|---|---|
| `species_id` / `species_slug` | Filtrer par espèce |
| `breed_id` / `breed_slug` | Filtrer par race |
| `price_min` / `price_max` | Fourchette de prix |
| `sex` | `male` · `female` · `unknown` |
| `city` | Ville (recherche partielle) |
| `postal_code` | Code postal exact |
| `age_min` / `age_max` | Âge en mois |
| `seller_type` | `breeder` · `pet_shop` |
| `sort` | `published_at_desc` · `price_asc` · `price_desc` · `age_asc` |
| `page` / `limit` | Pagination (max 50) |

**Réponse `200` :** liste paginée avec `age_months`, `cover_url`, `seller.rating`

---

### `GET /api/animals/{id}`
**Accès :** `public`

**Réponse `200` :** fiche complète avec `media`, `documents` (publics uniquement), `seller`, `similar_animals`

**Erreurs :** `404` si non `published`

---

### `GET /api/sellers/{id}`
**Accès :** `public`

**Réponse `200` :** fiche vendeur avec `active_animals` (max 6), `reviews` (max 5), `rating`

**Erreurs :** `404` si non `approved`

---

## VENDEUR — `/api/seller` — `ROLE_SELLER`

### `GET /api/seller/dashboard`
**Réponse `200` :** KPIs (animaux par statut, réservations en attente, note)

---

### `GET /api/seller/animals`
**Query params :** `status` · `page` · `limit`

**Réponse `200` :** liste paginée avec `pending_reservations_count`

---

### `GET /api/seller/animals/{id}`
**Réponse `200` :** détail avec `media` et `documents` · **Erreurs :** `403` · `404`

---

### `POST /api/seller/animals`
**Body :** `speciesId`, `title`, `description` (min 80), `sex`, `price`, `city`, `postalCode`, `breedId` (opt), `birthdate` (opt)

**Réponse `201` :** `{ id, status: "pending_review", message }`

**Erreurs :** `403` vendeur non approuvé · `404` espèce introuvable · `422`

---

### `PATCH /api/seller/animals/{id}`
**Body (tous optionnels) :** mêmes champs que POST + `breed_id`

**Réponse `200` :** `{ id, status, requires_remoderation, message }` *(repasse en `pending_review` si était `published`)*

**Erreurs :** `403` · `409` statut `reserved`, `sold` ou `archived`

---

### `DELETE /api/seller/animals/{id}`
**Réponse `204` :** archivage soft · **Erreurs :** `403` · `409` statut `reserved`

---

### `POST /api/seller/animals/{id}/media`
**Body :** `multipart/form-data`, champ `photo` (JPEG/PNG, max 5 Mo), `is_cover` (bool), `position` (int)

**Réponse `201` :** `{ id, file_url, is_cover, position }`

**Erreurs :** `403` · `409` max 10 photos · `413` · `415`

---

### `DELETE /api/seller/animals/{id}/media/{mediaId}`
**Réponse `204` :** supprime fichier disque · **Erreurs :** `403` · `404` · `409` dernière photo d'un annonce publiée

---

### `POST /api/seller/animals/{id}/documents`
**Body :** `multipart/form-data`, champ `document` (JPEG/PNG/PDF, max 10 Mo), `type` (`vaccine|certificate|pedigree|other`), `is_public` (bool)

**Réponse `201` :** `{ id, type, original_name, is_public }`

**Erreurs :** `403` · `413` · `415`

---

### `DELETE /api/seller/animals/{id}/documents/{docId}`
**Réponse `204` :** supprime fichier disque · **Erreurs :** `403` · `404`

---

### `GET /api/seller/reservations`
**Query params :** `status` · `page` · `limit`

**Réponse `200` :** liste paginée (`first_name` acheteur uniquement — RGPD)

---

### `GET /api/seller/reservations/{id}`
**Réponse `200` :** détail avec `last_name` et `phone` acheteur · **Erreurs :** `403` · `404`

---

### `PATCH /api/seller/reservations/{id}/accept`
**Body :** `{ "sellerResponse": "string (opt)" }`

**Réponse `200` :** `{ status: "accepted", auto_rejected_count: 2 }` *(rejette automatiquement les autres demandes pending)*

**Erreurs :** `403` · `409` statut ≠ `pending`

---

### `PATCH /api/seller/reservations/{id}/reject`
**Body :** `{ "sellerResponse": "string (opt)" }`

**Réponse `200` :** `{ status: "rejected" }` · **Erreurs :** `403` · `409`

---

### `PATCH /api/seller/reservations/{id}/complete`
**Réponse `200` :** `{ status: "completed" }` *(passe l'animal en `sold`, débloque les avis)*

**Erreurs :** `403` · `409` statut ≠ `accepted`

---

## ADMIN — `/api/admin` — `ROLE_ADMIN`

### `GET /api/admin/dashboard`
**Réponse `200` :** KPIs globaux (`users`, `sellers`, `animals`, `reviews`, `pending_actions`)

---

### `GET /api/admin/users`
**Query params :** `status` · `role` · `search` · `page` · `limit`

**Réponse `200` :** liste paginée avec profil vendeur associé

---

### `GET /api/admin/users/{id}`
**Réponse `200` :** profil complet + `stats` + `auth_providers` · **Erreurs :** `404`

---

### `PATCH /api/admin/users/{id}/toggle-status`
**Réponse `200` :** `{ id, status: "disabled|active", archived_animals_count }` *(archivage cascade si vendeur)*

**Erreurs :** `403` tentative sur son propre compte · `404`

---

### `DELETE /api/admin/users/{id}`
**Réponse `204` :** anonymisation RGPD · **Erreurs :** `403` · `404`

---

### `GET /api/admin/sellers`
**Query params :** `verified_status` (défaut: `pending`) · `page` · `limit`

**Réponse `200` :** liste triée `created_at ASC`

---

### `GET /api/admin/sellers/{id}`
**Réponse `200` :** détail avec `animals_count`, `rating`, `reviews_count` · **Erreurs :** `404`

---

### `PATCH /api/admin/sellers/{id}/approve`
**Réponse `200` :** `{ id, verified_status: "approved" }` *(ajoute ROLE_SELLER à l'user)*

**Erreurs :** `404`

---

### `PATCH /api/admin/sellers/{id}/reject`
**Body :** `{ "rejectionReason": "string (opt)" }`

**Réponse `200` :** `{ id, verified_status: "rejected" }` · **Erreurs :** `404`

---

### `GET /api/admin/animals`
**Query params :** `status` (défaut: `pending_review`) · `seller_id` · `page` · `limit`

**Réponse `200` :** liste triée `created_at ASC` avec `media_count`

---

### `GET /api/admin/animals/{id}`
**Réponse `200` :** détail complet avec `media` et `documents` · **Erreurs :** `404`

---

### `PATCH /api/admin/animals/{id}/publish`
**Réponse `200` :** `{ id, status: "published", published_at }` *(email au vendeur)*

**Erreurs :** `404` · `409` statut ≠ `pending_review`

---

### `PATCH /api/admin/animals/{id}/reject`
**Body :** `{ "rejectionReason": "string (opt)" }`

**Réponse `200` :** `{ id, status: "draft" }` *(repasse en draft pour correction)*

**Erreurs :** `404` · `409` statut ≠ `pending_review`

---

### `GET /api/admin/reviews`
**Query params :** `status` (défaut: `pending`) · `seller_id` · `page` · `limit`

**Réponse `200` :** liste triée `created_at ASC` avec email acheteur

---

### `PATCH /api/admin/reviews/{id}/toggle-visibility`
**Réponse `200` :** `{ id, status: "published|hidden", seller_rating_updated, seller_reviews_count }`

**Erreurs :** `404`

---

### `GET /api/admin/audit-logs`
**Query params :** `action` · `actor_id` · `entity_type` · `entity_id` · `date_from` · `date_to` · `page` · `limit` (max 100)

**Réponse `200` :** journal paginé avec `actor`, `old_values`, `new_values`, `ip_address`

---

## Codes HTTP

| Code | Signification |
|---|---|
| `200` | Succès |
| `201` | Ressource créée |
| `204` | Succès sans contenu |
| `400` | Requête invalide |
| `401` | Non authentifié |
| `403` | Accès interdit |
| `404` | Ressource introuvable |
| `409` | Conflit (doublon, statut incompatible) |
| `410` | Ressource expirée (token) |
| `413` | Fichier trop lourd |
| `415` | Type MIME non autorisé |
| `422` | Validation échouée |

---

*Compawgnon API — 62 routes — Backend Symfony 7.4 — CDA 2025*
