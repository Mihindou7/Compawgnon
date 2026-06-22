<?php

namespace App\Service;

use App\Entity\Animal;
use App\Entity\Reservation;
use App\Entity\Seller;
use App\Entity\User;
use App\Repository\AnimalRepository;
use App\Repository\ReservationRepository;
use Doctrine\ORM\EntityManagerInterface;

class ReservationService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly ReservationRepository $reservationRepo,
        private readonly AnimalRepository $animalRepo,
        private readonly MailService $mailService,
        private readonly NotificationService $notificationService,
    ) {
    }

    public function create(User $buyer, int $animalId, ?string $message): Reservation
    {
        $animal = $this->animalRepo->find($animalId);

        if (!$animal || $animal->getStatus() !== 'published') {
            throw new \DomainException('Animal not found or not available.', 404);
        }

        if ($this->reservationRepo->findOneBy(['animal' => $animal, 'status' => 'accepted'])) {
            throw new \DomainException('This animal is already reserved.', 409);
        }

        if ($this->reservationRepo->findOneBy(['animal' => $animal, 'buyer' => $buyer, 'status' => 'pending'])) {
            throw new \DomainException('You already have a pending reservation for this animal.', 409);
        }

        $reservation = new Reservation();
        $reservation->setAnimal($animal);
        $reservation->setBuyer($buyer);
        $reservation->setSeller($animal->getSeller());
        $reservation->setMessage($message);
        $reservation->setStatus('pending');

        $this->em->persist($reservation);
        $this->em->flush();

        $this->mailService->sendReservationCreated(
            $animal->getSeller()->getUser()->getEmail(),
            ['animal_title' => $animal->getTitle(), 'buyer_message' => $message]
        );

        $this->notificationService->create(
            $animal->getSeller()->getUser(),
            'reservation_created',
            ['reservation_id' => $reservation->getId(), 'animal_title' => $animal->getTitle(), 'buyer_name' => $buyer->getFirstName() ?? $buyer->getEmail()]
        );

        return $reservation;
    }

    public function cancel(Reservation $reservation, User $buyer): Reservation
    {
        if ($reservation->getBuyer()->getId() !== $buyer->getId()) {
            throw new \DomainException('Access denied.', 403);
        }

        if ($reservation->getStatus() !== 'pending') {
            throw new \DomainException('Only pending reservations can be cancelled.', 409);
        }

        $reservation->setStatus('cancelled');
        $reservation->setUpdatedAt(new \DateTimeImmutable());
        $this->em->flush();

        $this->mailService->sendReservationCancelled(
            $reservation->getSeller()->getUser()->getEmail(),
            [
                'animal_title' => $reservation->getAnimal()->getTitle(),
                'buyer_name'   => $buyer->getFirstName() ?? $buyer->getEmail(),
            ]
        );

        return $reservation;
    }

    public function accept(Reservation $reservation, Seller $seller, ?string $sellerResponse): array
    {
        if ($reservation->getSeller()->getId() !== $seller->getId()) {
            throw new \DomainException('Reservation not found.', 404);
        }

        if ($reservation->getStatus() !== 'pending') {
            throw new \DomainException('Only pending reservations can be accepted.', 409);
        }

        $reservation->setStatus('accepted');
        $reservation->setSellerResponse($sellerResponse);
        $reservation->setUpdatedAt(new \DateTimeImmutable());

        $animal = $reservation->getAnimal();
        $animal->setStatus('reserved');
        $animal->setUpdatedAt(new \DateTimeImmutable());

        // Auto-reject others pending on same animal
        $others = $this->reservationRepo->findBy(['animal' => $animal, 'status' => 'pending']);
        $autoRejectedCount = 0;
        foreach ($others as $other) {
            if ($other->getId() !== $reservation->getId()) {
                $other->setStatus('rejected');
                $other->setUpdatedAt(new \DateTimeImmutable());
                $autoRejectedCount++;
                $this->mailService->sendReservationRejected(
                    $other->getBuyer()->getEmail(),
                    ['animal_title' => $animal->getTitle(), 'seller_response' => null]
                );
            }
        }

        $this->em->flush();

        $this->mailService->sendReservationAccepted(
            $reservation->getBuyer()->getEmail(),
            ['animal_title' => $animal->getTitle(), 'seller_response' => $sellerResponse]
        );

        $this->notificationService->create(
            $reservation->getBuyer(),
            'reservation_accepted',
            ['reservation_id' => $reservation->getId(), 'animal_title' => $animal->getTitle(), 'seller_response' => $sellerResponse]
        );

        return ['auto_rejected_count' => $autoRejectedCount];
    }

    public function reject(Reservation $reservation, Seller $seller, ?string $sellerResponse): void
    {
        if ($reservation->getSeller()->getId() !== $seller->getId()) {
            throw new \DomainException('Reservation not found.', 404);
        }

        if ($reservation->getStatus() !== 'pending') {
            throw new \DomainException('Only pending reservations can be rejected.', 409);
        }

        $reservation->setStatus('rejected');
        $reservation->setSellerResponse($sellerResponse);
        $reservation->setUpdatedAt(new \DateTimeImmutable());
        $this->em->flush();

        $this->mailService->sendReservationRejected(
            $reservation->getBuyer()->getEmail(),
            ['animal_title' => $reservation->getAnimal()->getTitle(), 'seller_response' => $sellerResponse]
        );

        $this->notificationService->create(
            $reservation->getBuyer(),
            'reservation_rejected',
            ['reservation_id' => $reservation->getId(), 'animal_title' => $reservation->getAnimal()->getTitle()]
        );
    }

    public function complete(Reservation $reservation, Seller $seller): void
    {
        if ($reservation->getSeller()->getId() !== $seller->getId()) {
            throw new \DomainException('Reservation not found.', 404);
        }

        if ($reservation->getStatus() !== 'accepted') {
            throw new \DomainException('Only accepted reservations can be completed.', 409);
        }

        $reservation->setStatus('completed');
        $reservation->setUpdatedAt(new \DateTimeImmutable());

        $animal = $reservation->getAnimal();
        $animal->setStatus('sold');
        $animal->setUpdatedAt(new \DateTimeImmutable());

        $this->em->flush();

        $this->mailService->sendReservationCompleted(
            $reservation->getBuyer()->getEmail(),
            ['animal_title' => $animal->getTitle()]
        );
    }
}
