<?php

namespace App\Service;

use App\Entity\User;
use App\Entity\UserAuthProvider;
use App\Repository\UserAuthProviderRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;

class GoogleAuthService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserRepository $userRepository,
        private readonly UserAuthProviderRepository $authProviderRepository,
    ) {
    }

    /**
     * Verifies a Google access token by calling Google's userinfo endpoint.
     * Returns the user profile payload on success, throws on failure.
     *
     * @return array{sub: string, email: string, email_verified: bool, name: string, given_name?: string, family_name?: string, picture?: string}
     */
    public function verifyAccessToken(string $accessToken): array
    {
        $context = stream_context_create([
            'http' => [
                'method'  => 'GET',
                'header'  => 'Authorization: Bearer ' . $accessToken,
                'timeout' => 5,
                'ignore_errors' => true,
            ],
        ]);

        $response = @file_get_contents('https://www.googleapis.com/oauth2/v3/userinfo', false, $context);

        if ($response === false) {
            throw new \RuntimeException('Could not reach Google API.', 503);
        }

        $payload = json_decode($response, true);

        if (!is_array($payload) || isset($payload['error']) || empty($payload['sub'])) {
            throw new \RuntimeException('Invalid or expired Google access token.', 401);
        }

        if (empty($payload['email'])) {
            throw new \RuntimeException('Google account has no email address.', 422);
        }

        return $payload;
    }

    /**
     * Finds an existing user by Google provider record or by email,
     * or creates a new user. Links the Google provider if not already done.
     */
    public function findOrCreate(array $payload): User
    {
        $googleId = $payload['sub'];
        $email    = $payload['email'];

        // 1. Find by existing Google provider link
        $providerRecord = $this->authProviderRepository->findByProvider('google', $googleId);
        if ($providerRecord !== null) {
            $this->updateProvider($providerRecord, $payload);
            $this->em->flush();
            return $providerRecord->getUser();
        }

        // 2. Find by email (user registered manually before)
        $user = $this->userRepository->findOneBy(['email' => $email]);
        if ($user === null) {
            // 3. Create new user — email already verified by Google
            $user = new User();
            $user->setEmail($email);
            $user->setPasswordHash(null);
            $user->setRoles(['ROLE_USER']);
            $user->setStatus('active');
            $user->setTermsAcceptedAt(new \DateTimeImmutable());
            $user->setEmailVerifiedAt(new \DateTimeImmutable());

            if (!empty($payload['given_name'])) {
                $user->setFirstName($payload['given_name']);
            }
            if (!empty($payload['family_name'])) {
                $user->setLastName($payload['family_name']);
            }
            if (!empty($payload['picture'])) {
                $user->setAvatarUrl($payload['picture']);
            }

            $this->em->persist($user);
        } else {
            // Fill missing profile fields
            if ($user->getFirstName() === null && !empty($payload['given_name'])) {
                $user->setFirstName($payload['given_name']);
            }
            if ($user->getLastName() === null && !empty($payload['family_name'])) {
                $user->setLastName($payload['family_name']);
            }
            if ($user->getAvatarUrl() === null && !empty($payload['picture'])) {
                $user->setAvatarUrl($payload['picture']);
            }
            if (!$user->isEmailVerified()) {
                $user->setEmailVerifiedAt(new \DateTimeImmutable());
            }
        }

        // Link Google provider
        $provider = new UserAuthProvider();
        $provider->setUser($user);
        $provider->setProvider('google');
        $provider->setProviderUserId($googleId);
        $provider->setProviderEmail($email);
        $provider->setProviderEmailVerified(true);
        $provider->setDisplayName($payload['name'] ?? null);
        $provider->setAvatarUrl($payload['picture'] ?? null);
        $provider->setLastUsedAt(new \DateTimeImmutable());

        $this->em->persist($provider);
        $this->em->flush();

        return $user;
    }

    private function updateProvider(UserAuthProvider $provider, array $payload): void
    {
        $provider->setLastUsedAt(new \DateTimeImmutable());
        if (!empty($payload['name']))    $provider->setDisplayName($payload['name']);
        if (!empty($payload['picture'])) $provider->setAvatarUrl($payload['picture']);
    }
}
