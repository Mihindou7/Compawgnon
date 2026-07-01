import Link from 'next/link'
import type { Metadata } from 'next'

import { LegalShell, type LegalSection } from '@/components/legal/LegalShell'

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation",
  description:
    "Conditions générales d'utilisation de la plateforme Compawgnon : règles d'accès, obligations des utilisateurs et des vendeurs.",
}

const SECTIONS: LegalSection[] = [
  {
    id: 'objet',
    title: 'Objet',
    content: (
      <p>
        Les présentes conditions générales d&apos;utilisation (les «&nbsp;CGU&nbsp;») régissent l&apos;accès et l&apos;utilisation de
        la plateforme <strong>Compawgnon</strong>, qui met en relation des particuliers à la recherche d&apos;un animal de
        compagnie avec des éleveurs et animaleries certifiés. En naviguant sur la plateforme ou en créant un compte,
        vous reconnaissez avoir lu, compris et accepté l&apos;intégralité des présentes CGU.
      </p>
    ),
  },
  {
    id: 'definitions',
    title: 'Définitions',
    content: (
      <ul>
        <li><strong>Plateforme</strong> : le site et les services Compawgnon.</li>
        <li><strong>Utilisateur</strong> : toute personne accédant à la plateforme, inscrite ou non.</li>
        <li><strong>Acheteur</strong> : utilisateur recherchant ou réservant un animal.</li>
        <li><strong>Vendeur</strong> : éleveur ou animalerie certifié publiant des annonces.</li>
        <li><strong>Annonce</strong> : la fiche descriptive d&apos;un animal proposé sur la plateforme.</li>
      </ul>
    ),
  },
  {
    id: 'compte',
    title: 'Création et gestion du compte',
    content: (
      <>
        <p>
          La création d&apos;un compte nécessite une adresse email valide et l&apos;acceptation des présentes CGU. Vous vous
          engagez à fournir des informations exactes et à les maintenir à jour.
        </p>
        <p>
          Vous êtes seul responsable de la confidentialité de vos identifiants et de toutes les activités réalisées
          depuis votre compte. Tout usage frauduleux doit nous être signalé sans délai via la{' '}
          <Link href="/contact">page de contact</Link>.
        </p>
      </>
    ),
  },
  {
    id: 'vendeurs',
    title: 'Obligations des vendeurs',
    content: (
      <>
        <p>
          Les vendeurs doivent disposer des certifications et autorisations légales requises pour la cession d&apos;animaux
          de compagnie. Chaque annonce doit décrire fidèlement l&apos;animal, son état de santé et ses conditions de cession.
        </p>
        <ul>
          <li>Respecter la réglementation relative à la protection et au bien-être animal.</li>
          <li>Fournir les documents obligatoires (identification, certificat vétérinaire, etc.).</li>
          <li>Honorer les réservations confirmées via la plateforme.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'acheteurs',
    title: 'Obligations des acheteurs',
    content: (
      <p>
        Les acheteurs s&apos;engagent à utiliser la plateforme de bonne foi, à fournir des informations exactes lors d&apos;une
        réservation et à s&apos;assurer de pouvoir offrir des conditions de vie adaptées à l&apos;animal. Toute réservation
        constitue un engagement envers le vendeur concerné.
      </p>
    ),
  },
  {
    id: 'contenus',
    title: 'Contenus et comportements interdits',
    content: (
      <>
        <p>Il est strictement interdit de publier ou de diffuser sur la plateforme&nbsp;:</p>
        <ul>
          <li>des contenus faux, trompeurs ou portant atteinte au bien-être animal&nbsp;;</li>
          <li>des propos illicites, haineux, diffamatoires ou contraires à l&apos;ordre public&nbsp;;</li>
          <li>des annonces relatives à des espèces protégées ou dont la cession est interdite.</li>
        </ul>
        <p>
          Compawgnon se réserve le droit de retirer tout contenu non conforme et de suspendre le compte concerné.
        </p>
      </>
    ),
  },
  {
    id: 'responsabilite',
    title: 'Responsabilité',
    content: (
      <p>
        Compawgnon agit en qualité d&apos;intermédiaire technique et n&apos;est pas partie aux transactions conclues entre
        acheteurs et vendeurs. Nous ne saurions être tenus responsables des litiges, manquements ou dommages liés à une
        cession, sans préjudice de nos obligations légales en matière de modération.
      </p>
    ),
  },
  {
    id: 'propriete',
    title: 'Propriété intellectuelle',
    content: (
      <p>
        L&apos;ensemble des éléments de la plateforme (marque, logo, textes, interface, code) est protégé par le droit de la
        propriété intellectuelle. Toute reproduction ou exploitation non autorisée est interdite.
      </p>
    ),
  },
  {
    id: 'modification',
    title: 'Modification des CGU',
    content: (
      <p>
        Compawgnon peut modifier les présentes CGU à tout moment afin de les adapter à l&apos;évolution de ses services ou de
        la réglementation. Les utilisateurs seront informés de toute modification substantielle. La poursuite de
        l&apos;utilisation vaut acceptation des CGU mises à jour.
      </p>
    ),
  },
  {
    id: 'droit',
    title: 'Droit applicable',
    content: (
      <p>
        Les présentes CGU sont régies par le droit français. En cas de litige, et à défaut de résolution amiable, les
        tribunaux français seront seuls compétents. Pour toute question, contactez-nous via la{' '}
        <Link href="/contact">page de contact</Link>.
      </p>
    ),
  },
]

export default function CguPage() {
  return (
    <LegalShell
      title="Conditions générales d'utilisation"
      intro="Ces conditions encadrent l'utilisation de la plateforme Compawgnon par l'ensemble de ses utilisateurs, acheteurs comme vendeurs."
      updatedAt="10 juin 2026"
      sections={SECTIONS}
    />
  )
}
