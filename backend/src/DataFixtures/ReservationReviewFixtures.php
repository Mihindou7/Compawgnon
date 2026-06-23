<?php

namespace App\DataFixtures;

use App\Entity\Animal;
use App\Entity\Reservation;
use App\Entity\Review;
use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;
use Doctrine\Persistence\ObjectManager;

class ReservationReviewFixtures extends Fixture implements DependentFixtureInterface
{
    public function load(ObjectManager $em): void
    {
        /** @var \App\Entity\User $buyer1 */
        $buyer1 = $this->getReference(UserFixtures::BUYER_1_REF, User::class);
        $buyer2 = $this->getReference(UserFixtures::BUYER_2_REF, User::class);
        $buyer3 = $this->getReference(UserFixtures::BUYER_3_REF, User::class);

        $animal0 = $this->getReference('animal-0', Animal::class); // Golden mâle
        $animal1 = $this->getReference('animal-1', Animal::class); // Golden femelle
        $animal2 = $this->getReference('animal-2', Animal::class); // Labrador chocolat
        $animal4 = $this->getReference('animal-4', Animal::class); // Maine Coon
        $animal6 = $this->getReference('animal-6', Animal::class); // Berger Allemand

        // ── Réservation 1 : completed → permet un avis ───────────────────────
        $res1 = $this->makeReservation(
            $animal4, $buyer1, $animal4->getSeller(),
            'completed',
            "Bonjour, je suis très intéressée par ce Maine Coon. Avez-vous encore le chaton disponible ?",
            "Bonjour Marie, oui il est toujours disponible ! Venez le rencontrer quand vous le souhaitez."
        );
        $animal4->setStatus('sold');
        $em->persist($res1);

        // Avis publié sur res1
        $review1 = new Review();
        $review1->setSeller($animal4->getSeller());
        $review1->setBuyer($buyer1);
        $review1->setReservation($res1);
        $review1->setRating(5);
        $review1->setComment("Vendeur très sérieux et à l'écoute. Le chaton est exactement comme décrit, en parfaite santé. Je recommande vivement !");
        $review1->setStatus('published');
        $em->persist($review1);

        // ── Réservation 2 : completed → permet un avis ───────────────────────
        $res2 = $this->makeReservation(
            $animal2, $buyer2, $animal2->getSeller(),
            'completed',
            "Bonjour, mon fils adore les Labradors. Ce chiot est-il encore disponible ?",
            "Bonjour Thomas, il est encore disponible ! N'hésitez pas à venir."
        );
        $animal2->setStatus('sold');
        $em->persist($res2);

        // Avis publié sur res2
        $review2 = new Review();
        $review2->setSeller($animal2->getSeller());
        $review2->setBuyer($buyer2);
        $review2->setReservation($res2);
        $review2->setRating(4);
        $review2->setComment("Très bon vendeur, chiot en super santé. Le seul bémol est le délai de réponse un peu long, mais le chiot est magnifique.");
        $review2->setStatus('published');
        $em->persist($review2);

        // Avis en attente de modération
        $review3 = new Review();
        $review3->setSeller($animal4->getSeller());
        $review3->setBuyer($buyer3);
        $review3->setReservation($this->makeReservation(
            $animal6, $buyer3, $animal6->getSeller(),
            'completed',
            "Intéressé par le Berger Allemand.",
            "Super chiot, vous serez ravis !"
        ));
        $animal6->setStatus('sold');
        $review3->setRating(3);
        $review3->setComment("Chiot correct mais l'animalerie était un peu bruyante. Le chiot semble stressé au départ.");
        $review3->setStatus('pending');
        $em->persist($review3->getReservation());
        $em->persist($review3);

        // ── Réservations pending (à traiter) ─────────────────────────────────
        $resPending1 = $this->makeReservation(
            $animal0, $buyer1, $animal0->getSeller(),
            'pending',
            "Bonjour, je suis très intéressée par ce Golden mâle pour ma famille avec deux enfants. Peut-on venir le visiter le weekend ?"
        );
        $em->persist($resPending1);

        $resPending2 = $this->makeReservation(
            $animal0, $buyer2, $animal0->getSeller(),
            'pending',
            "Chiot disponible ? Je cherche un Golden depuis longtemps."
        );
        $em->persist($resPending2);

        $resPending3 = $this->makeReservation(
            $animal1, $buyer3, $animal1->getSeller(),
            'pending',
            "Bonjour, votre Golden femelle m'intéresse beaucoup. Je suis disponible pour une visite en semaine."
        );
        $em->persist($resPending3);

        // ── Réservation accepted ──────────────────────────────────────────────
        $resAccepted = $this->makeReservation(
            $animal1, $buyer2, $animal1->getSeller(),
            'accepted',
            "Je suis très intéressé par cette femelle Golden.",
            "Bonjour, votre réservation est acceptée ! Venez la semaine prochaine."
        );
        $animal1->setStatus('reserved');
        $em->persist($resAccepted);

        $em->flush();
    }

    private function makeReservation(
        Animal $animal,
        User $buyer,
        \App\Entity\Seller $seller,
        string $status,
        ?string $message = null,
        ?string $sellerResponse = null
    ): Reservation {
        $r = new Reservation();
        $r->setAnimal($animal);
        $r->setBuyer($buyer);
        $r->setSeller($seller);
        $r->setStatus($status);
        $r->setMessage($message);
        $r->setSellerResponse($sellerResponse);
        return $r;
    }

    public function getDependencies(): array
    {
        return [UserFixtures::class, AnimalFixtures::class];
    }
}
