<?php

namespace App\Tests\Unit\Service;

use App\Entity\AuditLog;
use App\Entity\User;
use App\Service\AuditService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\RequestStack;

class AuditServiceTest extends TestCase
{
    private MockObject&EntityManagerInterface $em;
    private RequestStack $requestStack;
    private AuditService $service;

    protected function setUp(): void
    {
        $this->em           = $this->createMock(EntityManagerInterface::class);
        $this->requestStack = $this->createStub(RequestStack::class);
        // getCurrentRequest() retourne null par défaut → pas d'IP à logguer en test unitaire

        $this->service = new AuditService($this->em, $this->requestStack);
    }

    // =========================================================================
    // log()
    // =========================================================================

    public function testLogCreeUnAuditLogAvecActionEntityTypeEntityId(): void
    {
        $actor       = new User();
        $capturedLog = null;

        $this->em->expects($this->once())
            ->method('persist')
            ->with($this->callback(function (AuditLog $log) use (&$capturedLog): bool {
                $capturedLog = $log;
                return true;
            }));
        $this->em->expects($this->once())->method('flush');

        $this->service->log('user.created', 'User', 42, $actor);

        $this->assertInstanceOf(AuditLog::class, $capturedLog);
        $this->assertSame('user.created', $capturedLog->getAction());
        $this->assertSame('User',         $capturedLog->getEntityType());
        $this->assertSame(42,             $capturedLog->getEntityId());
        $this->assertSame($actor,         $capturedLog->getActor());
    }

    public function testLogFonctionneSansActor(): void
    {
        $capturedLog = null;

        $this->em->expects($this->once())
            ->method('persist')
            ->with($this->callback(function (AuditLog $log) use (&$capturedLog): bool {
                $capturedLog = $log;
                return true;
            }));
        $this->em->expects($this->once())->method('flush');

        // actor omis → null par défaut, aucune exception attendue
        $this->service->log('animal.viewed', 'Animal', 7);

        $this->assertInstanceOf(AuditLog::class, $capturedLog);
        $this->assertNull($capturedLog->getActor());
        $this->assertSame('animal.viewed', $capturedLog->getAction());
        $this->assertSame('Animal',        $capturedLog->getEntityType());
        $this->assertSame(7,               $capturedLog->getEntityId());
    }

    public function testLogStockeCorrectementOldValuesEtNewValues(): void
    {
        $capturedLog = null;
        $oldValues   = ['status' => 'active'];
        $newValues   = ['status' => 'disabled', 'archived_animals_count' => 3];

        $this->em->expects($this->once())
            ->method('persist')
            ->with($this->callback(function (AuditLog $log) use (&$capturedLog): bool {
                $capturedLog = $log;
                return true;
            }));
        $this->em->expects($this->once())->method('flush');

        $this->service->log('user.disabled', 'User', 5, null, $oldValues, $newValues);

        $this->assertInstanceOf(AuditLog::class, $capturedLog);
        $this->assertSame($oldValues, $capturedLog->getOldValues());
        $this->assertSame($newValues, $capturedLog->getNewValues());
    }
}
