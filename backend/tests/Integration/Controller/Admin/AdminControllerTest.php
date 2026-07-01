<?php

namespace App\Tests\Integration\Controller\Admin;

use App\Entity\Animal;
use App\Entity\Reservation;
use App\Entity\Review;
use App\Entity\Seller;
use App\Entity\User;
use App\Tests\Integration\AbstractIntegrationTestCase;
use App\Tests\Integration\Fixtures\TestEntityFactory;

/**
 * Tests d'intégration pour le back-office admin.
 *
 * Routes couvertes :
 *   GET    /api/admin/dashboard
 *   GET    /api/admin/users
 *   GET    /api/admin/users/{id}
 *   PATCH  /api/admin/users/{id}/toggle-status
 *   DELETE /api/admin/users/{id}
 *   GET    /api/admin/sellers                   (default: verified_status=pending)
 *   GET    /api/admin/sellers/{id}
 *   PATCH  /api/admin/sellers/{id}/approve
 *   PATCH  /api/admin/sellers/{id}/reject
 *   GET    /api/admin/animals                   (default: status=pending_review)
 *   GET    /api/admin/animals/{id}
 *   PATCH  /api/admin/animals/{id}/publish
 *   PATCH  /api/admin/animals/{id}/reject
 *   GET    /api/admin/reviews
 *   PATCH  /api/admin/reviews/{id}/toggle-visibility
 *   GET    /api/admin/audit-logs
 *
 * Toutes les routes requièrent ROLE_ADMIN.
 */
class AdminControllerTest extends AbstractIntegrationTestCase
{
    use TestEntityFactory;

    private const PASSWORD = 'Test1234!';

