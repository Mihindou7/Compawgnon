<?php

namespace App\Tests\Integration\Fixtures;

use App\Entity\Animal;
use App\Entity\Reservation;
use App\Entity\Seller;
use App\Entity\Species;
use App\Entity\User;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Trait partagé par les tests d'intégration qui ont besoin d'entités de catalogue.
 * Requiert que la classe utilisatrice dispose de $this->em (EntityManagerInterface).
 */
trait TestEntityFactory
{
    private const FACTORY_PASSWORD = 'Test1234!';

    protected function createSpecies(string $name = 'Chien', string $slug = 'chien-test'): Species
    {
        $s = new Species();
        $s->setName($name);
        $s->setSlug($slug);
        $s->setDescription(str_repeat('Description de l\'espèce pour les tests. ', 4));
        $this->em->persist($s);

        return $s;
    }

    protected function createApprovedSeller(string $emailPrefix = 'seller'): array
    {
        $hasher = static::getContainer()->get(UserPasswordHasherInterface::class);

        $user = new User();
        $user->setEmail($emailPrefix . '@seller.test');
        $user->setPasswordHash($hasher->hashPassword($user, self::FACTORY_PASSWORD));
        $user->setRoles(['ROLE_USER', 'ROLE_SELLER']);
        $user->setStatus('active');
        $user->setFirstName('Sophie');
        $user->setLastName('Martin');
        $user->setTermsAcceptedAt(new \DateTimeImmutable());
        $user->setEmailVerifiedAt(new \DateTimeImmutable());
        $this->em->persist($user);

        $seller = new Seller();
        $seller->setUser($user);
        $seller->setName('Élevage du Val Test');
        $seller->setType('breeder');
        $seller->setSiret('12345678901234');
        $seller->setCity('Lyon');
        $seller->setPostalCode('69001');
        $seller->setVerifiedStatus('approved');
        $this->em->persist($seller);

        return ['user' => $user, 'seller' => $seller];
    }

    protected function createPublishedAnimal(Seller $seller, Species $species, string $suffix = ''): Animal
    {
        $a = new Animal();
        $a->setSeller($seller);
        $a->setSpecies($species);
        $a->setTitle('Golden Retriever à adopter' . ($suffix ? " ({$suffix})" : ''));
        $a->setDescription(str_repeat('Magnifique animal en parfaite santé, très sociable et affectueux. ', 3));
        $a->setSex('male');
        $a->setPrice('800.00');
        $a->setCity('Lyon');
        $a->setPostalCode('69001');
        $a->setStatus('published');
        $a->setPublishedAt(new \DateTimeImmutable());
        $this->em->persist($a);

        return $a;
    }

    protected function createDraftAnimal(Seller $seller, Species $species): Animal
    {
        $a = new Animal();
        $a->setSeller($seller);
        $a->setSpecies($species);
        $a->setTitle('Animal en brouillon non visible');
        $a->setDescription(str_repeat('Description de l\'animal en cours de rédaction. ', 3));
        $a->setSex('female');
        $a->setPrice('500.00');
        $a->setCity('Paris');
        $a->setPostalCode('75001');
        $a->setStatus('draft');
        $this->em->persist($a);

        return $a;
    }

    protected function createVerifiedBuyer(string $email = 'buyer@test.com'): User
    {
        $hasher = static::getContainer()->get(UserPasswordHasherInterface::class);

        $user = new User();
        $user->setEmail($email);
        $user->setPasswordHash($hasher->hashPassword($user, self::FACTORY_PASSWORD));
        $user->setRoles(['ROLE_USER']);
        $user->setStatus('active');
        $user->setFirstName('Marie');
        $user->setLastName('Dupont');
        $user->setTermsAcceptedAt(new \DateTimeImmutable());
        $user->setEmailVerifiedAt(new \DateTimeImmutable());
        $this->em->persist($user);

        return $user;
    }

    protected function createUnverifiedBuyer(string $email = 'unverified@test.com'): User
    {
        $hasher = static::getContainer()->get(UserPasswordHasherInterface::class);

        $user = new User();
        $user->setEmail($email);
        $user->setPasswordHash($hasher->hashPassword($user, self::FACTORY_PASSWORD));
        $user->setRoles(['ROLE_USER']);
        $user->setStatus('active');
        $user->setTermsAcceptedAt(new \DateTimeImmutable());
        // emailVerifiedAt absent → isEmailVerified() = false
        $this->em->persist($user);

        return $user;
    }

