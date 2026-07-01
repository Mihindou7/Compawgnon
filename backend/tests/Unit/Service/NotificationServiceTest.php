<?php

namespace App\Tests\Unit\Service;

use App\Entity\Notification;
use App\Entity\User;
use App\Repository\NotificationRepository;
use App\Service\NotificationService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class NotificationServiceTest extends TestCase
{
    private MockObject&EntityManagerInterface $em;
    private MockObject&NotificationRepository $repo;
    private NotificationService $service;

    protected function setUp(): void
    {
        $this->em   = $this->createMock(EntityManagerInterface::class);
        $this->repo = $this->createMock(NotificationRepository::class);

        $this->service = new NotificationService($this->em, $this->repo);
    }

    // =========================================================================
    // create()
    // =========================================================================

    public function testCreateCreeUneNotificationAvecLeBonTypeEtPayload(): void
    {
        $user    = new User();
        $type    = 'reservation_created';
        $payload = ['reservation_id' => 42, 'animal_title' => 'Labrador'];

        $this->em->expects($this->once())->method('persist')->with($this->isInstanceOf(Notification::class));
        $this->em->expects($this->once())->method('flush');

        $notif = $this->service->create($user, $type, $payload);

        $this->assertSame($user, $notif->getUser());
        $this->assertSame($type, $notif->getType());
        $this->assertSame($payload, $notif->getPayload());
        $this->assertFalse($notif->isRead());
    }

    // =========================================================================
    // markAsRead()
    // =========================================================================

    public function testMarkAsReadEstSilencieuxSiNotificationNappartientPasALUtilisateur(): void
    {
        // La notification appartient à un autre utilisateur (ID fixé via réflexion)
        $owner = new User();
        $this->setProperty($owner, 'id', 10);

        $notif = new Notification();
        $notif->setUser($owner);

        $caller = new User(); // getId() = null → null !== 10 → early return

        $this->repo->expects($this->once())->method('find')->with(1)->willReturn($notif);
        $this->em->expects($this->never())->method('flush');

        // Aucune exception — retour silencieux
        $this->service->markAsRead(1, $caller);
        $this->assertNull($notif->getReadAt()); // notification non marquée
    }

    public function testMarkAsReadMarqueLaNotificationCommeLuePourLeProprietaire(): void
    {
        $user = new User();

        $notif = new Notification();
        $notif->setUser($user); // même objet → getId() identique (null) → vérif propriété passe

        $this->repo->expects($this->once())->method('find')->with(5)->willReturn($notif);
        $this->em->expects($this->once())->method('flush');

        $this->service->markAsRead(5, $user);

        $this->assertTrue($notif->isRead());
        $this->assertInstanceOf(\DateTimeImmutable::class, $notif->getReadAt());
    }

    // =========================================================================
    // getUnreadCount()
    // =========================================================================

    public function testGetUnreadCountRetourneLeBonCompteur(): void
    {
        $user = new User();

        $this->repo
            ->expects($this->once())
            ->method('countUnreadForUser')
            ->with($user)
            ->willReturn(7);

        $this->assertSame(7, $this->service->getUnreadCount($user));
    }

    // =========================================================================
    // Helper
    // =========================================================================

    private function setProperty(object $entity, string $property, mixed $value): void
    {
        $prop = new \ReflectionProperty($entity, $property);
        $prop->setValue($entity, $value);
    }
}
