<?php

namespace App\Tests\Unit\Service;

use App\DTO\Auth\RegisterDTO;
use App\Entity\RefreshToken;
use App\Entity\User;
use App\Repository\RefreshTokenRepository;
use App\Repository\UserRepository;
use App\Service\AuthService;
use App\Service\MailService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AuthServiceTest extends TestCase
{
    private MockObject&EntityManagerInterface $em;
    private UserPasswordHasherInterface $passwordHasher;
    private MockObject&UserRepository $userRepository;
    private MockObject&RefreshTokenRepository $refreshTokenRepository;
    private MockObject&MailService $mailService;
    private AuthService $authService;

    protected function setUp(): void
    {
        $this->em                     = $this->createMock(EntityManagerInterface::class);
        $this->passwordHasher         = $this->createStub(UserPasswordHasherInterface::class);
        $this->userRepository         = $this->createMock(UserRepository::class);
        $this->refreshTokenRepository = $this->createMock(RefreshTokenRepository::class);
        $this->mailService            = $this->createMock(MailService::class);

        $this->authService = new AuthService(
            $this->em,
            $this->passwordHasher,
            $this->userRepository,
            $this->refreshTokenRepository,
            $this->mailService,
            'http://localhost:3000',
        );
    }

    // =========================================================================
    // register()
    // =========================================================================

    public function testRegisterLeveUneExceptionSiEmailExisteDejaEnBase(): void
    {
        // La vérification d'unicité côté service provient de la contrainte DB.
        // On simule la violation de contrainte unique lors du flush().
        $dto = $this->makeRegisterDTO('existing@test.com');
        $this->passwordHasher->method('hashPassword')->willReturn('hashed');
        $this->em->method('flush')
            ->willThrowException(new \RuntimeException('SQLSTATE[23000]: Duplicate entry'));
        $this->mailService->expects($this->never())->method('sendVerificationEmail');

        $this->expectException(\RuntimeException::class);
        $this->authService->register($dto);
    }

    public function testRegisterCreerUnUserAvecRoleUserEtEmailAutoVerifie(): void
    {
        // Vérification email désactivée temporairement : pas d'envoi de mail,
        // l'utilisateur est vérifié immédiatement à l'inscription.
        $dto = $this->makeRegisterDTO('new@test.com', 'Jean', 'Dupont');
        $this->passwordHasher->method('hashPassword')->willReturn('hashed_password');
        $this->em->expects($this->once())->method('persist')->with($this->isInstanceOf(User::class));
        $this->em->expects($this->once())->method('flush');
        $this->mailService->expects($this->never())->method('sendVerificationEmail');

        $user = $this->authService->register($dto);

        $this->assertSame('new@test.com', $user->getEmail());
        $this->assertContains('ROLE_USER', $user->getRoles());
        $this->assertTrue($user->isEmailVerified());
        $this->assertNull($user->getEmailVerificationToken());
        $this->assertSame('Jean', $user->getFirstName());
        $this->assertSame('Dupont', $user->getLastName());
    }

    // =========================================================================
    // verifyEmail()
    // =========================================================================

    public function testVerifyEmailRetourneNullSurTokenInvalide(): void
    {
        $this->userRepository
            ->expects($this->once())
            ->method('findOneBy')
            ->with(['emailVerificationToken' => 'invalid-token'])
            ->willReturn(null);

        $this->assertNull($this->authService->verifyEmail('invalid-token'));
    }

    public function testVerifyEmailMetAJourEmailVerifiedAtSurTokenValide(): void
    {
        $user = new User();
        $user->setEmail('user@test.com');
        $user->setEmailVerificationToken('valid-token');

        $this->userRepository
            ->expects($this->once())
            ->method('findOneBy')
            ->with(['emailVerificationToken' => 'valid-token'])
            ->willReturn($user);
        $this->em->expects($this->once())->method('flush');

        $result = $this->authService->verifyEmail('valid-token');

        $this->assertSame($user, $result);
        $this->assertInstanceOf(\DateTimeImmutable::class, $user->getEmailVerifiedAt());
        $this->assertNull($user->getEmailVerificationToken());
    }

    // =========================================================================
    // requestPasswordReset()
    // =========================================================================

    public function testRequestPasswordResetEstSilencieuxSiEmailInexistant(): void
    {
        $this->userRepository->expects($this->once())->method('findByEmail')->with('nobody@test.com')->willReturn(null);
        $this->em->expects($this->never())->method('flush');
        $this->mailService->expects($this->never())->method('sendPasswordResetEmail');

        // Aucune exception attendue — comportement anti-énumération
        $this->authService->requestPasswordReset('nobody@test.com');
        $this->addToAssertionCount(1);
    }

    // =========================================================================
    // resetPassword()
    // =========================================================================

    public function testResetPasswordRetourneNullSurTokenInvalide(): void
    {
        $this->userRepository
            ->expects($this->once())
            ->method('findOneBy')
            ->with(['resetPasswordToken' => 'bad-token'])
            ->willReturn(null);

        $this->assertNull($this->authService->resetPassword('bad-token', 'NewPassword1'));
    }

    public function testResetPasswordRetourneNullSurTokenExpire(): void
    {
        $user = new User();
        $user->setEmail('user@test.com');
        $user->setResetPasswordToken('expired-token');
        $user->setResetPasswordTokenExpiresAt(new \DateTimeImmutable('-1 hour'));

        $this->userRepository
            ->expects($this->once())
            ->method('findOneBy')
            ->with(['resetPasswordToken' => 'expired-token'])
            ->willReturn($user);
        $this->em->expects($this->never())->method('flush');

        $this->assertNull($this->authService->resetPassword('expired-token', 'NewPassword1'));
    }

    public function testResetPasswordChangeLeMdpEtRevoqueLesRefreshTokens(): void
    {
        $user = new User();
        $user->setEmail('user@test.com');
        $user->setResetPasswordToken('valid-token');
        $user->setResetPasswordTokenExpiresAt(new \DateTimeImmutable('+1 hour'));

        $refreshToken1 = new RefreshToken();
        $refreshToken2 = new RefreshToken();

        $this->userRepository->expects($this->once())->method('findOneBy')->willReturn($user);
        $this->passwordHasher->method('hashPassword')->willReturn('new_hashed_password');
        $this->refreshTokenRepository
            ->expects($this->once())
            ->method('findBy')
            ->with(['username' => 'user@test.com'])
            ->willReturn([$refreshToken1, $refreshToken2]);

        // flush() appelé 2 fois : après le changement de mot de passe, puis après la révocation
        $this->em->expects($this->exactly(2))->method('flush');
        // remove() appelé une fois par refresh token
        $this->em->expects($this->exactly(2))->method('remove');

        $result = $this->authService->resetPassword('valid-token', 'NewPassword1');

        $this->assertSame($user, $result);
        $this->assertSame('new_hashed_password', $user->getPasswordHash());
        $this->assertNull($user->getResetPasswordToken());
        $this->assertNull($user->getResetPasswordTokenExpiresAt());
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private function makeRegisterDTO(
        string $email,
        ?string $firstName = null,
        ?string $lastName = null,
    ): RegisterDTO {
        $dto = new RegisterDTO();
        $dto->email = $email;
        $dto->password = 'Password1';
        $dto->firstName = $firstName;
        $dto->lastName = $lastName;
        $dto->termsAccepted = true;

        return $dto;
    }
}