    protected function createAdmin(string $email = 'admin@test.com'): User
    {
        $hasher = static::getContainer()->get(UserPasswordHasherInterface::class);

        $user = new User();
        $user->setEmail($email);
        $user->setPasswordHash($hasher->hashPassword($user, self::FACTORY_PASSWORD));
        $user->setRoles(['ROLE_USER', 'ROLE_ADMIN']);
        $user->setStatus('active');
        $user->setFirstName('Admin');
        $user->setLastName('Test');
        $user->setTermsAcceptedAt(new \DateTimeImmutable());
        $user->setEmailVerifiedAt(new \DateTimeImmutable());
        $this->em->persist($user);

        return $user;
    }

    protected function createPendingSeller(string $emailPrefix = 'pending-seller'): array
    {
        $hasher = static::getContainer()->get(UserPasswordHasherInterface::class);

        $user = new User();
        $user->setEmail($emailPrefix . '@seller.test');
        $user->setPasswordHash($hasher->hashPassword($user, self::FACTORY_PASSWORD));
        $user->setRoles(['ROLE_USER']);
        $user->setStatus('active');
        $user->setFirstName('Jean');
        $user->setLastName('Vendeur');
        $user->setTermsAcceptedAt(new \DateTimeImmutable());
        $user->setEmailVerifiedAt(new \DateTimeImmutable());
        $this->em->persist($user);

        $seller = new Seller();
        $seller->setUser($user);
        $seller->setName('Élevage En Attente');
        $seller->setType('breeder');
        $seller->setSiret('98765432109876');
        $seller->setCity('Paris');
        $seller->setPostalCode('75001');
        $seller->setVerifiedStatus('pending');
        $this->em->persist($seller);

        return ['user' => $user, 'seller' => $seller];
    }

    /**
     * Crée un vendeur avec ROLE_SELLER mais dont le profil est encore 'pending'.
     * Permet de tester que AnimalService::create() refuse la création (403)
     * même si le garde de route ROLE_SELLER est passé.
     */
    protected function createUnapprovedSeller(string $emailPrefix = 'unapproved-seller'): array
    {
        $hasher = static::getContainer()->get(UserPasswordHasherInterface::class);

        $user = new User();
        $user->setEmail($emailPrefix . '@seller.test');
        $user->setPasswordHash($hasher->hashPassword($user, self::FACTORY_PASSWORD));
        $user->setRoles(['ROLE_USER', 'ROLE_SELLER']); // passe le garde de route mais pas isApproved()
        $user->setStatus('active');
        $user->setFirstName('Marc');
        $user->setLastName('NonApprouve');
        $user->setTermsAcceptedAt(new \DateTimeImmutable());
        $user->setEmailVerifiedAt(new \DateTimeImmutable());
        $this->em->persist($user);

        $seller = new Seller();
        $seller->setUser($user);
        $seller->setName('Élevage Non Approuvé');
        $seller->setType('breeder');
        $seller->setSiret('11111111111111');
        $seller->setCity('Nice');
        $seller->setPostalCode('06000');
        $seller->setVerifiedStatus('pending');
        $this->em->persist($seller);

        return ['user' => $user, 'seller' => $seller];
    }

    protected function createPendingReviewAnimal(Seller $seller, Species $species): Animal
    {
        $a = new Animal();
        $a->setSeller($seller);
        $a->setSpecies($species);
        $a->setTitle('Annonce en attente de modération');
        $a->setDescription(str_repeat('Description soumise en attente de validation par l\'admin. ', 3));
        $a->setSex('female');
        $a->setPrice('350.00');
        $a->setCity('Toulouse');
        $a->setPostalCode('31000');
        $a->setStatus('pending_review');
        $this->em->persist($a);

        return $a;
    }

    protected function createPendingReservation(Animal $animal, User $buyer, Seller $seller): Reservation
    {
        $r = new Reservation();
        $r->setAnimal($animal);
        $r->setBuyer($buyer);
        $r->setSeller($seller);
        $r->setStatus('pending');
        $this->em->persist($r);

        return $r;
    }
}
