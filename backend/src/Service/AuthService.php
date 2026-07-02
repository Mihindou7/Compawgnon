<?php

namespace App\Service;

use App\DTO\Auth\RegisterDTO;
use App\Entity\RefreshToken;
use App\Entity\User;
use App\Repository\RefreshTokenRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Uid\Uuid;

class AuthService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly UserRepository $userRepository,
        private readonly RefreshTokenRepository $refreshTokenRepository,
        private readonly MailService $mailService,
        private readonly string $frontendUrl,
    ) {
    }

    public function register(RegisterDTO $dto): User
    {
        $user = new User();
        $user->setEmail($dto->email);
        $user->setPasswordHash($this->passwordHasher->hashPassword($user, $dto->password));
        $user->setRoles(['ROLE_USER']);
        $user->setStatus('active');
        $user->setTermsAcceptedAt(new \DateTimeImmutable());

        if ($dto->firstName !== null) {
            $user->setFirstName($dto->firstName);
        }
        if ($dto->lastName !== null) {
            $user->setLastName($dto->lastName);
        }

        // Vérification email désactivée temporairement (MAILER_DSN pas encore configuré en prod).
        $user->setEmailVerifiedAt(new \DateTimeImmutable());

        $this->em->persist($user);
        $this->em->flush();

        return $user;
    }

    public function verifyEmail(string $token): ?User
    {
        $user = $this->userRepository->findOneBy(['emailVerificationToken' => $token]);
        if ($user === null) {
            return null;
        }

        $user->setEmailVerifiedAt(new \DateTimeImmutable());
        $user->setEmailVerificationToken(null);
        $this->em->flush();

        return $user;
    }

    public function resendVerification(User $user): void
    {
        $token = $this->generateSecureToken();
        $user->setEmailVerificationToken($token);
        $this->em->flush();

        $url = $this->frontendUrl . '/auth/verify-email?token=' . $token;
        $this->mailService->sendVerificationEmail($user->getEmail(), $url);
    }

    public function requestPasswordReset(string $email): void
    {
        $user = $this->userRepository->findByEmail($email);
        if ($user === null || !$user->isActive()) {
            return; // silent — no enumeration
        }

        $token = $this->generateSecureToken();
        $user->setResetPasswordToken($token);
        $user->setResetPasswordTokenExpiresAt(new \DateTimeImmutable('+1 hour'));
        $this->em->flush();

        $url = $this->frontendUrl . '/reinitialiser-mot-de-passe?token=' . $token;
        $this->mailService->sendPasswordResetEmail($user->getEmail(), $url);
    }

    public function resetPassword(string $token, string $newPassword): ?User
    {
        $user = $this->userRepository->findOneBy(['resetPasswordToken' => $token]);
        if ($user === null) {
            return null;
        }

        $expiresAt = $user->getResetPasswordTokenExpiresAt();
        if ($expiresAt === null || $expiresAt < new \DateTimeImmutable()) {
            return null; // expired
        }

        $user->setPasswordHash($this->passwordHasher->hashPassword($user, $newPassword));
        $user->setResetPasswordToken(null);
        $user->setResetPasswordTokenExpiresAt(null);
        $this->em->flush();

        $this->revokeAllRefreshTokens($user);

        return $user;
    }

    public function revokeAllRefreshTokens(User $user): void
    {
        $tokens = $this->refreshTokenRepository->findBy(['username' => $user->getEmail()]);
        foreach ($tokens as $token) {
            $this->em->remove($token);
        }
        $this->em->flush();
    }

    private function generateSecureToken(): string
    {
        return bin2hex(random_bytes(32));
    }
}
