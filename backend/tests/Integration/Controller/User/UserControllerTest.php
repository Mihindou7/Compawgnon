<?php

namespace App\Tests\Integration\Controller\User;

use App\Entity\User;
use App\Tests\Integration\AbstractIntegrationTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Tests d'intégration pour UserController — /api/me
 *
 * Routes couvertes :
 *   GET    /api/me
 *   PATCH  /api/me
 *   PATCH  /api/me/password
 *   DELETE /api/me
 */
class UserControllerTest extends AbstractIntegrationTestCase
{
    private const PASSWORD = 'Test1234!';
    private const EMAIL    = 'user@test.com';

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncateTables(['refresh_tokens', 'sellers', 'favorites', 'users']);
        $this->seedUser();
    }

    // =========================================================================
    // GET /api/me
    // =========================================================================

    public function testGetProfilAuthentifie(): void
    {
        $token = $this->getToken();
        $this->get('/api/me', $this->bearerHeader($token));

        $this->assertSame(200, $this->statusCode());

        $data = $this->json()['data'];
        $this->assertSame(self::EMAIL, $data['email']);
        $this->assertArrayHasKey('first_name', $data);
        $this->assertArrayHasKey('roles', $data);
        $this->assertArrayHasKey('is_verified', $data);
        $this->assertArrayHasKey('status', $data);
        $this->assertTrue($data['is_verified']);
    }

    public function testGetProfilSansToken(): void
    {
        $this->get('/api/me');
        $this->assertSame(401, $this->statusCode());
    }

    // =========================================================================
    // PATCH /api/me
    // =========================================================================

    public function testMiseAJourProfil(): void
    {
        $token = $this->getToken();
        $this->patch('/api/me', [
            'firstName' => 'Alice',
            'lastName'  => 'Martin',
            'phone'     => '0612345678',
        ], $this->bearerHeader($token));

        $this->assertSame(200, $this->statusCode());

        $data = $this->json()['data'];
        $this->assertSame('Alice', $data['first_name']);
        $this->assertSame('Martin', $data['last_name']);
        $this->assertSame('0612345678', $data['phone']);
    }

    public function testMiseAJourProfilPartielle(): void
    {
        $token = $this->getToken();
        $this->patch('/api/me', ['firstName' => 'Bob'], $this->bearerHeader($token));

        $this->assertSame(200, $this->statusCode());
        $this->assertSame('Bob', $this->json()['data']['first_name']);
    }

    // =========================================================================
    // PATCH /api/me/password
    // =========================================================================

    public function testChangementMotDePasseValide(): void
    {
        $loginData    = $this->loginAs(self::EMAIL, self::PASSWORD);
        $token        = $loginData['token'];
        $refreshToken = $loginData['refresh_token'];

        $this->patch('/api/me/password', [
            'currentPassword'    => self::PASSWORD,
            'newPassword'        => 'NouveauMdp1!',
            'newPasswordConfirm' => 'NouveauMdp1!',
        ], $this->bearerHeader($token));

        $this->assertSame(200, $this->statusCode());

        // Le changement de mot de passe révoque tous les refresh tokens existants
        $this->post('/api/auth/token/refresh', ['refresh_token' => $refreshToken]);
        $this->assertSame(401, $this->statusCode());
    }

    public function testChangementMotDePasseMauvaisActuel(): void
    {
        $token = $this->getToken();
        $this->patch('/api/me/password', [
            'currentPassword'    => 'MotDePasseErrone99!',
            'newPassword'        => 'NouveauMdp1!',
            'newPasswordConfirm' => 'NouveauMdp1!',
        ], $this->bearerHeader($token));

        $this->assertSame(400, $this->statusCode());
    }

    public function testChangementMotDePasseMismatch(): void
    {
        $token = $this->getToken();
        $this->patch('/api/me/password', [
            'currentPassword'    => self::PASSWORD,
            'newPassword'        => 'NouveauMdp1!',
            'newPasswordConfirm' => 'AutreMdp99!',
        ], $this->bearerHeader($token));

        $this->assertSame(422, $this->statusCode());
    }

    // =========================================================================
    // DELETE /api/me
    // =========================================================================

    public function testSuppressionCompteRGPD(): void
    {
        $token  = $this->getToken();
        $user   = $this->em->getRepository(User::class)->findOneBy(['email' => self::EMAIL]);
        $userId = $user->getId();

        $this->delete('/api/me', ['password' => self::PASSWORD], $this->bearerHeader($token));

        $this->assertSame(204, $this->statusCode());

        // L'utilisateur est anonymisé, pas supprimé physiquement
        $this->em->clear();
        $anonymized = $this->em->getRepository(User::class)->find($userId);
        $this->assertNotNull($anonymized);
        $this->assertStringStartsWith('deleted_', $anonymized->getEmail());
        $this->assertSame('disabled', $anonymized->getStatus());
        $this->assertNull($anonymized->getPasswordHash());
    }

    public function testSuppressionCompteMauvaisMotDePasse(): void
    {
        $token = $this->getToken();
        $this->delete('/api/me', ['password' => 'MauvaisMotDePasse99!'], $this->bearerHeader($token));

        $this->assertSame(400, $this->statusCode());

        // Le compte n'est pas anonymisé
        $user = $this->em->getRepository(User::class)->findOneBy(['email' => self::EMAIL]);
        $this->assertNotNull($user);
        $this->assertSame('active', $user->getStatus());
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private function getToken(): string
    {
        return $this->loginAs(self::EMAIL, self::PASSWORD)['token'];
    }

    private function seedUser(): void
    {
        $hasher = static::getContainer()->get(UserPasswordHasherInterface::class);

        $user = new User();
        $user->setEmail(self::EMAIL);
        $user->setPasswordHash($hasher->hashPassword($user, self::PASSWORD));
        $user->setRoles(['ROLE_USER']);
        $user->setStatus('active');
        $user->setFirstName('Jean');
        $user->setLastName('Dupont');
        $user->setTermsAcceptedAt(new \DateTimeImmutable());
        $user->setEmailVerifiedAt(new \DateTimeImmutable());
        $this->em->persist($user);
        $this->em->flush();
    }
}
