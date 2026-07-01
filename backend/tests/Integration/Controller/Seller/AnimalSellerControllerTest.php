<?php

namespace App\Tests\Integration\Controller\Seller;

use App\Entity\Animal;
use App\Entity\Seller;
use App\Entity\Species;
use App\Entity\User;
use App\Tests\Integration\AbstractIntegrationTestCase;
use App\Tests\Integration\Fixtures\TestEntityFactory;

/**
 * Tests d'intégration pour AnimalSellerController — /api/seller/animals
 *
 * Routes couvertes :
 *   GET    /api/seller/animals
 *   POST   /api/seller/animals
 *   GET    /api/seller/animals/{id}
 *   PATCH  /api/seller/animals/{id}
 *   DELETE /api/seller/animals/{id}
 *
 * Prérequis : ROLE_SELLER + profil vendeur approuvé.
 */
class AnimalSellerControllerTest extends AbstractIntegrationTestCase
{
    use TestEntityFactory;

    private const PASSWORD = 'Test1234!';

    private string $sellerToken;
    private string $buyerToken;
    private string $unapprovedSellerToken;
    private int    $speciesId;
    private int    $animalId;
    private int    $otherAnimalId;
    private int    $reservedAnimalId;

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
    // GET /api/seller/animals
    // =========================================================================

    public function testListeAnimauxVendeur(): void
    {
        $this->get('/api/seller/animals', $this->bearerHeader($this->sellerToken));

        $this->assertSame(200, $this->statusCode());

        $json = $this->json();
        $this->assertArrayHasKey('data', $json);
        $this->assertArrayHasKey('meta', $json);
        $this->assertGreaterThanOrEqual(1, $json['meta']['total']);
    }

    public function testListeAnimauxVendeurSansToken(): void
    {
        $this->get('/api/seller/animals');

        $this->assertSame(401, $this->statusCode());
    }

    public function testListeAnimauxRefuseBuyer(): void
    {
        // ROLE_USER ne suffit pas, ROLE_SELLER requis
        $this->get('/api/seller/animals', $this->bearerHeader($this->buyerToken));

        $this->assertSame(403, $this->statusCode());
    }

    // =========================================================================
    // POST /api/seller/animals
    // =========================================================================

    public function testCreerAnnonce(): void
    {
        $this->post('/api/seller/animals', $this->animalPayload(), $this->bearerHeader($this->sellerToken));

        $this->assertSame(201, $this->statusCode());

        $data = $this->json()['data'];
        $this->assertArrayHasKey('id', $data);
        $this->assertSame('pending_review', $data['status']);
    }

    public function testCreerAnnonceDescriptionTropCourte(): void
    {
        $payload                = $this->animalPayload();
        $payload['description'] = 'Trop courte.';

        $this->post('/api/seller/animals', $payload, $this->bearerHeader($this->sellerToken));

        $this->assertSame(422, $this->statusCode());
        $this->assertArrayHasKey('violations', $this->json());
    }

    public function testCreerAnnonceChampsObligatoiresManquants(): void
    {
        $this->post('/api/seller/animals', ['title' => 'Sans espèce'], $this->bearerHeader($this->sellerToken));

        $this->assertSame(422, $this->statusCode());
    }

    // =========================================================================
    // GET /api/seller/animals/{id}
    // =========================================================================

    public function testDetailAnnonce(): void
    {
        $this->get("/api/seller/animals/{$this->animalId}", $this->bearerHeader($this->sellerToken));

        $this->assertSame(200, $this->statusCode());

        $data = $this->json()['data'];
        $this->assertSame($this->animalId, $data['id']);
        $this->assertArrayHasKey('description', $data);
        $this->assertArrayHasKey('media', $data);
    }

    public function testDetailAnnonceAutreVendeur(): void
    {
        // L'animal appartient à un autre vendeur → 404
        $this->get("/api/seller/animals/{$this->otherAnimalId}", $this->bearerHeader($this->sellerToken));

        $this->assertSame(404, $this->statusCode());
    }

    // =========================================================================
    // PATCH /api/seller/animals/{id}
    // =========================================================================

    public function testMettreAJourAnnonce(): void
    {
        $this->patch("/api/seller/animals/{$this->animalId}", [
            'price' => 950,
            'city'  => 'Marseille',
        ], $this->bearerHeader($this->sellerToken));

        $this->assertSame(200, $this->statusCode());

        $data = $this->json()['data'];
        $this->assertArrayHasKey('id', $data);
        $this->assertArrayHasKey('status', $data);
    }

