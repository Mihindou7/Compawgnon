<?php

namespace App\Tests\Integration\Controller\Public;

use App\Entity\Animal;
use App\Entity\Seller;
use App\Entity\Species;
use App\Tests\Integration\AbstractIntegrationTestCase;
use App\Tests\Integration\Fixtures\TestEntityFactory;

/**
 * Tests d'intégration pour le catalogue public — /api/animals, /api/species & /api/sellers
 *
 * Routes couvertes :
 *   GET /api/species
 *   GET /api/species/{slug}
 *   GET /api/animals
 *   GET /api/animals/{id}
 *   GET /api/sellers/{id}
 */
class CataloguePublicTest extends AbstractIntegrationTestCase
{
    use TestEntityFactory;

    private Species $species;
    private Animal  $published;
    private Animal  $draft;
    private int     $approvedSellerId;
    private int     $pendingSellerId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncateTables([
            'reviews', 'notifications', 'refresh_tokens', 'reservations', 'favorites',
            'animals', 'sellers', 'users', 'breeds', 'species',
        ]);
        $this->seedData();
    }

    // =========================================================================
    // GET /api/species
    // =========================================================================

    public function testListeEspeces(): void
    {
        $this->get('/api/species');

        $this->assertSame(200, $this->statusCode());

        $json = $this->json();
        $this->assertArrayHasKey('data', $json);
        $this->assertGreaterThanOrEqual(1, count($json['data']));

        $item = $json['data'][0];
        $this->assertArrayHasKey('id', $item);
        $this->assertArrayHasKey('name', $item);
        $this->assertArrayHasKey('slug', $item);
        $this->assertArrayHasKey('breeds_count', $item);
        $this->assertArrayHasKey('available_animals_count', $item);
    }

    public function testListeEspecesCompteurAnimaux(): void
    {
        $this->get('/api/species');

        $data    = $this->json()['data'];
        $found   = array_filter($data, fn($s) => $s['slug'] === 'chien-catalogue-test');
        $species = reset($found);

        // 1 animal publié, 1 draft → seulement 1 disponible
        $this->assertSame(1, $species['available_animals_count']);
    }

    // =========================================================================
    // GET /api/species/{slug}
    // =========================================================================

    public function testDetailEspece(): void
    {
        $this->get('/api/species/chien-catalogue-test');

        $this->assertSame(200, $this->statusCode());

        $data = $this->json()['data'];
        $this->assertSame('Chien catalogue', $data['name']);
        $this->assertSame('chien-catalogue-test', $data['slug']);
        $this->assertArrayHasKey('breeds', $data);
    }

    public function testDetailEspeceInconnue(): void
    {
        $this->get('/api/species/espece-inexistante');

        $this->assertSame(404, $this->statusCode());
    }

    // =========================================================================
    // GET /api/animals
    // =========================================================================

    public function testListeAnimauxPublics(): void
    {
        $this->get('/api/animals');

        $this->assertSame(200, $this->statusCode());

        $json = $this->json();
        $this->assertArrayHasKey('data', $json);
        $this->assertArrayHasKey('meta', $json);
        $this->assertGreaterThanOrEqual(1, $json['meta']['total']);
    }

    public function testListeAnimauxExclusDraft(): void
    {
        $this->get('/api/animals');

        $json   = $this->json();
        $titles = array_column($json['data'], 'title');

        // L'animal publié est dans la liste
        $this->assertContains($this->published->getTitle(), $titles);
        // L'animal draft n'est pas visible publiquement
        $this->assertNotContains($this->draft->getTitle(), $titles);
    }

    public function testListeAnimauxStructureReponse(): void
    {
        $this->get('/api/animals');

        $item = $this->json()['data'][0];
        $this->assertArrayHasKey('id', $item);
        $this->assertArrayHasKey('title', $item);
        $this->assertArrayHasKey('price', $item);
        $this->assertArrayHasKey('status', $item);
        $this->assertArrayHasKey('species', $item);
        $this->assertArrayHasKey('seller', $item);
        $this->assertSame('published', $item['status']);
    }

    public function testFiltreParEspece(): void
    {
        $this->get('/api/animals?species_slug=chien-catalogue-test');

        $this->assertSame(200, $this->statusCode());

        $json = $this->json();
        // Seul l'animal publié doit apparaître
        $this->assertGreaterThanOrEqual(1, $json['meta']['total']);
    }

    // =========================================================================
    // GET /api/animals/{id}
    // =========================================================================

    public function testDetailAnimalPublie(): void
    {
        $this->get("/api/animals/{$this->published->getId()}");

        $this->assertSame(200, $this->statusCode());

        $data = $this->json()['data'];
        $this->assertSame($this->published->getId(), $data['id']);
        $this->assertArrayHasKey('description', $data);
        $this->assertArrayHasKey('seller', $data);
        $this->assertArrayHasKey('media', $data);
    }

    public function testDetailAnimalDraftInvisible(): void
    {
        // Les animaux draft ne sont pas accessibles en public
        $this->get("/api/animals/{$this->draft->getId()}");

        $this->assertSame(404, $this->statusCode());
    }

    public function testDetailAnimalInexistant(): void
    {
        $this->get('/api/animals/99999');

        $this->assertSame(404, $this->statusCode());
    }

    // =========================================================================
    // GET /api/sellers/{id}
    // =========================================================================

    public function testFicheVendeurApprouve(): void
    {
        $this->get("/api/sellers/{$this->approvedSellerId}");

        $this->assertSame(200, $this->statusCode());

        $data = $this->json()['data'];
        $this->assertArrayHasKey('id', $data);
        $this->assertArrayHasKey('name', $data);
        $this->assertArrayHasKey('rating', $data);
        $this->assertArrayHasKey('reviews_count', $data);
        $this->assertArrayHasKey('active_animals', $data);
        $this->assertArrayHasKey('reviews', $data);
    }

    public function testFicheVendeurNonApprouve(): void
    {
        // Un vendeur en statut "pending" n'est pas visible publiquement
        $this->get("/api/sellers/{$this->pendingSellerId}");

        $this->assertSame(404, $this->statusCode());
    }

    // =========================================================================
    // GET /api/animals — filtres combinés
    // =========================================================================

    public function testFiltresCombinesPrixSexe(): void
    {
        // Notre animal publié : prix 800, sex=male → doit apparaître
        $this->get('/api/animals?price_max=1000&sex=male');

        $this->assertSame(200, $this->statusCode());

        $json = $this->json();
        $this->assertArrayHasKey('data', $json);
        $this->assertGreaterThanOrEqual(1, $json['meta']['total']);

        foreach ($json['data'] as $item) {
            $this->assertSame('male', $item['sex']);
            $this->assertLessThanOrEqual(1000, (float) $item['price']);
        }
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private function seedData(): void
    {
        $this->species = $this->createSpecies('Chien catalogue', 'chien-catalogue-test');

        $result = $this->createApprovedSeller('seller-catalogue');
        /** @var Seller $seller */
        $seller = $result['seller'];

        $this->published = $this->createPublishedAnimal($seller, $this->species, '1');
        $this->draft     = $this->createDraftAnimal($seller, $this->species);

        // Vendeur en attente — ne doit pas être visible en public
        $pendingResult = $this->createPendingSeller('seller-catalogue-pending');
        /** @var Seller $pendingSeller */
        $pendingSeller = $pendingResult['seller'];

        $this->em->flush();

        $this->approvedSellerId = $seller->getId();
        $this->pendingSellerId  = $pendingSeller->getId();
    }
}
