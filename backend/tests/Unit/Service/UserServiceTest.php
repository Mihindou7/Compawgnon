<?php

namespace App\Tests\Unit\Service;

use App\Entity\Animal;
use App\Entity\Seller;
use App\Entity\User;
use App\Service\AuditService;
use App\Service\AuthService;
use App\Service\UploadService;
use App\Service\UserService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class UserServiceTest extends TestCase
{
    private MockObject&EntityManagerInterface $em;
    private UserPasswordHasherInterface $hasher;
    private MockObject&AuthService $authService;
    private AuditService $audit;
    private UploadService $uploadService;
    private UserService $service;

    protected function setUp(): void
    {
        $this->em            = $this->createMock(EntityManagerInterface::class);
        $this->hasher        = $this->createStub(UserPasswordHasherInterface::class);
        $this->authService   = $this->createMock(AuthService::class);
        $this->audit         = $this->createStub(AuditService::class);
        $this->uploadService = $this->createStub(UploadService::class);

        $this->service = new UserService(
            $this->em,
            $this->hasher,
            $this->authService,
            $this->audit,
            $this->uploadService,
        );
    }

    // =========================================================================
    // toggleStatus()
    // =========================================================================

    public function testToggleStatusPasseUnUserActiveEnDisabled(): void
    {
        // IDs différents via réflexion : null === null = true lèverait une exception
        $user  = $this->makeUser('user@test.com');
        $admin = $this->makeUser('admin@test.com');
        $this->setProperty($user,  'id', 1);
        $this->setProperty($admin, 'id', 2);

        // user->getSeller() = null par défaut → archiveSellerAnimals retourne 0

        $this->em->expects($this->once())->method('flush');
        $this->authService->expects($this->once())->method('revokeAllRefreshTokens')->with($user);

        $result = $this->service->toggleStatus($user, $admin);

        $this->assertSame('disabled', $user->getStatus());
        $this->assertSame(['status' => 'disabled', 'archived_animals_count' => 0], $result);
    }

    public function testToggleStatusArchiveLesAnnoncesVendeurSiDesactive(): void
    {
        $user  = $this->makeUser('seller@test.com');
        $admin = $this->makeUser('admin@test.com');
        $this->setProperty($user,  'id', 1);
        $this->setProperty($admin, 'id', 2);

        // Deux animaux : un publiable (sera archivé), un vendu (reste intact)
        $animal1 = new Animal();
        $animal1->setStatus('published');

        $animal2 = new Animal();
        $animal2->setStatus('sold');

        $seller = new Seller();
        $seller->getAnimals()->add($animal1);
        $seller->getAnimals()->add($animal2);

        // User::$seller n'a pas de setter → réflexion
        $this->setProperty($user, 'seller', $seller);

        $this->em->expects($this->once())->method('flush');

        $result = $this->service->toggleStatus($user, $admin);

        $this->assertSame('archived', $animal1->getStatus());
        $this->assertSame('sold',     $animal2->getStatus()); // inchangé
        $this->assertSame(1, $result['archived_animals_count']);
    }

    // =========================================================================
    // changePassword()
    // =========================================================================

    public function testChangePasswordRevoqueLeRefreshTokens(): void
    {
        $user = $this->makeUser('user@test.com');

        $this->hasher->method('hashPassword')->willReturn('hashed_new_password');
        $this->em->expects($this->once())->method('flush');
        $this->authService->expects($this->once())->method('revokeAllRefreshTokens')->with($user);

        $this->service->changePassword($user, 'new_secure_password');
    }

    // =========================================================================
    // deleteAccount()
    // =========================================================================

    public function testDeleteAccountAnonymiseLesPersonnalData(): void
    {
        $user = $this->makeUser('john.doe@example.com');
        $user->setPhone('0612345678');

        $this->authService->expects($this->once())->method('revokeAllRefreshTokens')->with($user);
        $this->em->expects($this->once())->method('flush');

        $this->service->deleteAccount($user);

        // Email remplacé par deleted_<hash>@deleted.local
        $this->assertStringStartsWith('deleted_', $user->getEmail());
        $this->assertStringEndsWith('@deleted.local', $user->getEmail());

        $this->assertSame('Compte',    $user->getFirstName());
        $this->assertSame('Supprimé',  $user->getLastName());
        $this->assertSame('disabled',  $user->getStatus());
        $this->assertNull($user->getPhone());
        $this->assertNull($user->getAvatarUrl());
        $this->assertNull($user->getPasswordHash());
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private function makeUser(string $email): User
    {
        $user = new User();
        $user->setEmail($email);
        return $user;
    }

    private function setProperty(object $entity, string $property, mixed $value): void
    {
        $prop = new \ReflectionProperty($entity, $property);
        $prop->setValue($entity, $value);
    }
}
