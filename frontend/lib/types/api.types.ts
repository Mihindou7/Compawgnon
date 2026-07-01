import type { SellerVerifiedStatus } from './auth.types'

export type AnimalStatus = 'draft' | 'pending_review' | 'published' | 'reserved' | 'sold' | 'archived'
export type ReservationStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed'
export type ReviewStatus = 'pending' | 'published' | 'hidden'
export type ContactStatus = 'new' | 'in_progress' | 'resolved' | 'archived'
export type ContactSubject = 'general' | 'compte' | 'annonce' | 'vendeur' | 'signalement' | 'autre'
export type UserStatus = 'active' | 'disabled'
export type SellerType = 'breeder' | 'pet_shop'
export type AnimalSex = 'male' | 'female' | 'unknown'
export type DocumentType = 'vaccine' | 'certificate' | 'pedigree' | 'other'

export interface User {
  id: number
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  avatar_url: string | null
  roles: string[]
  is_verified: boolean
  status: UserStatus
  seller: SellerSummary | null
  created_at: string
}

export interface SellerSummary {
  id: number
  user_id?: number
  name: string
  verified_status: SellerVerifiedStatus
}

export interface Seller {
  id: number
  user_id?: number
  name: string
  type: SellerType
  siret: string
  verified_status: SellerVerifiedStatus
  rejection_reason: string | null
  city: string
  postal_code: string
  address?: string | null
  description?: string | null
  rating?: number | null
  reviews_count?: number
  animals_count?: number
  user?: Pick<User, 'id' | 'email' | 'first_name' | 'last_name'>
  active_animals?: Animal[]
  reviews?: Review[]
}

export interface Species {
  id: number
  name: string
  slug: string
  description?: string
  image_url?: string | null
  life_span?: string
  budget?: string
  maintenance_level?: string
  diet?: string
  breeds_count?: number
  available_animals_count?: number
  breeds?: Breed[]
}

export interface Breed {
  id: number
  name: string
  slug: string
  description?: string
  temperament?: string
  species_id: number
  species?: Pick<Species, 'id' | 'name' | 'slug'>
  available_animals_count?: number
}

export interface AnimalMedia {
  id: number
  file_url: string
  is_cover: boolean
  position: number
}

export interface AnimalDocument {
  id: number
  type: DocumentType
  original_name: string
  file_url: string
  is_public: boolean
}

export interface Animal {
  id: number
  title: string
  description?: string
  status: AnimalStatus
  sex: AnimalSex
  price: number
  city: string
  postal_code?: string
  birthdate?: string | null
  age_months?: number
  cover_url: string
  species?: Pick<Species, 'id' | 'name' | 'slug'>
  breed?: Pick<Breed, 'id' | 'name' | 'slug'> | null
  seller?: Pick<Seller, 'id' | 'user_id' | 'name' | 'type' | 'verified_status' | 'city' | 'rating' | 'reviews_count'>
  media?: AnimalMedia[]
  documents?: AnimalDocument[]
  similar_animals?: Animal[]
  created_at?: string
  published_at?: string | null
  pending_reservations_count?: number
}

export interface Reservation {
  id: number
  status: ReservationStatus
  message: string | null
  seller_response: string | null
  animal: Pick<Animal, 'id' | 'title' | 'cover_url' | 'price' | 'status'>
  seller?: Pick<Seller, 'id' | 'name' | 'city'>
  buyer?: Partial<User>
  created_at: string
  updated_at?: string
}

export interface Review {
  id: number
  rating: number
  comment: string | null
  status: ReviewStatus
  seller?: Pick<Seller, 'id' | 'name'>
  buyer?: Pick<User, 'id' | 'first_name'>
  reservation?: Pick<Reservation, 'id'>
  created_at: string
}

export interface ContactMessage {
  id: number
  name: string
  email: string
  subject: ContactSubject
  status: ContactStatus
  excerpt?: string
  message?: string
  admin_reply?: string | null
  ip_address?: string | null
  handled_by: Pick<User, 'id' | 'email' | 'first_name'> | null
  handled_at: string | null
  created_at: string
  updated_at?: string
}

export interface ContactStats {
  new: number
  in_progress: number
  resolved: number
  archived: number
}

export interface AuditLog {
  id: number
  action: string
  entity_type: string
  entity_id: number
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  ip_address: string
  actor: Pick<User, 'id' | 'email'>
  created_at: string
}

export interface SellerDashboard {
  published_count: number
  pending_count: number
  reserved_count: number
  sold_count: number
  pending_reservations_count: number
  average_rating: number | null
  reviews_count: number
}

export interface AdminDashboard {
  users:    { total: number; active: number; disabled: number; new_last_7_days: number }
  sellers:  { total: number; approved: number; pending: number; rejected: number }
  animals:  { published: number; pending_review: number; reserved: number; sold: number }
  reviews:  { pending: number; published: number; hidden: number }
  contacts: { new: number; in_progress: number; resolved: number; archived: number }
  pending_actions: {
    sellers_to_validate: number
    animals_to_moderate: number
    reviews_to_moderate: number
    contacts_to_handle:  number
  }
}
