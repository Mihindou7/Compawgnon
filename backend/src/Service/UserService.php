<?php

namespace App\Service;

use App\DTO\User\UpdateProfileDTO;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class UserService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserPasswordHasherInterface $hasher,
        private readonly AuthService $authService,
        private readonly AuditService $audit,
        private readonly UploadService $uploadService,
    ) {
    }

    public function updateProfile(User $user, UpdateProfileDTO $dto): User
    {
        if ($dto->firstName !== null) $user->setFirstName($dto->firstName);
        if ($dto->lastName !== null)  $user->setLastName($dto->lastName);
        if ($dto->phone !== null)     $user->setPhone($dto->phone);

        $user->setUpdatedAt(new \DateTimeImmutable());
        $this->em->flush();

        return $user;
    }

    public function changePassword(User $user, string $newPassword): void
    {
        $user->setPasswordHash($this->hasher->hashPassword($user, $newPassword));
        $user->setUpdatedAt(new \DateTimeImmutable());
        $this->em->flush();

        $this->authService->revokeAllRefreshTokens($user);
    }

    public function updateAvatar(User $user, \Symfony\Component\HttpFoundation\File\UploadedFile $file): string
    {
        if ($user->getAvatarUrl()) {
            $this->uploadService->delete($user->getAvatarUrl());
        }

        $url = $this->uploadService->uploadAvatar($file);
        $user->setAvatarUrl($url);
        $user->setUpdatedAt(new \DateTimeImmutable());
        $this->em->flush();

        return $url;
    }

    public function deleteAccount(User $user): void
    {
        $this->anonymize($user);
        $this->archiveSellerAnimals($user);
        $this->authService->revokeAllRefreshTokens($user);
        $this->em->flush();
    }

    public function toggleStatus(User $user, User $admin): array
    {
        if ($user->getId() === $admin->getId()) {
            throw new \DomainException('Cannot disable your own account.', 403);
        }

        $oldStatus = $user->getStatus();
        $newStatus = $oldStatus === 'active' ? 'disabled' : 'active';

        $user->setStatus($newStatus);
        $user->setUpdatedAt(new \DateTimeImmutable());

        $archivedCount = 0;
        if ($newStatus === 'disabled') {
            $archivedCount = $this->archiveSellerAnimals($user);
            $this->authService->revokeAllRefreshTokens($user);
        }

        $this->em->flush();

        $this->audit->log(
            $newStatus === 'disabled' ? 'user.disabled' : 'user.enabled',
            'User', $user->getId(), $admin,
            ['status' => $oldStatus],
            ['status' => $newStatus, 'archived_animals_count' => $archivedCount]
        );

        return ['status' => $newStatus, 'archived_animals_count' => $archivedCount];
    }

    public function anonymizeByAdmin(User $user, User $admin): void
    {
        if ($user->getId() === $admin->getId()) {
            throw new \DomainException('Cannot delete your own account.', 403);
        }

        $userId = $user->getId();
        $this->anonymize($user);
        $this->archiveSellerAnimals($user);
        $this->authService->revokeAllRefreshTokens($user);
        $this->em->flush();

        $this->audit->log('user.anonymized', 'User', $userId, $admin);
    }

    private function anonymize(User $user): void
    {
        $hash = substr(md5($user->getEmail() . $user->getId()), 0, 8);
        $user->setEmail("deleted_{$hash}@deleted.local");
        $user->setFirstName('Compte');
        $user->setLastName('Supprimé');
        $user->setPhone(null);
        $user->setAvatarUrl(null);
        $user->setPasswordHash(null);
        $user->setStatus('disabled');
        $user->setUpdatedAt(new \DateTimeImmutable());
    }

    private function archiveSellerAnimals(User $user): int
    {
        $count = 0;
        if ($user->getSeller()) {
            foreach ($user->getSeller()->getAnimals() as $animal) {
                if ($animal->getStatus() !== 'sold') {
                    $animal->setStatus('archived');
                    $animal->setUpdatedAt(new \DateTimeImmutable());
                    $count++;
                }
            }
        }
        return $count;
    }
}
