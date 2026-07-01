<?php

namespace App\Tests\Unit\Service;

use App\Entity\Animal;
use App\Entity\Notification;
use App\Entity\Reservation;
use App\Entity\Seller;
use App\Entity\User;
use App\Repository\AnimalRepository;
use App\Repository\ReservationRepository;
use App\Service\MailService;
use App\Service\NotificationService;
use App\Service\ReservationService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class ReservationServiceTest extends TestCase
{
    private MockObject&EntityManagerInterface $em;
    private MockObject&ReservationRepository $reservationRepo;
    private AnimalRepository $animalRepo;
    private MockObject&MailService $mailService;
    private NotificationService $notificationService;
    private ReservationService $service;

    protected function setUp(): void
    {
        $this->em               = $this->createMock(EntityManagerInterface::class);
        $this->reservationRepo  = $this->createMock(ReservationRepository::class);
        $this->animalRepo       = $this->createStub(AnimalRepository::class);
        $this->mailService      = $this->createMock(MailService::class);
        $this->notificationService = $this->createStub(NotificationService::class);

        // NotificationService::create() retourne Notification (non-nullable) — stub global
        $this->notificationService
            ->method('create')
            ->willReturn($this->createStub(Notification::class));

        $this->service = new ReservationService(
            $this->em,
            $this->reservationRepo,
            $this->animalRepo,
            $this->mailService,
            $this->notificationService,
        );
    }

    // =========================================================================
    // create()
    // =========================================================================

    public function testCreateLeveUneExceptionSiAnimalNestPasPublished(): void
    {
        $buyer  = $this->makeUser('buyer@test.com');
        $seller = $this->makeSeller($this->makeUser('seller@test.com'));
        $animal = $this->makeAnimal($seller, 'draft'); // statut ≠ published

        $this->animalRepo->method('find')->willReturn($animal);

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(404);
        $this->service->create($buyer, 1, null);
    }

    public function testCreateLeveUneExceptionSiAnimalIntrouvable(): void
    {
        $buyer = $this->makeUser('buyer@test.com');
        $this->animalRepo->method('find')->willReturn(null);

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(404);
        $this->service->create($buyer, 99, null);
    }

    public function testCreateLeveUneExceptionSiAnimalDejaReserve(): void
    {
        $buyer  = $this->makeUser('buyer@test.com');
        $seller = $this->makeSeller($this->makeUser('seller@test.com'));
        $animal = $this->makeAnimal($seller, 'published');

        $this->animalRepo->method('find')->willReturn($animal);
        // Une réservation acceptée existe déjà sur cet animal
        $this->reservationRepo->expects($this->once())->method('findOneBy')->willReturn(new Reservation());

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(409);
        $this->service->create($buyer, 1, null);
    }

    public function testCreateRetourneUneReservationEnStatutPending(): void
    {
        $sellerUser = $this->makeUser('seller@test.com');
        $seller     = $this->makeSeller($sellerUser);
        $animal     = $this->makeAnimal($seller, 'published');
        $buyer      = $this->makeUser('buyer@test.com');

        $this->animalRepo->method('find')->willReturn($animal);
        $this->reservationRepo->expects($this->exactly(2))->method('findOneBy')->willReturn(null);
        $this->em->expects($this->once())->method('persist');
        $this->em->expects($this->once())->method('flush');
        $this->mailService->expects($this->once())->method('sendReservationCreated');

        $reservation = $this->service->create($buyer, 1, 'Je suis intéressé');

        $this->assertSame('pending', $reservation->getStatus());
        $this->assertSame($animal, $reservation->getAnimal());
        $this->assertSame($buyer, $reservation->getBuyer());
        $this->assertSame($seller, $reservation->getSeller());
    }

    // =========================================================================
    // cancel()
    // =========================================================================

    public function testCancelLeveUneExceptionSiReservationNestPasPending(): void
    {
        $buyer = $this->makeUser('buyer@test.com');

        $reservation = new Reservation();
        $reservation->setBuyer($buyer);
        $reservation->setStatus('accepted'); // statut ≠ pending

        // $buyer est le même objet que reservation->getBuyer() :
        // getId() === null pour les deux → null !== null = false → vérification d'accès passée
        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(409);
        $this->service->cancel($reservation, $buyer);
    }

    // =========================================================================
    // accept()
    // =========================================================================

    public function testAcceptPasseAnimalEnReservedEtAutoRejetteLesAutresPending(): void
    {
        $sellerUser = $this->makeUser('seller@test.com');
        $seller     = $this->makeSeller($sellerUser);
        $animal     = $this->makeAnimal($seller, 'published');
        $buyer      = $this->makeUser('buyer@test.com');

        $reservation = new Reservation();
        $reservation->setSeller($seller);
        $reservation->setAnimal($animal);
        $reservation->setBuyer($buyer);
        $reservation->setStatus('pending');
        $this->setEntityId($reservation, 1);

        // Deux autres réservations pending sur le même animal
        $other1 = new Reservation();
        $other1->setBuyer($this->makeUser('other1@test.com'));
        $other1->setStatus('pending');
        $this->setEntityId($other1, 2);

        $other2 = new Reservation();
        $other2->setBuyer($this->makeUser('other2@test.com'));
        $other2->setStatus('pending');
        $this->setEntityId($other2, 3);

        // findBy retourne les 3 pending (y compris la réservation acceptée) ;
        // le service filtre par getId() pour n'en rejeter que les 2 autres
        $this->reservationRepo
            ->expects($this->once())
            ->method('findBy')
            ->with(['animal' => $animal, 'status' => 'pending'])
            ->willReturn([$reservation, $other1, $other2]);

        $this->em->expects($this->once())->method('flush');
        $this->mailService->expects($this->exactly(2))->method('sendReservationRejected');
        $this->mailService->expects($this->once())->method('sendReservationAccepted');

        $result = $this->service->accept($reservation, $seller, 'Demande acceptée');

        $this->assertSame(['auto_rejected_count' => 2], $result);
        $this->assertSame('accepted', $reservation->getStatus());
        $this->assertSame('reserved', $animal->getStatus());
        $this->assertSame('rejected', $other1->getStatus());
        $this->assertSame('rejected', $other2->getStatus());
    }

    // =========================================================================
    // complete()
    // =========================================================================

    public function testCompletePasseAnimalEnSoldEtReservationEnCompleted(): void
    {
        $sellerUser = $this->makeUser('seller@test.com');
        $seller     = $this->makeSeller($sellerUser);
        $animal     = $this->makeAnimal($seller, 'reserved');
        $buyer      = $this->makeUser('buyer@test.com');

        $reservation = new Reservation();
        $reservation->setSeller($seller);
        $reservation->setAnimal($animal);
        $reservation->setBuyer($buyer);
        $reservation->setStatus('accepted');

        $this->em->expects($this->once())->method('flush');
        $this->mailService->expects($this->once())->method('sendReservationCompleted');

        $this->service->complete($reservation, $seller);

        $this->assertSame('completed', $reservation->getStatus());
        $this->assertSame('sold', $animal->getStatus());
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

    private function makeSeller(User $user): Seller
    {
        $seller = new Seller();
        $seller->setUser($user);
        return $seller;
    }

    private function makeAnimal(Seller $seller, string $status = 'published'): Animal
    {
        $animal = new Animal();
        $animal->setSeller($seller);
        $animal->setTitle('Labrador à adopter');
        $animal->setStatus($status);
        return $animal;
    }

    /**
     * Injecte un ID sur une entité non persistée via réflexion.
     * Nécessaire pour que accept() distingue la réservation courante des autres.
     */
    private function setEntityId(object $entity, int $id): void
    {
        $prop = new \ReflectionProperty($entity, 'id');
        $prop->setValue($entity, $id);
    }
}
