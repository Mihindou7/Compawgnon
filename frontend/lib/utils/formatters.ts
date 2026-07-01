import { differenceInMonths, format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price)
}

export function formatAge(birthdate: string | null | undefined): string {
  if (!birthdate) return 'Âge inconnu'
  const months = differenceInMonths(new Date(), parseISO(birthdate))
  if (months < 1) return 'Moins d\'un mois'
  if (months < 12) return `${months} mois`
  const years = Math.floor(months / 12)
  return years === 1 ? '1 an' : `${years} ans`
}

export function formatAgeMonths(months: number): string {
  if (months < 1) return 'Moins d\'un mois'
  if (months < 12) return `${months} mois`
  const years = Math.floor(months / 12)
  return years === 1 ? '1 an' : `${years} ans`
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return format(parseISO(date), 'd MMMM yyyy', { locale: fr })
}

export function formatDateShort(date: string | null | undefined): string {
  if (!date) return '—'
  return format(parseISO(date), 'dd/MM/yyyy', { locale: fr })
}

export function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return '—'
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')
  }
  return phone
}

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str
  return str.slice(0, max).trimEnd() + '…'
}
