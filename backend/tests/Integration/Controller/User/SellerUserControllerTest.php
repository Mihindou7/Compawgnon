<?php

namespace App\Tests\Integration\Controller\User;

use App\Entity\Seller;
use App\Entity\User;
use App\Tests\Integration\AbstractIntegrationTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Tests d'intégration pour SellerUserController — /api/me/seller
 *
 * Routes couvertes :
 *   GET  /api/me/seller
 *   POST /api/me/seller/apply
 */
class SellerUserControllerTest extends AbstractIntegrationTestCase
{
    private const PASSWORD              = 'Test1234!';
    private const EMAIL_VERIFIED        = 'verified@test.com';
    private const EMAIL_UNVERIFIED      = 'unverified@test.com';

    private static array $applyPayload = [
        'name'        => 'Élevage du Soleil',
        'type'        => 'breeder',
        'siret'       => '12345678901234',
        'city'        => 'Lyon',
        'postal_code' => '69001',
    ];

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncateTables(['refresh_tokens', 'sellers', 'favorites', 'users']);
        $this->seedUsers();
    }

    // =========================================================================
    // GET /api/me/seller
    // =========================================================================

    public function testGetProfilVendeurNullSiAucunProfil(): void
    {
        $token = $this->loginAs(self::EMAIL_VERIFIED, self::PASSWORD)['token'];
        $this->get('/api/me/seller', $this->bearerHeader($token));

        $this->assertSame(200, $this->statusCode());
        $this->assertNull($this->json()['data']);
    }

    // =========================================================================
    // POST /api/me/seller/apply
    // =========================================================================

    public function testDemandeVendeurReussie(): void
    {
        $token = $this->loginAs(self::EMAIL_VERIFIED, self::PASSWORD)['token'];
        $this->post('/api/me/seller/apply', self::$applyPayload, $this->bearerHeader($token));

        $this->assertSame(201, $this->statusCode());

        $data = $this->json()['data'];
        $this->assertArrayHasKey('id', $data);
        $this->assertSame('pending', $data['verified_status']);

        // Le profil vendeur est bien créé en base
        $user = $this->em->getRepository(User::class)->findOneBy(['email' => self::EMAIL_VERIFIED]);
        $this->em->refresh($user);
        $this->assertNotNull($user->getSeller());
        $this->assertSame('pending', $user->getSeller()->getVerifiedStatus());
    }

    public function testDemandeVendeurEmailNonVerifie(): void
    {
        $token = $this->loginAs(self::EMAIL_UNVERIFIED, self::PASSWORD)['token'];
        $this->post('/api/me/seller/apply', self::$applyPayload, $this->bearerHeader($token));

        $this->assertSame(403, $this->statusCode());
        $this->assertStringContainsString('verification', strtolower($this->json()['error'] ?? ''));
    }

    public function testDemandeVendeurDoublonPending(): void
    {
        // Crée un profil vendeur pending pour l'utilisateur vérifié
        $user   = $this->em->getRepository(User::class)->findOneBy(['email' => self::EMAIL_VERIFIED]);
        $seller = $this->makeSellerFor($user, 'pending');
        $this->em->persist($seller);
        $this->em->flush();

        $token = $this->loginAs(self::EMAIL_VERIFIED, self::PASSWORD)['token'];
        $this->post('/api/me/seller/apply', self::$applyPayload, $this->bearerHeader($token));

        $this->assertSame(409, $this->statusCode());
    }

    public function testDemandeVendeurDoublonApprouve(): void
    {
        $user   = $this->em->getRepository(User::class)->findOneBy(['email' => self::EMAIL_VERIFIED]);
        $seller = $this->makeSellerFor($user, 'approved');
        $this->em->persist($seller);
        $this->em->flush();

        $token = $this->loginAs(self::EMAIL_VERIFIED, self::PASSWORD)['token'];
        $this->post('/api/me/seller/apply', self::$applyPayload, $this->bearerHeader($token));

        $this->assertSame(409, $this->statusCode());
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private function seedUsers(): void
    {
        $hasher = static::getContainer()->get(UserPasswordHasherInterface::class);

        // Utilisateur vérifié (peut faire une demande vendeur)
        $verified = new User();
        $verified->setEmail(self::EMAIL_VERIFIED);
        $verified->setPasswordHash($hasher->hashPassword($verified, self::PASSWORD));
        $verified->setRoles(['ROLE_USER']);
        $verified->setStatus('active');
        $verified->setTermsAcceptedAt(new \DateTimeImmutable());
        $verified->setEmailVerifiedAt(new \DateTimeImmutable());
        $this->em->persist($verified);

        // Utilisateur non vérifié (bloqué à 403)
        $unverified = new User();
        $unverified->setEmail(self::EMAIL_UNVERIFIED);
        $unverified->setPasswordHash($hasher->hashPassword($unverified, self::PASSWORD));
        $unverified->setRoles(['ROLE_USER']);
        $unverified->setStatus('active');
        $unverified->setTermsAcceptedAt(new \DateTimeImmutable());
        // emailVerifiedAt intentionnellement absent → isEmailVerified() = false
        $this->em->persist($unverified);

        $this->em->flush();
    }

    private function makeSellerFor(User $user, string $status): Seller
    {
        $seller = new Seller();
        $seller->setUser($user);
        $seller->setName('Test Élevage');
        $seller->setType('breeder');
        $seller->setSiret('12345678901234');
        $seller->setCity('Paris');
        $seller->setPostalCode('75001');
        $seller->setVerifiedStatus($status);

        return $seller;
    }
}