    public function testMiseAJourAnnoncePublieeDeclencheRemoderation(): void
    {
        // L'animal est "published" → modifier le titre le repasse en pending_review
        $this->patch("/api/seller/animals/{$this->animalId}", [
            'title' => 'Nouveau titre modifié',
        ], $this->bearerHeader($this->sellerToken));

        $this->assertSame(200, $this->statusCode());

        $data = $this->json()['data'];
        // Une annonce publiée éditée repasse en pending_review
        $this->assertSame('pending_review', $data['status']);
    }

    // =========================================================================
    // DELETE /api/seller/animals/{id}
    // =========================================================================

    public function testArchiverAnnonce(): void
    {
        $this->delete("/api/seller/animals/{$this->animalId}", [], $this->bearerHeader($this->sellerToken));

        $this->assertSame(204, $this->statusCode());
    }

    public function testArchiverAnnonceAutreVendeur(): void
    {
        $this->delete("/api/seller/animals/{$this->otherAnimalId}", [], $this->bearerHeader($this->sellerToken));

        $this->assertSame(404, $this->statusCode());
    }

    // =========================================================================
    // POST /api/seller/animals — vendeur non approuvé
    // =========================================================================

    public function testCreerAnnonceVendeurNonApprouve(): void
    {
        // ROLE_SELLER présent mais profil 'pending' → AnimalService::create() lève 403
        $this->post('/api/seller/animals', $this->animalPayload(),
            $this->bearerHeader($this->unapprovedSellerToken));

        $this->assertSame(403, $this->statusCode());
    }

    // =========================================================================
    // PATCH /api/seller/animals/{id} — annonce réservée
    // =========================================================================

    public function testModifierAnnonceReservee(): void
    {
        // AnimalService::update() interdit la modification si status='reserved'
        $this->patch("/api/seller/animals/{$this->reservedAnimalId}", [
            'price' => 750,
        ], $this->bearerHeader($this->sellerToken));

        $this->assertSame(409, $this->statusCode());
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private function seedData(): void
    {
        $species = $this->createSpecies('Chien', 'chien-seller-test');

        // Vendeur principal (approuvé)
        $sellerData = $this->createApprovedSeller('seller-animal');
        /** @var Seller $seller */
        $seller     = $sellerData['seller'];

        $animal = $this->createPublishedAnimal($seller, $species);

        // Animal réservé appartenant au vendeur principal (modification interdite → 409)
        $reservedAnimal = $this->createPublishedAnimal($seller, $species, 'reserved');
        $reservedAnimal->setStatus('reserved');

        // Second vendeur pour les tests d'ownership
        $otherData   = $this->createApprovedSeller('other-seller-animal');
        /** @var Seller $otherSeller */
        $otherSeller = $otherData['seller'];
        $otherAnimal = $this->createPublishedAnimal($otherSeller, $species, 'autre');

        // Vendeur avec ROLE_SELLER mais profil non approuvé (création interdite → 403)
        $unapprovedData = $this->createUnapprovedSeller('unapproved-seller-animal');

        // Acheteur sans ROLE_SELLER pour le test de refus de route
        $buyer = $this->createVerifiedBuyer('buyer-seller-test@test.com');

        $this->em->flush();

        $this->speciesId        = $species->getId();
        $this->animalId         = $animal->getId();
        $this->otherAnimalId    = $otherAnimal->getId();
        $this->reservedAnimalId = $reservedAnimal->getId();

        // loginAs() réinitialise l'EM → on ne stocke que les IDs scalaires
        $this->sellerToken           = $this->loginAs('seller-animal@seller.test', self::PASSWORD)['token'];
        $this->buyerToken            = $this->loginAs('buyer-seller-test@test.com', self::PASSWORD)['token'];
        $this->unapprovedSellerToken = $this->loginAs('unapproved-seller-animal@seller.test', self::PASSWORD)['token'];
    }

    private function animalPayload(): array
    {
        return [
            'speciesId'   => $this->speciesId,
            'title'       => 'Labrador à adopter',
            'description' => str_repeat('Magnifique chien de race Labrador, affectueux et joueur. ', 3),
            'sex'         => 'male',
            'price'       => 800,
            'city'        => 'Lyon',
            'postalCode'  => '69001',
        ];
    }
}
