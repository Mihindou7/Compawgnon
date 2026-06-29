<?php

namespace App\Tests\Integration\Controller\User;

use App\Document\ChatMessage;
use App\Entity\Seller;
use App\Tests\Integration\AbstractIntegrationTestCase;
use App\Tests\Integration\Fixtures\TestEntityFactory;
use Doctrine\ODM\MongoDB\DocumentManager;

/**
 * Tests d'intégration pour MessageController — /api/conversations
 *
 * Routes couvertes :
 *   POST  /api/conversations
 *   GET   /api/conversations
 *   GET   /api/conversations/unread-count
 *   GET   /api/conversations/{id}
 *   POST  /api/conversations/{id}/messages
 *   PATCH /api/conversations/{id}/read
 *
 * MySQL  : table "conversations"
 * MongoDB: collection "chat_messages" (base compawgnon_test via MONGODB_DB)
 */
class MessageControllerTest extends AbstractIntegrationTestCase
{
    use TestEntityFactory;

    private const PASSWORD = 'Test1234!';

    private string $buyerToken;
    private string $sellerToken;
    private int    $animalId;
    private int    $sellerUserId;
    private int    $buyerUserId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncateTables([
            'notifications', 'refresh_tokens', 'conversations',
            'animals', 'sellers', 'users', 'breeds', 'species',
        ]);
        $this->dropMongoMessages();
        $this->seedData();
    }

    // =========================================================================
    // POST /api/conversations  — démarrer une conversation
    // =========================================================================

    public function testCreerConversation(): void
    {
        $this->post('/api/conversations', ['animal_id' => $this->animalId],
            $this->bearerHeader($this->buyerToken));

        $this->assertSame(201, $this->statusCode());

        $data = $this->json()['data'];
        $this->assertArrayHasKey('id', $data);
        $this->assertArrayHasKey('animal', $data);
        $this->assertArrayHasKey('interlocutor', $data);
        $this->assertTrue($data['is_buyer']);
    }

    public function testCreerConversationIdempotent(): void
    {
        // Première création
        $this->post('/api/conversations', ['animal_id' => $this->animalId],
            $this->bearerHeader($this->buyerToken));
        $this->assertSame(201, $this->statusCode());
        $convId = $this->json()['data']['id'];

        // Deuxième tentative → retourne la conversation existante
        $this->post('/api/conversations', ['animal_id' => $this->animalId],
            $this->bearerHeader($this->buyerToken));
        $this->assertSame(200, $this->statusCode());
        $this->assertSame($convId, $this->json()['data']['id']);
    }

    public function testCreerConversationAnimalInexistant(): void
    {
        $this->post('/api/conversations', ['animal_id' => 99999],
            $this->bearerHeader($this->buyerToken));

        $this->assertSame(404, $this->statusCode());
    }

    public function testCreerConversationMessageSoiMeme(): void
    {
        // Le vendeur ne peut pas s'envoyer un message à lui-même via son propre animal
        $this->post('/api/conversations', ['animal_id' => $this->animalId],
            $this->bearerHeader($this->sellerToken));

        $this->assertSame(400, $this->statusCode());
    }

    // =========================================================================
    // GET /api/conversations — liste des conversations
    // =========================================================================

    public function testListeConversationsVide(): void
    {
        $this->get('/api/conversations', $this->bearerHeader($this->buyerToken));

        $this->assertSame(200, $this->statusCode());
        $this->assertSame([], $this->json()['data']);
    }

    public function testListeConversationsAvecDonnees(): void
    {
        // Créer une conversation
        $this->post('/api/conversations', ['animal_id' => $this->animalId],
            $this->bearerHeader($this->buyerToken));

        $this->get('/api/conversations', $this->bearerHeader($this->buyerToken));

        $this->assertSame(200, $this->statusCode());
        $this->assertCount(1, $this->json()['data']);
    }

    // =========================================================================
    // GET /api/conversations/unread-count
    // =========================================================================

    public function testNombreMessagesNonLus(): void
    {
        $this->get('/api/conversations/unread-count', $this->bearerHeader($this->buyerToken));

        $this->assertSame(200, $this->statusCode());
        $this->assertArrayHasKey('unread', $this->json()['data']);
    }

    // =========================================================================
    // GET /api/conversations/{id}
    // =========================================================================

    public function testDetailConversation(): void
    {
        $this->post('/api/conversations', ['animal_id' => $this->animalId],
            $this->bearerHeader($this->buyerToken));
        $convId = $this->json()['data']['id'];

        $this->get("/api/conversations/{$convId}", $this->bearerHeader($this->buyerToken));

        $this->assertSame(200, $this->statusCode());

        $data = $this->json()['data'];
        $this->assertArrayHasKey('conversation', $data);
        $this->assertArrayHasKey('messages', $data);
        $this->assertSame([], $data['messages']);
    }

    public function testDetailConversationAutreUtilisateur(): void
    {
        $this->post('/api/conversations', ['animal_id' => $this->animalId],
            $this->bearerHeader($this->buyerToken));
        $convId = $this->json()['data']['id'];

        // Un tiers n'a pas accès à cette conversation
        $otherToken = $this->loginAs('other-msg@test.com', self::PASSWORD)['token'];
        $this->get("/api/conversations/{$convId}", $this->bearerHeader($otherToken));

        $this->assertSame(404, $this->statusCode());
    }

    public function testDetailConversationInexistante(): void
    {
        $this->get('/api/conversations/99999', $this->bearerHeader($this->buyerToken));
        $this->assertSame(404, $this->statusCode());
    }

    // =========================================================================
    // POST /api/conversations/{id}/messages — envoyer un message
    // =========================================================================

    public function testEnvoyerMessage(): void
    {
        $this->post('/api/conversations', ['animal_id' => $this->animalId],
            $this->bearerHeader($this->buyerToken));
        $convId = $this->json()['data']['id'];

        $this->post("/api/conversations/{$convId}/messages",
            ['content' => 'Bonjour, cet animal est-il encore disponible ?'],
            $this->bearerHeader($this->buyerToken));

        $this->assertSame(201, $this->statusCode());

        $data = $this->json()['data'];
        $this->assertArrayHasKey('id', $data);
        $this->assertSame('Bonjour, cet animal est-il encore disponible ?', $data['content']);
        $this->assertTrue($data['is_mine']);
    }

    public function testEnvoyerMessageVide(): void
    {
        $this->post('/api/conversations', ['animal_id' => $this->animalId],
            $this->bearerHeader($this->buyerToken));
        $convId = $this->json()['data']['id'];

        $this->post("/api/conversations/{$convId}/messages",
            ['content' => '   '],
            $this->bearerHeader($this->buyerToken));

        $this->assertSame(400, $this->statusCode());
    }

    public function testEnvoyerMessageConversationInexistante(): void
    {
        $this->post('/api/conversations/99999/messages',
            ['content' => 'Test'],
            $this->bearerHeader($this->buyerToken));

        $this->assertSame(404, $this->statusCode());
    }

    // =========================================================================
    // PATCH /api/conversations/{id}/read — marquer comme lu
    // =========================================================================

    public function testMarquerConversationLue(): void
    {
        $this->post('/api/conversations', ['animal_id' => $this->animalId],
            $this->bearerHeader($this->buyerToken));
        $convId = $this->json()['data']['id'];

        $this->patch("/api/conversations/{$convId}/read", [],
            $this->bearerHeader($this->buyerToken));

        $this->assertSame(204, $this->statusCode());
    }

    // =========================================================================
    // Scénario bout-en-bout : échange complet acheteur ↔ vendeur
    // =========================================================================

    public function testScenarioEndToEnd(): void
    {
        // 1) L'acheteur ouvre une conversation
        $this->post('/api/conversations', ['animal_id' => $this->animalId],
            $this->bearerHeader($this->buyerToken));
        $this->assertSame(201, $this->statusCode());
        $convId = $this->json()['data']['id'];

        // 2) L'acheteur envoie un premier message
        $this->post("/api/conversations/{$convId}/messages",
            ['content' => 'Bonjour, cet animal est-il encore disponible ?'],
            $this->bearerHeader($this->buyerToken));
        $this->assertSame(201, $this->statusCode());

        // 3) Le vendeur voit la conversation dans sa liste
        $this->get('/api/conversations', $this->bearerHeader($this->sellerToken));
        $this->assertSame(200, $this->statusCode());
        $sellerConvs = $this->json()['data'];
        $this->assertCount(1, $sellerConvs);
        $this->assertSame($convId, $sellerConvs[0]['id']);

        // 4) Le vendeur lit le fil et répond
        $this->get("/api/conversations/{$convId}", $this->bearerHeader($this->sellerToken));
        $this->assertSame(200, $this->statusCode());
        $this->assertCount(1, $this->json()['data']['messages']);

        $this->post("/api/conversations/{$convId}/messages",
            ['content' => 'Oui, animal disponible — contactez-nous pour organiser une visite !'],
            $this->bearerHeader($this->sellerToken));
        $this->assertSame(201, $this->statusCode());

        // 5) L'acheteur relit le fil : voit maintenant 2 messages
        $this->get("/api/conversations/{$convId}", $this->bearerHeader($this->buyerToken));
        $this->assertSame(200, $this->statusCode());
        $messages = $this->json()['data']['messages'];
        $this->assertCount(2, $messages);

        // 6) L'acheteur marque la conversation comme lue
        $this->patch("/api/conversations/{$convId}/read", [],
            $this->bearerHeader($this->buyerToken));
        $this->assertSame(204, $this->statusCode());

        // 7) Le compteur de non-lus de l'acheteur est bien à 0
        $this->get('/api/conversations/unread-count', $this->bearerHeader($this->buyerToken));
        $this->assertSame(200, $this->statusCode());
        $this->assertSame(0, $this->json()['data']['unread']);
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private function seedData(): void
    {
        $species = $this->createSpecies('Lapin', 'lapin-msg-test');

        $sellerData = $this->createApprovedSeller('seller-msg');
        /** @var Seller $seller */
        $seller     = $sellerData['seller'];
        $sellerUser = $sellerData['user'];

        $animal = $this->createPublishedAnimal($seller, $species);
        $buyer  = $this->createVerifiedBuyer('buyer-msg@test.com');
        $this->createVerifiedBuyer('other-msg@test.com');

        $this->em->flush();

        $this->animalId    = $animal->getId();
        $this->sellerUserId = $sellerUser->getId();
        $this->buyerUserId  = $buyer->getId();

        // loginAs() réinitialise l'EM → IDs scalaires suffisent
        $this->buyerToken  = $this->loginAs('buyer-msg@test.com', self::PASSWORD)['token'];
        $this->sellerToken = $this->loginAs('seller-msg@seller.test', self::PASSWORD)['token'];
    }

    private function dropMongoMessages(): void
    {
        $dm = static::getContainer()->get(DocumentManager::class);
        $dm->getDocumentCollection(ChatMessage::class)->drop();
    }
}
