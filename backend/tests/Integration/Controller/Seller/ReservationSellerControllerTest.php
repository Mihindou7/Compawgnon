<?php

namespace App\Tests\Integration\Controller\Seller;

use App\Entity\Animal;
use App\Entity\Reservation;
use App\Entity\Seller;
use App\Tests\Integration\AbstractIntegrationTestCase;
use App\Tests\Integration\Fixtures\TestEntityFactory;

/**
 * Tests d'intégration pour ReservationSellerController + DashboardSellerController
 *
 * Routes couvertes :
 *   GET   /api/seller/dashboard
 *   GET   /api/seller/reservations
 *   GET   /api/seller/reservations/{id}
 *   PATCH /api/seller/reservations/{id}/accept
 *   PATCH /api/seller/reservations/{id}/reject
 *   PATCH /api/seller/reservations/{id}/complete
 */
class ReservationSellerControllerTest extends AbstractIntegrationTestCase
{
    use TestEntityFactory;

    private const PASSWORD = 'Test1234!';

    private string $sellerToken;
    private int    $pendingResaId;
    private int    $acceptedResaId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncateTables([
            'notifications', 'refresh_tokens', 'reviews', 'reservations',
            'favorites', 'animals', 'sellers', 'users', 'breeds', 'species',
        ]);
        $this->seedData();
    }

    // =========================================================================
    // GET /api/seller/dashboard
    // =========================================================================

    public function testDashboard(): void
    {
        $this->get('/api/seller/dashboard', $this->bearerHeader($this->sellerToken));

        $this->assertSame(200, $this->statusCode());

        $data = $this->json()['data'];
        $this->assertArrayHasKey('seller', $data);
        $this->assertArrayHasKey('stats', $data);
        $this->assertArrayHasKey('reservations_pending', $data['stats']);
        $this->assertGreaterThanOrEqual(1, $data['stats']['reservations_pending']);
    }

    // =========================================================================
    // GET /api/seller/reservations
    // =========================================================================

    public function testListeReservationsVendeur(): void
    {
        $this->get('/api/seller/reservations', $this->bearerHeader($this->sellerToken));

        $this->assertSame(200, $this->statusCode());

        $json = $this->json();
        $this->assertArrayHasKey('data', $json);
        $this->assertArrayHasKey('meta', $json);
        $this->assertGreaterThanOrEqual(2, $json['meta']['total']); // pending + accepted
    }

    // =========================================================================
    // GET /api/seller/reservations/{id}
    // =========================================================================

    public function testDetailReservation(): void
    {
        $this->get("/api/seller/reservations/{$this->pendingResaId}", $this->bearerHeader($this->sellerToken));

        $this->assertSame(200, $this->statusCode());

        $data = $this->json()['data'];
        $this->assertSame($this->pendingResaId, $data['id']);
        $this->assertSame('pending', $data['status']);
        $this->assertArrayHasKey('buyer', $data);
        $this->assertArrayHasKey('animal', $data);
    }

    public function testDetailReservationInexistante(): void
    {
        $this->get('/api/seller/reservations/99999', $this->bearerHeader($this->sellerToken));

        $this->assertSame(404, $this->statusCode());
    }

    // =========================================================================
    // PATCH /api/seller/reservations/{id}/accept
    // =========================================================================

    public function testAccepterReservation(): void
    {
        $this->patch("/api/seller/reservations/{$this->pendingResaId}/accept", [
            'sellerResponse' => 'Votre réservation est acceptée !',
        ], $this->bearerHeader($this->sellerToken));

        $this->assertSame(200, $this->statusCode());

        $data = $this->json()['data'];
        $this->assertSame('accepted', $data['status']);
        $this->assertArrayHasKey('auto_rejected_count', $data);
    }

    public function testAccepterReservationDejaAcceptee(): void
    {
        // Tenter d'accepter une réservation déjà au statut "accepted" → 409
        $this->patch("/api/seller/reservations/{$this->acceptedResaId}/accept", [],
            $this->bearerHeader($this->sellerToken));

        $this->assertSame(409, $this->statusCode());
    }

    // =========================================================================
    // PATCH /api/seller/reservations/{id}/reject
    // =========================================================================

    public function testRefuserReservation(): void
    {
        $this->patch("/api/seller/reservations/{$this->pendingResaId}/reject", [
            'sellerResponse' => 'Désolé, animal déjà réservé.',
        ], $this->bearerHeader($this->sellerToken));

        $this->assertSame(200, $this->statusCode());
        $this->assertSame('rejected', $this->json()['data']['status']);
    }

    public function testRefuserReservationDejaAcceptee(): void
    {
        $this->patch("/api/seller/reservations/{$this->acceptedResaId}/reject", [],
            $this->bearerHeader($this->sellerToken));

        $this->assertSame(409, $this->statusCode());
    }

    // =========================================================================
    // PATCH /api/seller/reservations/{id}/complete
    // =========================================================================

    public function testCompleterReservation(): void
    {
        // Nécessite statut "accepted"
        $this->patch("/api/seller/reservations/{$this->acceptedResaId}/complete", [],
            $this->bearerHeader($this->sellerToken));

        $this->assertSame(200, $this->statusCode());
        $this->assertSame('completed', $this->json()['data']['status']);
    }

    public function testCompleterReservationEnAttente(): void
    {
        // Réservation encore "pending" → 409
        $this->patch("/api/seller/reservations/{$this->pendingResaId}/complete", [],
            $this->bearerHeader($this->sellerToken));

        $this->assertSame(409, $this->statusCode());
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private function seedData(): void
    {
        $species = $this->createSpecies('Chien', 'chien-seller-resa-test');

        $sellerData = $this->createApprovedSeller('seller-resa-seller');
        /** @var Seller $seller */
        $seller     = $sellerData['seller'];

        $animal = $this->createPublishedAnimal($seller, $species);
        $buyer  = $this->createVerifiedBuyer('buyer-seller-resa@test.com');

        // Réservation pending (pour accept/reject/complete-pending tests)
        $pendingResa = new Reservation();
        $pendingResa->setAnimal($animal);
        $pendingResa->setBuyer($buyer);
        $pendingResa->setSeller($seller);
        $pendingResa->setStatus('pending');
        $this->em->persist($pendingResa);

        // Deuxième animal pour la réservation "accepted"
        $animal2 = $this->createPublishedAnimal($seller, $species, '2');
        $animal2->setStatus('reserved'); // cohérent avec une réservation acceptée

        // Réservation accepted (pour complete/accept-doublon tests)
        $acceptedResa = new Reservation();
        $acceptedResa->setAnimal($animal2);
        $acceptedResa->setBuyer($buyer);
        $acceptedResa->setSeller($seller);
        $acceptedResa->setStatus('accepted');
        $this->em->persist($acceptedResa);

        $this->em->flush();

        $this->pendingResaId  = $pendingResa->getId();
        $this->acceptedResaId = $acceptedResa->getId();

        // loginAs() réinitialise l'EM → on ne stocke que les IDs scalaires
        $this->sellerToken = $this->loginAs('seller-resa-seller@seller.test', self::PASSWORD)['token'];
    }
}
