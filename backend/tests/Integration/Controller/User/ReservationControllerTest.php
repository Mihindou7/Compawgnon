<?php

namespace App\Tests\Integration\Controller\User;

use App\Entity\Animal;
use App\Entity\Reservation;
use App\Entity\Seller;
use App\Entity\Species;
use App\Entity\User;
use App\Tests\Integration\AbstractIntegrationTestCase;
use App\Tests\Integration\Fixtures\TestEntityFactory;

/**
 * Tests d'intégration pour ReservationController — /api/me/reservations
 *
 * Routes couvertes :
 *   GET   /api/me/reservations
 *   POST  /api/me/reservations
 *   GET   /api/me/reservations/{id}
 *   PATCH /api/me/reservations/{id}/cancel
 */
class ReservationControllerTest extends AbstractIntegrationTestCase
{
    use TestEntityFactory;

    private const PASSWORD = 'Test1234!';

    private Animal $animal;
    private Seller $seller;
    private string $buyerToken;
    private string $unverifiedToken;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncateTables([
            'notifications', 'refresh_tokens', 'reservations', 'favorites',
            'animals', 'sellers', 'users', 'breeds', 'species',
        ]);
        $this->seedData();
    }

    // =========================================================================
    // POST /api/me/reservations
    // =========================================================================

    public function testCreerReservation(): void
    {
        $this->post('/api/me/reservations', [
            'animalId' => $this->animal->getId(),
            'message'  => 'Très intéressé par cet animal.',
        ], $this->bearerHeader($this->buyerToken));

        $this->assertSame(201, $this->statusCode());

        $data = $this->json()['data'];
        $this->assertSame($this->animal->getId(), $data['animal']['id']);
        $this->assertSame('pending', $data['status']);
        $this->assertArrayHasKey('id', $data);
    }

    public function testCreerReservationEmailNonVerifie(): void
    {
        $this->post('/api/me/reservations', [
            'animalId' => $this->animal->getId(),
        ], $this->bearerHeader($this->unverifiedToken));

        $this->assertSame(403, $this->statusCode());
        $this->assertStringContainsString('verification', strtolower($this->json()['error'] ?? ''));
    }

    public function testCreerReservationAnimalInexistant(): void
    {
        $this->post('/api/me/reservations', [
            'animalId' => 99999,
        ], $this->bearerHeader($this->buyerToken));

        $this->assertSame(404, $this->statusCode());
    }

    public function testCreerReservationDoublon(): void
    {
        // Première réservation
        $this->post('/api/me/reservations', [
            'animalId' => $this->animal->getId(),
        ], $this->bearerHeader($this->buyerToken));
        $this->assertSame(201, $this->statusCode());

        // Deuxième → doublon en pending
        $this->post('/api/me/reservations', [
            'animalId' => $this->animal->getId(),
        ], $this->bearerHeader($this->buyerToken));

        $this->assertSame(409, $this->statusCode());
    }

    public function testCreerReservationSansToken(): void
    {
        $this->post('/api/me/reservations', ['animalId' => $this->animal->getId()]);

        $this->assertSame(401, $this->statusCode());
    }

    // =========================================================================
    // GET /api/me/reservations
    // =========================================================================

    public function testListeReservationsVide(): void
    {
        $this->get('/api/me/reservations', $this->bearerHeader($this->buyerToken));

        $this->assertSame(200, $this->statusCode());

        $json = $this->json();
        $this->assertArrayHasKey('data', $json);
        $this->assertArrayHasKey('meta', $json);
        $this->assertSame(0, $json['meta']['total']);
    }

    public function testListeReservationsAvecDonnees(): void
    {
        $this->post('/api/me/reservations', [
            'animalId' => $this->animal->getId(),
        ], $this->bearerHeader($this->buyerToken));

        $this->get('/api/me/reservations', $this->bearerHeader($this->buyerToken));

        $this->assertSame(200, $this->statusCode());

        $json = $this->json();
        $this->assertSame(1, $json['meta']['total']);
        $this->assertCount(1, $json['data']);
        $this->assertSame('pending', $json['data'][0]['status']);
    }

    // =========================================================================
    // GET /api/me/reservations/{id}
    // =========================================================================

    public function testDetailReservation(): void
    {
        $buyer  = $this->em->getRepository(User::class)->findOneBy(['email' => 'buyer-resa@test.com']);
        $resa   = $this->createPendingReservation($this->animal, $buyer, $this->seller);
        $this->em->flush();

        $this->get("/api/me/reservations/{$resa->getId()}", $this->bearerHeader($this->buyerToken));

        $this->assertSame(200, $this->statusCode());

        $data = $this->json()['data'];
        $this->assertSame($resa->getId(), $data['id']);
        $this->assertSame('pending', $data['status']);
    }

    // =========================================================================
    // PATCH /api/me/reservations/{id}/cancel
    // =========================================================================

    public function testAnnulerReservation(): void
    {
        $buyer = $this->em->getRepository(User::class)->findOneBy(['email' => 'buyer-resa@test.com']);
        $resa  = $this->createPendingReservation($this->animal, $buyer, $this->seller);
        $this->em->flush();

        $this->patch("/api/me/reservations/{$resa->getId()}/cancel", [], $this->bearerHeader($this->buyerToken));

        $this->assertSame(200, $this->statusCode());
        $this->assertSame('cancelled', $this->json()['data']['status']);
    }

    public function testAnnulerReservationStatutIncompatible(): void
    {
        // Crée une réservation déjà acceptée directement en base
        $buyer = $this->em->getRepository(User::class)->findOneBy(['email' => 'buyer-resa@test.com']);
        $resa  = new Reservation();
        $resa->setAnimal($this->animal);
        $resa->setBuyer($buyer);
        $resa->setSeller($this->seller);
        $resa->setStatus('accepted');
        $this->em->persist($resa);
        $this->em->flush();

        $this->patch("/api/me/reservations/{$resa->getId()}/cancel", [], $this->bearerHeader($this->buyerToken));

        $this->assertSame(409, $this->statusCode());
    }

    public function testAnnulerReservationInexistante(): void
    {
        $this->patch('/api/me/reservations/99999/cancel', [], $this->bearerHeader($this->buyerToken));

        $this->assertSame(404, $this->statusCode());
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private function seedData(): void
    {
        $species = $this->createSpecies('Chien', 'chien-resa-test');
        $result  = $this->createApprovedSeller('seller-resa');
        /** @var Seller $seller */
        $this->seller = $result['seller'];

        $this->animal = $this->createPublishedAnimal($this->seller, $species);

        $this->createVerifiedBuyer('buyer-resa@test.com');
        $this->createUnverifiedBuyer('unverified-resa@test.com');

        $this->em->flush();

        $animalId = $this->animal->getId();
        $sellerId = $this->seller->getId();

        // loginAs() effectue des requêtes HTTP qui réinitialisent l'EntityManager
        // → les entités déjà persistées deviennent détachées. On recharge les
        //   références dont les tests ont besoin comme entités managées.
        $this->buyerToken      = $this->loginAs('buyer-resa@test.com', self::PASSWORD)['token'];
        $this->unverifiedToken = $this->loginAs('unverified-resa@test.com', self::PASSWORD)['token'];

        $this->animal = $this->em->getRepository(Animal::class)->find($animalId);
        $this->seller = $this->em->getRepository(Seller::class)->find($sellerId);
    }
}
