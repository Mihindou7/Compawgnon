<?php

namespace App\Tests\Unit\Service;

use App\DTO\Review\CreateReviewDTO;
use App\Entity\Reservation;
use App\Entity\Review;
use App\Entity\Seller;
use App\Entity\User;
use App\Repository\ReservationRepository;
use App\Repository\ReviewRepository;
use App\Service\AuditService;
use App\Service\ReviewService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class ReviewServiceTest extends TestCase
{
    private MockObject&EntityManagerInterface $em;
    private ReservationRepository $reservationRepo;
    private MockObject&ReviewRepository $reviewRepo;
    private AuditService $audit;
    private ReviewService $service;

    protected function setUp(): void
    {
        $this->em              = $this->createMock(EntityManagerInterface::class);
        $this->reservationRepo = $this->createStub(ReservationRepository::class);
        $this->reviewRepo      = $this->createMock(ReviewRepository::class);
        $this->audit           = $this->createStub(AuditService::class);

        $this->service = new ReviewService(
            $this->em,
            $this->reservationRepo,
            $this->reviewRepo,
            $this->audit,
        );
    }

    // =========================================================================
    // create()
    // =========================================================================

    public function testCreateLeveUneExceptionSiReservationNestPasCompleted(): void
    {
        $buyer = $this->makeUser('buyer@test.com', emailVerified: true);

        $reservation = new Reservation();
        // Même objet buyer → getBuyer()->getId() === $buyer->getId() === null → vérif propriété passe
        $reservation->setBuyer($buyer);
        $reservation->setStatus('accepted'); // pas completed

        $this->reservationRepo->method('find')->willReturn($reservation);

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);
        $this->service->create($buyer, $this->makeCreateDTO());
    }

    public function testCreateLeveUneExceptionSiAcheteurNestPasProprietaire(): void
    {
        // buyer->getId() = 1 (réflexion), otherBuyer->getId() = null → null !== 1 = true
        $buyer = $this->makeUser('buyer@test.com', emailVerified: true);
        $this->setProperty($buyer, 'id', 1);

        $otherBuyer = $this->makeUser('other@test.com', emailVerified: true);

        $reservation = new Reservation();
        $reservation->setBuyer($otherBuyer); // propriétaire différent
        $reservation->setStatus('completed');

        $this->reservationRepo->method('find')->willReturn($reservation);

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(403);
        $this->service->create($buyer, $this->makeCreateDTO());
    }

    // =========================================================================
    // toggleVisibility()
    // =========================================================================

    public function testToggleVisibilityAlterneDePublishedVersHidden(): void
    {
        [$review, $admin] = $this->makeReviewAndAdmin('published');

        $this->reviewRepo->expects($this->once())->method('getSellerRating')->willReturn(['avg' => 4.0, 'count' => 2]);
        $this->em->expects($this->once())->method('flush');

        $this->service->toggleVisibility($review, $admin);

        $this->assertSame('hidden', $review->getStatus());
    }

    public function testToggleVisibilityAlterneDeHiddenVersPublished(): void
    {
        [$review, $admin] = $this->makeReviewAndAdmin('hidden');

        $this->reviewRepo->expects($this->once())->method('getSellerRating')->willReturn(['avg' => 3.5, 'count' => 4]);
        $this->em->expects($this->once())->method('flush');

        $this->service->toggleVisibility($review, $admin);

        $this->assertSame('published', $review->getStatus());
    }

    public function testToggleVisibilityRecalculeLaNoteMoyenneDuVendeur(): void
    {
        // Seller avec ID fixé : évite le TypeError dans calculateSellerRating(int $sellerId)
        $seller = new Seller();
        $this->setProperty($seller, 'id', 7);

        $review = new Review();
        $review->setSeller($seller);
        $review->setStatus('pending'); // ≠ 'published' → newStatus = 'published'

        $this->reviewRepo
            ->expects($this->once())
            ->method('getSellerRating')
            ->with(7)
            ->willReturn(['avg' => 4.2, 'count' => 5]);

        $admin  = $this->makeUser('admin@test.com');
        $result = $this->service->toggleVisibility($review, $admin);

        $this->assertSame(['rating' => 4.2, 'reviews_count' => 5], $result);
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

    private function makeCreateDTO(int $reservationId = 1): CreateReviewDTO
    {
        $dto                = new CreateReviewDTO();
        $dto->reservationId = $reservationId;
        $dto->rating        = 5;

        return $dto;
    }

    /**
     * Construit un Review avec un Seller dont l'ID est fixé via réflexion
     * (requis pour éviter un TypeError dans calculateSellerRating(int $sellerId)).
     *
     * @return array{Review, User}
     */
    private function makeReviewAndAdmin(string $reviewStatus): array
    {
        $seller = new Seller();
        $this->setProperty($seller, 'id', 1);

        $review = new Review();
        $review->setSeller($seller);
        $review->setStatus($reviewStatus);

        $admin = $this->makeUser('admin@test.com');

        return [$review, $admin];
    }

    /**
     * Injecte une valeur dans une propriété privée sans setter.
     */
    private function setProperty(object $entity, string $property, mixed $value): void
    {
        $prop = new \ReflectionProperty($entity, $property);
        $prop->setValue($entity, $value);
    }
}
