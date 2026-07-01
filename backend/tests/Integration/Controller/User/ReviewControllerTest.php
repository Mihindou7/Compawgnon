<?php

namespace App\Tests\Integration\Controller\User;

use App\Entity\Animal;
use App\Entity\Reservation;
use App\Entity\Seller;
use App\Entity\User;
use App\Tests\Integration\AbstractIntegrationTestCase;
use App\Tests\Integration\Fixtures\TestEntityFactory;

/**
 * Tests d'intégration pour ReviewController — /api/me/reviews
 *
 * Routes couvertes :
 *   GET  /api/me/reviews
 *   POST /api/me/reviews
 *
 * Règles métier clés :
 *   - Email vérifié requis (403 sinon)
 *   - La réservation doit avoir le statut "completed" (422 sinon)
 *   - Un seul avis par réservation (409 si doublon)
 *   - La réservation doit appartenir au buyer authentifié (403 sinon)
 */
class ReviewControllerTest extends AbstractIntegrationTestCase
{
    use TestEntityFactory;

    private const PASSWORD = 'Test1234!';

    private Reservation $completedResa;
    private string      $buyerToken;

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
    // POST /api/me/reviews
    // =========================================================================

    public function testCreerAvis(): void
    {
        $this->post('/api/me/reviews', [
            'reservationId' => $this->completedResa->getId(),
            'rating'        => 5,
            'comment'       => 'Vendeur sérieux, animal en parfaite santé.',
        ], $this->bearerHeader($this->buyerToken));

        $this->assertSame(201, $this->statusCode());

        $data = $this->json()['data'];
        $this->assertSame(5, $data['rating']);
        $this->assertSame('pending', $data['status']);
        $this->assertArrayHasKey('id', $data);
    }

    public function testCreerAvisSansCommentaire(): void
    {
        $this->post('/api/me/reviews', [
            'reservationId' => $this->completedResa->getId(),
            'rating'        => 4,
        ], $this->bearerHeader($this->buyerToken));

        $this->assertSame(201, $this->statusCode());
        $this->assertSame(4, $this->json()['data']['rating']);
    }

    public function testCreerAvisEmailNonVerifie(): void
    {
        $unverifiedToken = $this->loginAs('unverified-review@test.com', self::PASSWORD)['token'];

        $this->post('/api/me/reviews', [
            'reservationId' => $this->completedResa->getId(),
            'rating'        => 5,
        ], $this->bearerHeader($unverifiedToken));

        $this->assertSame(403, $this->statusCode());
    }

    public function testCreerAvisReservationNonTerminee(): void
    {
        // Réservation encore en "pending" → 422
        $buyer  = $this->em->getRepository(User::class)->findOneBy(['email' => 'buyer-review@test.com']);
        $animal = $this->completedResa->getAnimal();
        $seller = $this->completedResa->getSeller();

        $pendingResa = new Reservation();
        $pendingResa->setAnimal($animal);
        $pendingResa->setBuyer($buyer);
        $pendingResa->setSeller($seller);
        $pendingResa->setStatus('pending');
        $this->em->persist($pendingResa);
        $this->em->flush();

        $this->post('/api/me/reviews', [
            'reservationId' => $pendingResa->getId(),
            'rating'        => 5,
        ], $this->bearerHeader($this->buyerToken));

        $this->assertSame(422, $this->statusCode());
    }

    public function testCreerAvisReservationInexistante(): void
    {
        $this->post('/api/me/reviews', [
            'reservationId' => 99999,
            'rating'        => 5,
        ], $this->bearerHeader($this->buyerToken));

        $this->assertSame(403, $this->statusCode());
    }

    public function testCreerAvisReservationAutreBuyer(): void
    {
        // Tentative d'avis sur la réservation d'un autre acheteur
        $otherToken = $this->loginAs('other-buyer-review@test.com', self::PASSWORD)['token'];

        $this->post('/api/me/reviews', [
            'reservationId' => $this->completedResa->getId(),
            'rating'        => 5,
        ], $this->bearerHeader($otherToken));

        $this->assertSame(403, $this->statusCode());
    }

    public function testCreerAvisDoublon(): void
    {
        $payload = [
            'reservationId' => $this->completedResa->getId(),
            'rating'        => 5,
        ];

        $this->post('/api/me/reviews', $payload, $this->bearerHeader($this->buyerToken));
        $this->assertSame(201, $this->statusCode());

        // Deuxième avis pour la même réservation → 409
        $this->post('/api/me/reviews', $payload, $this->bearerHeader($this->buyerToken));
        $this->assertSame(409, $this->statusCode());
    }

    public function testCreerAvisNoteHorsPlage(): void
    {
        $this->post('/api/me/reviews', [
            'reservationId' => $this->completedResa->getId(),
            'rating'        => 6, // max = 5
        ], $this->bearerHeader($this->buyerToken));

        $this->assertSame(422, $this->statusCode());
    }

    public function testCreerAvisSansToken(): void
    {
        $this->post('/api/me/reviews', [
            'reservationId' => $this->completedResa->getId(),
            'rating'        => 5,
        ]);

        $this->assertSame(401, $this->statusCode());
    }

    // =========================================================================
    // GET /api/me/reviews
    // =========================================================================

    public function testListeAvisVide(): void
    {
        $this->get('/api/me/reviews', $this->bearerHeader($this->buyerToken));

        $this->assertSame(200, $this->statusCode());

        $json = $this->json();
        $this->assertArrayHasKey('data', $json);
        $this->assertArrayHasKey('meta', $json);
        $this->assertSame(0, $json['meta']['total']);
    }

    public function testListeAvisAvecDonnees(): void
    {
        // Créer un avis
        $this->post('/api/me/reviews', [
            'reservationId' => $this->completedResa->getId(),
            'rating'        => 4,
            'comment'       => 'Très bien.',
        ], $this->bearerHeader($this->buyerToken));

        $this->get('/api/me/reviews', $this->bearerHeader($this->buyerToken));

        $this->assertSame(200, $this->statusCode());

        $json = $this->json();
        $this->assertSame(1, $json['meta']['total']);
        $this->assertCount(1, $json['data']);

        $item = $json['data'][0];
        $this->assertSame(4, $item['rating']);
        $this->assertSame('pending', $item['status']);
        $this->assertArrayHasKey('seller', $item);
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private function seedData(): void
    {
        $species = $this->createSpecies('Chien', 'chien-review-test');
        $result  = $this->createApprovedSeller('seller-review');
        /** @var Seller $seller */
        $seller  = $result['seller'];

        $animal = $this->createPublishedAnimal($seller, $species);
        $buyer  = $this->createVerifiedBuyer('buyer-review@test.com');

        // Acheteur secondaire pour le test "réservation d'un autre buyer"
        $this->createVerifiedBuyer('other-buyer-review@test.com');
        // Acheteur non vérifié
        $this->createUnverifiedBuyer('unverified-review@test.com');

        // Réservation "completed" → pré-requis pour pouvoir laisser un avis
        $resa = new Reservation();
        $resa->setAnimal($animal);
        $resa->setBuyer($buyer);
        $resa->setSeller($seller);
        $resa->setStatus('completed');
        $this->em->persist($resa);

        $this->em->flush();

        $resaId = $resa->getId();

        // loginAs() réinitialise l'EM → recharger les références managées
        $this->buyerToken = $this->loginAs('buyer-review@test.com', self::PASSWORD)['token'];

        $this->completedResa = $this->em->getRepository(Reservation::class)->find($resaId);
    }
}
