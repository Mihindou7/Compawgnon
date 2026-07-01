<?php

namespace App\Tests\Unit\Service;

use App\DTO\Seller\SellerApplyDTO;
use App\Entity\Seller;
use App\Entity\User;
use App\Service\AuditService;
use App\Service\MailService;
use App\Service\SellerService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class SellerServiceTest extends TestCase
{
    private MockObject&EntityManagerInterface $em;
    private MockObject&MailService $mailService;
    private AuditService $audit;
    private SellerService $service;

    protected function setUp(): void
    {
        $this->em          = $this->createMock(EntityManagerInterface::class);
        $this->mailService = $this->createMock(MailService::class);
        $this->audit       = $this->createStub(AuditService::class);

        $this->service = new SellerService(
            $this->em,
            $this->mailService,
            $this->audit,
        );
    }

    // =========================================================================
    // apply()
    // =========================================================================

    public function testApplyLeveUneExceptionSiEmailNonVerifie(): void
    {
        // isEmailVerified() = false car emailVerifiedAt est null par défaut
        $user = $this->makeUser('user@test.com', emailVerified: false);
        $dto  = $this->makeApplyDTO();

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(403);
        $this->service->apply($user, $dto);
    }

    public function testApplyLeveUneExceptionSiCandidaturePendingExisteDeja(): void
    {
        $user = $this->makeUser('user@test.com', emailVerified: true);

        // User::$seller n'a pas de setter (relation inversée) → réflexion
        $existingSeller = new Seller();
        $existingSeller->setVerifiedStatus('pending');
        $this->setProperty($user, 'seller', $existingSeller);

        $dto = $this->makeApplyDTO();

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(409);
        $this->service->apply($user, $dto);
    }

    // =========================================================================
    // approve()
    // =========================================================================

    public function testApproveAjouteRoleSellerAuUser(): void
    {
        $user   = $this->makeUser('seller@test.com', emailVerified: true);
        $seller = $this->makeSeller($user, 'pending');
        $admin  = $this->makeUser('admin@test.com', emailVerified: true);

        $this->em->expects($this->once())->method('flush');
        $this->mailService->expects($this->once())->method('sendSellerApproved');

        $this->service->approve($seller, $admin);

        $this->assertSame('approved', $seller->getVerifiedStatus());
        $this->assertContains('ROLE_SELLER', $user->getRoles());
    }

    // =========================================================================
    // reject()
    // =========================================================================

    public function testRejectEnvoieLEmailAvecLaRaison(): void
    {
        $user   = $this->makeUser('seller@test.com', emailVerified: true);
        $seller = $this->makeSeller($user, 'pending');
        $admin  = $this->makeUser('admin@test.com', emailVerified: true);
        $reason = 'Dossier incomplet.';

        $this->em->expects($this->once())->method('flush');
        $this->mailService
            ->expects($this->once())
            ->method('sendSellerRejected')
            ->with($user->getEmail(), $seller->getName(), $reason);

        $this->service->reject($seller, $admin, $reason);

        $this->assertSame('rejected', $seller->getVerifiedStatus());
        $this->assertSame($reason, $seller->getRejectionReason());
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private function makeUser(string $email, bool $emailVerified = false): User
    {
        $user = new User();
        $user->setEmail($email);

        if ($emailVerified) {
            $user->setEmailVerifiedAt(new \DateTimeImmutable());
        }

        return $user;
    }

    private function makeSeller(User $user, string $verifiedStatus = 'pending'): Seller
    {
        $seller = new Seller();
        $seller->setUser($user);
        $seller->setName('Élevage Dupont');
        $seller->setVerifiedStatus($verifiedStatus);

        return $seller;
    }

    private function makeApplyDTO(): SellerApplyDTO
    {
        $dto             = new SellerApplyDTO();
        $dto->name       = 'Élevage Dupont';
        $dto->type       = 'breeder';
        $dto->city       = 'Lyon';
        $dto->postalCode = '69001';

        return $dto;
    }

    /**
     * Injecte une valeur dans une propriété privée sans setter (ex. User::$seller).
     */
    private function setProperty(object $entity, string $property, mixed $value): void
    {
        $prop = new \ReflectionProperty($entity, $property);
        $prop->setValue($entity, $value);
    }
}
