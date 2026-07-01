import Link from 'next/link'
import type { Metadata } from 'next'

import { LegalShell, type LegalSection } from '@/components/legal/LegalShell'

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description:
    'Politique de confidentialité de Compawgnon : quelles données nous collectons, pourquoi, et comment exercer vos droits (RGPD).',
}

const SECTIONS: LegalSection[] = [
  {
    id: 'introduction',
    title: 'Introduction',
    content: (
      <p>
        Chez <strong>Compawgnon</strong>, la protection de vos données personnelles est une priorité. La présente
        politique explique quelles données nous collectons, pourquoi, comment nous les utilisons et quels sont vos
        droits, conformément au Règlement général sur la protection des données (RGPD).
      </p>
    ),
  },
  {
    id: 'responsable',
    title: 'Responsable du traitement',
    content: (
      <p>
        Le responsable du traitement est la société Compawgnon, joignable à l&apos;adresse{' '}
        <a href="mailto:privacy@compawgnon.fr">privacy@compawgnon.fr</a> ou via notre{' '}
        <Link href="/contact">page de contact</Link>.
      </p>
    ),
  },
  {
    id: 'donnees',
    title: 'Données collectées',
    content: (
      <>
        <p>Nous collectons uniquement les données nécessaires au fonctionnement de nos services&nbsp;:</p>
        <ul>
          <li><strong>Données de compte</strong> : email, nom, prénom, mot de passe (chiffré).</li>
          <li><strong>Données de profil</strong> : informations vendeur, annonces et photos publiées.</li>
          <li><strong>Données d&apos;usage</strong> : favoris, réservations, avis et historique de navigation.</li>
          <li><strong>Données techniques</strong> : adresse IP, type de navigateur, journaux de connexion.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'finalites',
    title: 'Finalités et bases légales',
    content: (
      <>
        <p>Vos données sont traitées pour les finalités suivantes&nbsp;:</p>
        <ul>
          <li>fournir et gérer votre compte ainsi que les mises en relation (exécution du contrat)&nbsp;;</li>
          <li>assurer la sécurité et prévenir la fraude (intérêt légitime)&nbsp;;</li>
          <li>vous adresser des communications liées au service (intérêt légitime ou consentement)&nbsp;;</li>
          <li>respecter nos obligations légales et réglementaires.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'conservation',
    title: 'Durée de conservation',
    content: (
      <p>
        Vos données sont conservées pendant la durée strictement nécessaire aux finalités décrites, puis archivées ou
        supprimées. Les données de compte sont conservées tant que votre compte est actif, puis supprimées après une
        période d&apos;inactivité prolongée ou sur demande de suppression.
      </p>
    ),
  },
  {
    id: 'partage',
    title: 'Partage des données',
    content: (
      <p>
        Vos données ne sont jamais vendues. Elles peuvent être partagées avec d&apos;autres utilisateurs dans le strict cadre
        d&apos;une mise en relation (par exemple, un acheteur réservant auprès d&apos;un vendeur) ou avec des prestataires
        techniques (hébergement, envoi d&apos;emails) tenus à des obligations de confidentialité.
      </p>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies',
    content: (
      <p>
        La plateforme utilise des cookies strictement nécessaires à son fonctionnement (authentification, préférences)
        ainsi que, le cas échéant, des cookies de mesure d&apos;audience. Vous pouvez configurer votre navigateur pour
        limiter ou supprimer les cookies.
      </p>
    ),
  },
  {
    id: 'securite',
    title: 'Sécurité',
    content: (
      <p>
        Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données&nbsp;:
        chiffrement des mots de passe, connexions sécurisées (HTTPS), contrôle des accès et journalisation des actions
        sensibles.
      </p>
    ),
  },
  {
    id: 'droits',
    title: 'Vos droits',
    content: (
      <>
        <p>Conformément au RGPD, vous disposez des droits suivants&nbsp;:</p>
        <ul>
          <li>droit d&apos;accès, de rectification et d&apos;effacement de vos données&nbsp;;</li>
          <li>droit à la limitation et à l&apos;opposition au traitement&nbsp;;</li>
          <li>droit à la portabilité de vos données&nbsp;;</li>
          <li>droit de définir des directives relatives au sort de vos données après votre décès.</li>
        </ul>
        <p>
          Pour exercer ces droits, contactez-nous à{' '}
          <a href="mailto:privacy@compawgnon.fr">privacy@compawgnon.fr</a>. Vous disposez également du droit d&apos;introduire
          une réclamation auprès de la CNIL.
        </p>
      </>
    ),
  },
  {
    id: 'modification',
    title: 'Modification de la politique',
    content: (
      <p>
        Cette politique de confidentialité peut être mise à jour pour refléter l&apos;évolution de nos services ou de la
        réglementation. La date de dernière mise à jour est indiquée en haut de cette page.
      </p>
    ),
  },
]

export default function ConfidentialitePage() {
  return (
    <LegalShell
      title="Politique de confidentialité"
      intro="Nous nous engageons à traiter vos données personnelles avec transparence et dans le respect du RGPD."
      updatedAt="10 juin 2026"
      sections={SECTIONS}
    />
  )
}
