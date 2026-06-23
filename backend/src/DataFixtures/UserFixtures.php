<?php

namespace App\DataFixtures;

use App\Entity\Seller;
use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class UserFixtures extends Fixture
{
    public const ADMIN_REF          = 'user-admin';
    public const SELLER_BREEDER_REF = 'user-seller-breeder';
    public const SELLER_SHOP_REF    = 'user-seller-shop';
    public const SELLER_PENDING_REF = 'user-seller-pending';
    public const BUYER_1_REF        = 'user-buyer-1';
    public const BUYER_2_REF        = 'user-buyer-2';
    public const BUYER_3_REF        = 'user-buyer-3';

    public function __construct(private readonly UserPasswordHasherInterface $hasher)
    {
    }

    public function load(ObjectManager $em): void
    {
        // ── Admin ────────────────────────────────────────────────────────────
        $admin = $this->makeUser('admin@compawgnon.fr', 'Admin1234!', ['ROLE_USER', 'ROLE_ADMIN'], 'Admin', 'Compawgnon');
        $em->persist($admin);
        $this->addReference(self::ADMIN_REF, $admin);

        // ── Vendeur éleveur (approuvé) ────────────────────────────────────────
        $sellerBreederUser = $this->makeUser('elevage@compawgnon.fr', 'Seller1234!', ['ROLE_USER', 'ROLE_SELLER'], 'Sophie', 'Martin');
        $em->persist($sellerBreederUser);

        $sellerBreeder = new Seller();
        $sellerBreeder->setUser($sellerBreederUser);
        $sellerBreeder->setName('Élevage du Val');
        $sellerBreeder->setType('breeder');
        $sellerBreeder->setSiret('12345678901234');
        $sellerBreeder->setDescription("Éleveur passionné depuis 15 ans, spécialisé dans les chiens de race et les chats. Tous nos animaux sont élevés avec amour dans un cadre familial.");
        $sellerBreeder->setCity('Lyon');
        $sellerBreeder->setPostalCode('69001');
        $sellerBreeder->setAddress('12 rue des Fleurs');
        $sellerBreeder->setVerifiedStatus('approved');
        $em->persist($sellerBreeder);
        $this->addReference(self::SELLER_BREEDER_REF, $sellerBreeder);

        // ── Vendeur animalerie (approuvée) ────────────────────────────────────
        $sellerShopUser = $this->makeUser('animalerie@compawgnon.fr', 'Seller1234!', ['ROLE_USER', 'ROLE_SELLER'], 'Marc', 'Dubois');
        $em->persist($sellerShopUser);

        $sellerShop = new Seller();
        $sellerShop->setUser($sellerShopUser);
        $sellerShop->setName('Animalerie des Alpes');
        $sellerShop->setType('pet_shop');
        $sellerShop->setSiret('98765432109876');
        $sellerShop->setDescription("Animalerie de confiance depuis 2010, proposant une large sélection d'animaux de compagnie en bonne santé.");
        $sellerShop->setCity('Grenoble');
        $sellerShop->setPostalCode('38000');
        $sellerShop->setAddress('45 avenue Victor Hugo');
        $sellerShop->setVerifiedStatus('approved');
        $em->persist($sellerShop);
        $this->addReference(self::SELLER_SHOP_REF, $sellerShop);

        // ── Vendeur en attente ────────────────────────────────────────────────
        $sellerPendingUser = $this->makeUser('vendeur-pending@compawgnon.fr', 'Seller1234!', ['ROLE_USER'], 'Paul', 'Renard');
        $em->persist($sellerPendingUser);

        $sellerPending = new Seller();
        $sellerPending->setUser($sellerPendingUser);
        $sellerPending->setName('Refuge du Bonheur');
        $sellerPending->setType('breeder');
        $sellerPending->setSiret('11223344556677');
        $sellerPending->setCity('Paris');
        $sellerPending->setPostalCode('75011');
        $sellerPending->setVerifiedStatus('pending');
        $em->persist($sellerPending);
        $this->addReference(self::SELLER_PENDING_REF, $sellerPending);

        // ── Acheteurs ─────────────────────────────────────────────────────────
        $buyers = [
            [self::BUYER_1_REF, 'marie@example.com',   'User1234!', 'Marie',   'Dupont'],
            [self::BUYER_2_REF, 'thomas@example.com',  'User1234!', 'Thomas',  'Bernard'],
            [self::BUYER_3_REF, 'camille@example.com', 'User1234!', 'Camille', 'Leroy'],
        ];

        foreach ($buyers as [$ref, $email, $pass, $first, $last]) {
            $buyer = $this->makeUser($email, $pass, ['ROLE_USER'], $first, $last);
            $em->persist($buyer);
            $this->addReference($ref, $buyer);
        }

        $em->flush();
    }

    private function makeUser(string $email, string $password, array $roles, string $first, string $last): User
    {
        $user = new User();
        $user->setEmail($email);
        $user->setPasswordHash($this->hasher->hashPassword($user, $password));
        $user->setRoles($roles);
        $user->setStatus('active');
        $user->setFirstName($first);
        $user->setLastName($last);
        $user->setTermsAcceptedAt(new \DateTimeImmutable());
        $user->setEmailVerifiedAt(new \DateTimeImmutable());
        return $user;
    }
}