    private string $adminToken;
    private string $buyerToken;
    private int    $adminId;
    private int    $regularUserId;
    private int    $pendingSellerId;
    private int    $pendingAnimalId;
    private int    $publishedAnimalId;
    private int    $reviewId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncateTables([
            'audit_logs', 'notifications', 'refresh_tokens', 'reviews', 'reservations',
            'favorites', 'animals', 'sellers', 'users', 'breeds', 'species', 'contact_messages',
        ]);
        $this->seedData();
    }

    // =========================================================================
    // Accès — ROLE_ADMIN requis
    // =========================================================================

    public function testAccesRefuseSansToken(): void
    {
        $this->get('/api/admin/dashboard');
        $this->assertSame(401, $this->statusCode());
    }

    public function testAccesRefuseNonAdmin(): void
    {
        $this->get('/api/admin/dashboard', $this->bearerHeader($this->buyerToken));
        $this->assertSame(403, $this->statusCode());
    }

    // =========================================================================
    // GET /api/admin/dashboard
    // =========================================================================

    public function testDashboard(): void
    {
        $this->get('/api/admin/dashboard', $this->bearerHeader($this->adminToken));

        $this->assertSame(200, $this->statusCode());

        $data = $this->json()['data'];
        $this->assertArrayHasKey('users', $data);
        $this->assertArrayHasKey('sellers', $data);
        $this->assertArrayHasKey('animals', $data);
        $this->assertArrayHasKey('reviews', $data);
        $this->assertArrayHasKey('pending_actions', $data);
        $this->assertGreaterThanOrEqual(1, $data['sellers']['pending']);
        $this->assertGreaterThanOrEqual(1, $data['animals']['pending_review']);
    }

    // =========================================================================
    // GET /api/admin/users
    // =========================================================================

    public function testListeUtilisateurs(): void
    {
        $this->get('/api/admin/users', $this->bearerHeader($this->adminToken));

        $this->assertSame(200, $this->statusCode());

        $json = $this->json();
        $this->assertArrayHasKey('data', $json);
        $this->assertArrayHasKey('meta', $json);
        $this->assertGreaterThanOrEqual(1, $json['meta']['total']);
    }

    // =========================================================================
    // GET /api/admin/users/{id}
    // =========================================================================

    public function testDetailUtilisateur(): void
    {
        $this->get("/api/admin/users/{$this->regularUserId}", $this->bearerHeader($this->adminToken));

        $this->assertSame(200, $this->statusCode());

        $data = $this->json()['data'];
        $this->assertSame($this->regularUserId, $data['id']);
        $this->assertArrayHasKey('email', $data);
        $this->assertArrayHasKey('roles', $data);
        $this->assertArrayHasKey('status', $data);
    }

    public function testDetailUtilisateurInexistant(): void
    {
        $this->get('/api/admin/users/99999', $this->bearerHeader($this->adminToken));
        $this->assertSame(404, $this->statusCode());
    }

    // =========================================================================
    // PATCH /api/admin/users/{id}/toggle-status
    // =========================================================================

    public function testToggleStatutUtilisateur(): void
    {
        $this->patch("/api/admin/users/{$this->regularUserId}/toggle-status", [],
            $this->bearerHeader($this->adminToken));

        $this->assertSame(200, $this->statusCode());

        $data = $this->json()['data'];
        $this->assertSame($this->regularUserId, $data['id']);
        $this->assertContains($data['status'], ['active', 'disabled']);
    }

    // =========================================================================
    // GET /api/admin/sellers (liste les pending par défaut)
    // =========================================================================

    public function testListeVendeursPending(): void
    {
        $this->get('/api/admin/sellers', $this->bearerHeader($this->adminToken));

        $this->assertSame(200, $this->statusCode());

        $json = $this->json();
        $this->assertGreaterThanOrEqual(1, $json['meta']['total']);
        $this->assertSame('pending', $json['data'][0]['verified_status']);
    }

    // =========================================================================
    // GET /api/admin/sellers/{id}
    // =========================================================================

    public function testDetailVendeur(): void
    {
        $this->get("/api/admin/sellers/{$this->pendingSellerId}", $this->bearerHeader($this->adminToken));

        $this->assertSame(200, $this->statusCode());

        $data = $this->json()['data'];
        $this->assertSame($this->pendingSellerId, $data['id']);
        $this->assertSame('pending', $data['verified_status']);
        $this->assertArrayHasKey('animals_count', $data);
    }

    public function testDetailVendeurInexistant(): void
    {
        $this->get('/api/admin/sellers/99999', $this->bearerHeader($this->adminToken));
        $this->assertSame(404, $this->statusCode());
    }

    // =========================================================================
    // PATCH /api/admin/sellers/{id}/approve
    // =========================================================================

    public function testApprouverVendeur(): void
    {
        $this->patch("/api/admin/sellers/{$this->pendingSellerId}/approve", [],
            $this->bearerHeader($this->adminToken));

        $this->assertSame(200, $this->statusCode());

        $data = $this->json()['data'];
        $this->assertSame('approved', $data['verified_status']);
    }

    // =========================================================================
    // PATCH /api/admin/sellers/{id}/reject
    // =========================================================================

    public function testRejeterVendeur(): void
    {
        $this->patch("/api/admin/sellers/{$this->pendingSellerId}/reject", [
            'rejectionReason' => 'Documents insuffisants.',
        ], $this->bearerHeader($this->adminToken));

        $this->assertSame(200, $this->statusCode());
        $this->assertSame('rejected', $this->json()['data']['verified_status']);
    }

    // =========================================================================
    // GET /api/admin/animals (liste pending_review par défaut)
    // =========================================================================

    public function testListeAnnauxPendingReview(): void
    {
        $this->get('/api/admin/animals', $this->bearerHeader($this->adminToken));

        $this->assertSame(200, $this->statusCode());

        $json = $this->json();
        $this->assertGreaterThanOrEqual(1, $json['meta']['total']);
    }

    // =========================================================================
    // GET /api/admin/animals/{id}
    // =========================================================================

    public function testDetailAnimal(): void
    {
        $this->get("/api/admin/animals/{$this->pendingAnimalId}", $this->bearerHeader($this->adminToken));

        $this->assertSame(200, $this->statusCode());

        $data = $this->json()['data'];
        $this->assertSame($this->pendingAnimalId, $data['id']);
        $this->assertSame('pending_review', $data['status']);
    }

    public function testDetailAnimalInexistant(): void
    {
        $this->get('/api/admin/animals/99999', $this->bearerHeader($this->adminToken));
        $this->assertSame(404, $this->statusCode());
    }

    // =========================================================================
    // PATCH /api/admin/animals/{id}/publish
    // =========================================================================

    public function testPublierAnnonce(): void
    {
        $this->patch("/api/admin/animals/{$this->pendingAnimalId}/publish", [],
            $this->bearerHeader($this->adminToken));

        $this->assertSame(200, $this->statusCode());

        $data = $this->json()['data'];
        $this->assertSame('published', $data['status']);
        $this->assertArrayHasKey('published_at', $data);
    }

    // =========================================================================
    // PATCH /api/admin/animals/{id}/reject
    // =========================================================================

    public function testRejeterAnnonce(): void
    {
        $this->patch("/api/admin/animals/{$this->pendingAnimalId}/reject", [
            'rejectionReason' => 'Photo de mauvaise qualité.',
        ], $this->bearerHeader($this->adminToken));

        $this->assertSame(200, $this->statusCode());
    }

    // =========================================================================
    // PATCH /api/admin/animals/{id}/publish — animal hors pending_review
    // =========================================================================

    public function testPublierAnnonceHorsPendingReview(): void
    {
        // L'animal est déjà "published" → AnimalService::publish() lève DomainException(409)
        $this->patch("/api/admin/animals/{$this->publishedAnimalId}/publish", [],
            $this->bearerHeader($this->adminToken));

        $this->assertSame(409, $this->statusCode());
    }

    // =========================================================================
    // PATCH /api/admin/users/{id}/toggle-status — auto-désactivation interdite
    // =========================================================================

    public function testToggleSonPropriCompte(): void
    {
        // UserService::toggleStatus() interdit qu'un admin se désactive lui-même
        $this->patch("/api/admin/users/{$this->adminId}/toggle-status", [],
            $this->bearerHeader($this->adminToken));

        $this->assertSame(403, $this->statusCode());
    }

    // =========================================================================
    // DELETE /api/admin/users/{id} — anonymisation RGPD
    // =========================================================================

    public function testSupprimerUtilisateurRGPD(): void
    {
        $this->delete("/api/admin/users/{$this->regularUserId}", [],
            $this->bearerHeader($this->adminToken));

        $this->assertSame(204, $this->statusCode());
    }

    // =========================================================================
    // PATCH /api/admin/reviews/{id}/toggle-visibility
    // =========================================================================

    public function testModererAvis(): void
    {
        $this->patch("/api/admin/reviews/{$this->reviewId}/toggle-visibility", [],
            $this->bearerHeader($this->adminToken));

        $this->assertSame(200, $this->statusCode());

        $data = $this->json()['data'];
        $this->assertArrayHasKey('id', $data);
        $this->assertArrayHasKey('status', $data);
        $this->assertArrayHasKey('seller_rating_updated', $data);
        $this->assertNotSame('pending', $data['status']); // l'état a changé
    }

    // =========================================================================
    // GET /api/admin/reviews
    // =========================================================================

    public function testListeAvisAdmin(): void
    {
        $this->get('/api/admin/reviews', $this->bearerHeader($this->adminToken));

        $this->assertSame(200, $this->statusCode());

        $json = $this->json();
        $this->assertArrayHasKey('data', $json);
        $this->assertArrayHasKey('meta', $json);
        $this->assertGreaterThanOrEqual(1, $json['meta']['total']);
    }

    // =========================================================================
    // GET /api/admin/audit-logs
    // =========================================================================

    public function testAuditLogs(): void
    {
        $this->get('/api/admin/audit-logs', $this->bearerHeader($this->adminToken));

        $this->assertSame(200, $this->statusCode());

        $json = $this->json();
        $this->assertArrayHasKey('data', $json);
        $this->assertArrayHasKey('meta', $json);
        $this->assertIsArray($json['data']);
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private function seedData(): void
    {
        $species = $this->createSpecies('Chat', 'chat-admin-test');

        // Admin
        $admin = $this->createAdmin('admin-ctrl@test.com');

        // Utilisateur standard (cible des tests user admin)
        $buyer = $this->createVerifiedBuyer('buyer-admin@test.com');

        // Vendeur avec profil approuvé (pour avoir un seller qui peut créer des animaux)
        $approvedData    = $this->createApprovedSeller('approved-seller-admin');
        /** @var Seller $approvedSeller */
        $approvedSeller  = $approvedData['seller'];

        // Animal en attente de modération
        $pendingAnimal = $this->createPendingReviewAnimal($approvedSeller, $species);

        // Animal publié — sert à tester le rejet de publish hors pending_review (409)
        $publishedAnimal = $this->createPublishedAnimal($approvedSeller, $species, 'admin-published');

        // Vendeur en attente de validation (cible des tests seller admin)
        $pendingData = $this->createPendingSeller('pending-seller-admin');
        /** @var Seller $pendingSeller */
        $pendingSeller = $pendingData['seller'];

        // Réservation complétée + avis pending pour testModererAvis et testListeAvisAdmin
        $completedResa = new Reservation();
        $completedResa->setAnimal($publishedAnimal);
        $completedResa->setBuyer($buyer);
        $completedResa->setSeller($approvedSeller);
        $completedResa->setStatus('completed');
        $this->em->persist($completedResa);

        $review = new Review();
        $review->setSeller($approvedSeller);
        $review->setBuyer($buyer);
        $review->setReservation($completedResa);
        $review->setRating(4);
        $review->setComment('Très bon vendeur.');
        $review->setStatus('pending');
        $this->em->persist($review);

        $this->em->flush();

        $this->adminId           = $admin->getId();
        $this->regularUserId     = $buyer->getId();
        $this->pendingSellerId   = $pendingSeller->getId();
        $this->pendingAnimalId   = $pendingAnimal->getId();
        $this->publishedAnimalId = $publishedAnimal->getId();
        $this->reviewId          = $review->getId();

        // loginAs() réinitialise l'EM → on ne stocke que les tokens
        $this->adminToken = $this->loginAs('admin-ctrl@test.com', self::PASSWORD)['token'];
        $this->buyerToken = $this->loginAs('buyer-admin@test.com', self::PASSWORD)['token'];
    }
}
