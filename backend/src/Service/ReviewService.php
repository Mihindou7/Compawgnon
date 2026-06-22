<?php

namespace App\Service;

use App\DTO\Review\CreateReviewDTO;
use App\Entity\Review;
use App\Entity\User;
use App\Repository\ReservationRepository;
use App\Repository\ReviewRepository;
use Doctrine\ORM\EntityManagerInterface;

class ReviewService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly ReservationRepository $reservationRepo,
        private readonly ReviewRepository $reviewRepo,
        private readonly AuditService $audit,
    ) {
    }

    public function create(User $buyer, CreateReviewDTO $dto): Review
    {
        if (!$buyer->isEmailVerified()) {
            throw new \DomainException('Email verification required.', 403);
        }

        $reservation = $this->reservationRepo->find($dto->reservationId);

        if (!$reservation || $reservation->getBuyer()->getId() !== $buyer->getId()) {
            throw new \DomainException('Reservation not found.', 403);
        }

        if ($reservation->getStatus() !== 'completed') {
            throw new \DomainException('Reviews can only be submitted after a completed reservation.', 422);
        }

        if ($this->reviewRepo->findOneBy(['reservation' => $reservation])) {
            throw new \DomainException('A review already exists for this reservation.', 409);
        }

        $review = new Review();
        $review->setSeller($reservation->getSeller());
        $review->setBuyer($buyer);
        $review->setReservation($reservation);
        $review->setRating($dto->rating);
        $review->setComment($dto->comment);
        $review->setStatus('pending');

        $this->em->persist($review);
        $this->em->flush();

        return $review;
    }

    public function toggleVisibility(Review $review, User $admin): array
    {
        $newStatus = $review->getStatus() === 'published' ? 'hidden' : 'published';
        $review->setStatus($newStatus);
        $review->setUpdatedAt(new \DateTimeImmutable());
        $this->em->flush();

        [$rating, $count] = $this->calculateSellerRating($review->getSeller()->getId());

        $this->audit->log(
            $newStatus === 'published' ? 'review.published' : 'review.hidden',
            'Review', $review->getId(), $admin,
            ['status' => $review->getStatus()], ['status' => $newStatus]
        );

        return ['rating' => $rating, 'reviews_count' => $count];
    }

    private function calculateSellerRating(int $sellerId): array
    {
        $rating = $this->reviewRepo->getSellerRating($sellerId);
        return [$rating['avg'] ?? 0.0, $rating['count']];
    }
}
