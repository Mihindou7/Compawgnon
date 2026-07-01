<?php

namespace App\Tests\Integration\Controller\User;

use App\Entity\Animal;
use App\Entity\Seller;
use App\Entity\Species;
use App\Tests\Integration\AbstractIntegrationTestCase;
use App\Tests\Integration\Fixtures\TestEntityFactory;

/**
 * Tests d'intégration pour FavoriteController — /api/me/favorites
 *
 * Routes couvertes :
 *   GET    /api/me/favorites
 *   GET    /api/me/favorites/ids
 *   POST   /api/me/favorites/{animalId}
 *   DELETE /api/me/favorites/{animalId}
 */
class FavoriteControllerTest extends AbstractIntegrationTestCase
{
    use TestEntityFactory;

    private const PASSWORD = 'Test1234!';

    private Animal $animal;
    private string $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncateTables([
            'refresh_tokens', 'favorites', 'animals', 'sellers', 'users', 'breeds', 'species',
        ]);
        $this->seedData();
    }

    // =========================================================================
    // POST /api/me/favorites/{animalId}
    // =========================================================================

    public function testAjoutFavori(): void
    {
        $this->post("/api/me/favorites/{$this->animal->getId()}", [], $this->bearerHeader($this->token));

        $this->assertSame(200, $this->statusCode());
        $this->assertArrayHasKey('data', $this->json());
    }

    public function testAjoutFavoriIdempotent(): void
    {
        $this->post("/api/me/favorites/{$this->animal->getId()}", [], $this->bearerHeader($this->token));
        $this->assertSame(200, $this->statusCode());

        // Deuxième ajout → toujours 200, pas de doublon
        $this->post("/api/me/favorites/{$this->animal->getId()}", [], $this->bearerHeader($this->token));
        $this->assertSame(200, $this->statusCode());
    }

    public function testAjoutFavoriAnimalInexistant(): void
    {
        $this->post('/api/me/favorites/99999', [], $this->bearerHeader($this->token));

        $this->assertSame(404, $this->statusCode());
    }

    public function testAjoutFavoriSansToken(): void
    {
        $this->post("/api/me/favorites/{$this->animal->getId()}", []);

        $this->assertSame(401, $this->statusCode());
    }

    // =========================================================================
    // GET /api/me/favorites
    // =========================================================================

    public function testListeFavorisVide(): void
    {
        $this->get('/api/me/favorites', $this->bearerHeader($this->token));

        $this->assertSame(200, $this->statusCode());

        $json = $this->json();
        $this->assertArrayHasKey('data', $json);
        $this->assertArrayHasKey('meta', $json);
        $this->assertSame(0, $json['meta']['total']);
    }

    public function testListeFavorisAvecDonnees(): void
    {
        // Ajout d'un favori
        $this->post("/api/me/favorites/{$this->animal->getId()}", [], $this->bearerHeader($this->token));

        $this->get('/api/me/favorites', $this->bearerHeader($this->token));

        $this->assertSame(200, $this->statusCode());

        $json = $this->json();
        $this->assertSame(1, $json['meta']['total']);
        $this->assertCount(1, $json['data']);

        $item = $json['data'][0];
        $this->assertArrayHasKey('id', $item);
        $this->assertArrayHasKey('animal', $item);
        $this->assertSame($this->animal->getId(), $item['animal']['id']);
    }

    // =========================================================================
    // GET /api/me/favorites/ids
    // =========================================================================

    public function testListeIdsFavoris(): void
    {
        $this->post("/api/me/favorites/{$this->animal->getId()}", [], $this->bearerHeader($this->token));

        $this->get('/api/me/favorites/ids', $this->bearerHeader($this->token));

        $this->assertSame(200, $this->statusCode());
        $ids = $this->json()['data'];
        $this->assertContains($this->animal->getId(), $ids);
    }

    // =========================================================================
    // DELETE /api/me/favorites/{animalId}
    // =========================================================================

    public function testSuppressionFavori(): void
    {
        $this->post("/api/me/favorites/{$this->animal->getId()}", [], $this->bearerHeader($this->token));
        $this->delete("/api/me/favorites/{$this->animal->getId()}", [], $this->bearerHeader($this->token));

        $this->assertSame(204, $this->statusCode());

        // La liste est vide
        $this->get('/api/me/favorites', $this->bearerHeader($this->token));
        $this->assertSame(0, $this->json()['meta']['total']);
    }

    public function testSuppressionFavoriIdempotent(): void
    {
        // Suppression d'un animal pas en favoris → pas d'erreur
        $this->delete("/api/me/favorites/{$this->animal->getId()}", [], $this->bearerHeader($this->token));

        $this->assertSame(204, $this->statusCode());
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private function seedData(): void
    {
        $species = $this->createSpecies();
        $result  = $this->createApprovedSeller('seller-fav');
        /** @var Seller $seller */
        $seller  = $result['seller'];

        $this->animal = $this->createPublishedAnimal($seller, $species);

        $buyer = $this->createVerifiedBuyer('buyer-fav@test.com');

        $this->em->flush();

        $this->token = $this->loginAs('buyer-fav@test.com', self::PASSWORD)['token'];
    }
}
