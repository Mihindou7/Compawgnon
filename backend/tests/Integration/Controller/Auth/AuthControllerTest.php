<?php

namespace App\Tests\Integration\Controller\Auth;

use App\Entity\RefreshToken;
use App\Entity\User;
use App\Tests\Integration\AbstractIntegrationTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Tests d'intégration pour AuthController + firewall json_login + token/refresh.
 *
 * Chaque test repart d'un état DB propre (truncate + seed minimal).
 * Coût bcrypt réduit à 4 en environnement test (security.yaml when@test).
 */
class AuthControllerTest extends AbstractIntegrationTestCase
{
    private const PASSWORD      = 'Test1234!';
    private const EMAIL_BUYER   = 'buyer@test.com';
    private const EMAIL_DISABLED = 'disabled@test.com';

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncateTables(['refresh_tokens', 'sellers', 'favorites', 'users']);
        $this->seedUsers();
    }

    // =========================================================================
    // POST /api/auth/register
    // =========================================================================

    public function testInscriptionReussie(): void
    {
        $this->post('/api/auth/register', [
            'email'         => 'nouveau@test.com',
            'password'      => self::PASSWORD,
            'termsAccepted' => true,
        ]);

        $this->assertSame(201, $this->statusCode());

        $data = $this->json();
        $this->assertArrayHasKey('data', $data);
        $this->assertStringContainsString('vérification', $data['data']['message']);

        // L'utilisateur est bien en base, email non vérifié
        $user = $this->em->getRepository(User::class)->findOneBy(['email' => 'nouveau@test.com']);
        $this->assertNotNull($user);
        $this->assertFalse($user->isEmailVerified());
        $this->assertNotNull($user->getEmailVerificationToken());
    }

    public function testInscriptionEmailDejaUtilise(): void
    {
        // Note : la contrainte UniqueEmail est portée par le validateur DTO,
        // ce qui produit 422 (violations) plutôt que 409 (conflit HTTP).
        // Ce comportement est celui du code — la doc API indique 409 par abus.
        $this->post('/api/auth/register', [
            'email'         => self::EMAIL_BUYER, // email déjà en base
            'password'      => self::PASSWORD,
            'termsAccepted' => true,
        ]);

        $this->assertSame(422, $this->statusCode());

        $data = $this->json();
        $this->assertArrayHasKey('violations', $data);
        $this->assertArrayHasKey('email', $data['violations']);
    }

    public function testInscriptionMotDePasseTropFaible(): void
    {
        $this->post('/api/auth/register', [
            'email'         => 'faible@test.com',
            'password'      => 'abc',            // trop court, pas de maj, pas de chiffre
            'termsAccepted' => true,
        ]);

        $this->assertSame(422, $this->statusCode());

        $data = $this->json();
        $this->assertArrayHasKey('violations', $data);
        $this->assertArrayHasKey('password', $data['violations']);
    }

    // =========================================================================
    // POST /api/auth/login
    // =========================================================================

    public function testLoginValide(): void
    {
        $data = $this->loginAs(self::EMAIL_BUYER, self::PASSWORD);

        $this->assertSame(200, $this->statusCode());
        $this->assertArrayHasKey('token', $data);
        $this->assertArrayHasKey('refresh_token', $data);
        $this->assertNotEmpty($data['token']);
        $this->assertNotEmpty($data['refresh_token']);
    }

    public function testLoginMauvaisMotDePasse(): void
    {
        $this->loginAs(self::EMAIL_BUYER, 'MauvaisMotDePasse99!');

        $this->assertSame(401, $this->statusCode());
    }

    public function testCompteDesactiveJwtRejete(): void
    {
        // Le firewall json_login n'a pas de UserChecker bloquant les comptes désactivés :
        // le token est émis, mais l'AccountDisabledListener le rejette à chaque utilisation.
        $loginData = $this->loginAs(self::EMAIL_DISABLED, self::PASSWORD);
        $this->assertArrayHasKey('token', $loginData, 'Le login doit retourner un token même pour un compte désactivé');

        // Toute requête authentifiée avec ce token est rejetée
        $this->get('/api/me', $this->bearerHeader($loginData['token']));

        $this->assertSame(401, $this->statusCode());

        $data = $this->json();
        // Les rejets JWT passent par LexikJWT AuthenticationFailureHandler → {"code":401,"message":"..."}
        // et non par ApiExceptionListener → {"error":"..."}
        $message = strtolower($data['message'] ?? $data['error'] ?? '');
        $this->assertStringContainsString('disabled', $message);
    }

    // =========================================================================
    // POST /api/auth/token/refresh
    // =========================================================================

    public function testRefreshTokenValide(): void
    {
        $loginData = $this->loginAs(self::EMAIL_BUYER, self::PASSWORD);
        $refreshToken = $loginData['refresh_token'];

        $this->post('/api/auth/token/refresh', ['refresh_token' => $refreshToken]);

        $this->assertSame(200, $this->statusCode());

        $data = $this->json();
        $this->assertArrayHasKey('token', $data);
        $this->assertArrayHasKey('refresh_token', $data);
    }

    public function testRefreshTokenExpire(): void
    {
        // Insère directement un refresh token expiré en base
        $expired = new RefreshToken();
        $expired->setRefreshToken(bin2hex(random_bytes(32)));
        $expired->setUsername(self::EMAIL_BUYER);
        $expired->setValid(new \DateTime('-1 hour')); // expiré

        $this->em->persist($expired);
        $this->em->flush();

        $this->post('/api/auth/token/refresh', ['refresh_token' => $expired->getRefreshToken()]);

        $this->assertSame(401, $this->statusCode());
    }

    // =========================================================================
    // GET /api/auth/verify-email
    // =========================================================================

    public function testVerificationEmailTokenValide(): void
    {
        // Crée un utilisateur avec un token de vérification en attente
        $token = bin2hex(random_bytes(32));
        $user  = $this->makeUnverifiedUser('unverified@test.com', $token);
        $this->em->persist($user);
        $this->em->flush();

        $this->get('/api/auth/verify-email?token=' . $token);

        $this->assertSame(200, $this->statusCode());

        $data = $this->json();
        $this->assertArrayHasKey('data', $data);
        $this->assertArrayHasKey('access_token', $data['data']);
        $this->assertArrayHasKey('refresh_token', $data['data']);

        // L'email est bien marqué comme vérifié
        $this->em->refresh($user);
        $this->assertTrue($user->isEmailVerified());
        $this->assertNull($user->getEmailVerificationToken());
    }

    public function testVerificationEmailTokenInvalide(): void
    {
        $this->get('/api/auth/verify-email?token=token-inexistant-xyz');

        $this->assertSame(410, $this->statusCode());
    }

    // =========================================================================
    // POST /api/auth/forgot-password
    // =========================================================================

    public function testMotDePasseOubliAntiEnumeration(): void
    {
        // Email inexistant → toujours 200 (anti-énumération)
        $this->post('/api/auth/forgot-password', ['email' => 'personne@test.com']);
        $this->assertSame(200, $this->statusCode());

        // Email existant → toujours 200
        $this->post('/api/auth/forgot-password', ['email' => self::EMAIL_BUYER]);
        $this->assertSame(200, $this->statusCode());

        // Le token de reset est généré pour l'utilisateur existant
        $user = $this->em->getRepository(User::class)->findOneBy(['email' => self::EMAIL_BUYER]);
        $this->em->refresh($user);
        $this->assertNotNull($user->getResetPasswordToken());
    }

    // =========================================================================
    // POST /api/auth/reset-password
    // =========================================================================

    public function testResetPasswordValide(): void
    {
        $token = bin2hex(random_bytes(32));
        $user  = $this->em->getRepository(User::class)->findOneBy(['email' => self::EMAIL_BUYER]);
        $user->setResetPasswordToken($token);
        $user->setResetPasswordTokenExpiresAt(new \DateTimeImmutable('+1 hour'));
        $this->em->flush();

        $this->post('/api/auth/reset-password', [
            'token'           => $token,
            'password'        => 'NouveauMdp1!',
            'passwordConfirm' => 'NouveauMdp1!',
        ]);

        $this->assertSame(200, $this->statusCode());

        $data = $this->json();
        $this->assertStringContainsString('succès', $data['data']['message']);

        // Le token est révoqué après reset
        $this->em->refresh($user);
        $this->assertNull($user->getResetPasswordToken());
    }

    public function testResetPasswordTokenInvalide(): void
    {
        $this->post('/api/auth/reset-password', [
            'token'           => 'token-invalide-xyz',
            'password'        => 'NouveauMdp1!',
            'passwordConfirm' => 'NouveauMdp1!',
        ]);

        $this->assertSame(410, $this->statusCode());
    }

    public function testResetPasswordTokenExpire(): void
    {
        $token = bin2hex(random_bytes(32));
        $user  = $this->em->getRepository(User::class)->findOneBy(['email' => self::EMAIL_BUYER]);
        $user->setResetPasswordToken($token);
        $user->setResetPasswordTokenExpiresAt(new \DateTimeImmutable('-1 hour')); // expiré
        $this->em->flush();

        $this->post('/api/auth/reset-password', [
            'token'           => $token,
            'password'        => 'NouveauMdp1!',
            'passwordConfirm' => 'NouveauMdp1!',
        ]);

        $this->assertSame(410, $this->statusCode());
    }

    public function testResetPasswordPasswordsNeCorespondentPas(): void
    {
        // Le controller vérifie la correspondance AVANT de valider le token
        $this->post('/api/auth/reset-password', [
            'token'           => 'peu-importe',
            'password'        => 'NouveauMdp1!',
            'passwordConfirm' => 'AutreMdp99!',
        ]);

        $this->assertSame(422, $this->statusCode());

        $data = $this->json();
        $this->assertStringContainsString('match', strtolower($data['error'] ?? ''));
    }

    // =========================================================================
    // POST /api/auth/logout
    // =========================================================================

    public function testLogoutInvalidationRefreshToken(): void
    {
        // 1. Login → obtenir un refresh token
        $loginData    = $this->loginAs(self::EMAIL_BUYER, self::PASSWORD);
        $refreshToken = $loginData['refresh_token'];
        $accessToken  = $loginData['token'];

        // 2. Logout avec ce refresh token
        $this->post('/api/auth/logout', ['refresh_token' => $refreshToken], $this->bearerHeader($accessToken));
        $this->assertSame(204, $this->statusCode());

        // 3. Le refresh token est invalidé → 401
        $this->post('/api/auth/token/refresh', ['refresh_token' => $refreshToken]);
        $this->assertSame(401, $this->statusCode());
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private function seedUsers(): void
    {
        $hasher = static::getContainer()->get(UserPasswordHasherInterface::class);

        // Utilisateur standard vérifié
        $buyer = new User();
        $buyer->setEmail(self::EMAIL_BUYER);
        $buyer->setPasswordHash($hasher->hashPassword($buyer, self::PASSWORD));
        $buyer->setRoles(['ROLE_USER']);
        $buyer->setStatus('active');
        $buyer->setTermsAcceptedAt(new \DateTimeImmutable());
        $buyer->setEmailVerifiedAt(new \DateTimeImmutable());
        $this->em->persist($buyer);

        // Utilisateur désactivé
        $disabled = new User();
        $disabled->setEmail(self::EMAIL_DISABLED);
        $disabled->setPasswordHash($hasher->hashPassword($disabled, self::PASSWORD));
        $disabled->setRoles(['ROLE_USER']);
        $disabled->setStatus('disabled');
        $disabled->setTermsAcceptedAt(new \DateTimeImmutable());
        $disabled->setEmailVerifiedAt(new \DateTimeImmutable());
        $this->em->persist($disabled);

        $this->em->flush();
    }

    private function makeUnverifiedUser(string $email, string $verificationToken): User
    {
        $hasher = static::getContainer()->get(UserPasswordHasherInterface::class);

        $user = new User();
        $user->setEmail($email);
        $user->setPasswordHash($hasher->hashPassword($user, self::PASSWORD));
        $user->setRoles(['ROLE_USER']);
        $user->setStatus('active');
        $user->setTermsAcceptedAt(new \DateTimeImmutable());
        $user->setEmailVerificationToken($verificationToken);

        return $user;
    }
}
