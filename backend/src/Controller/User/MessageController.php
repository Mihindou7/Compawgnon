<?php

namespace App\Controller\User;

use App\Controller\AbstractApiController;
use App\Document\ChatMessage;
use App\Entity\Conversation;
use App\Entity\User;
use App\Repository\AnimalRepository;
use App\Repository\ChatMessageRepository;
use App\Repository\ConversationRepository;
use App\Service\NotificationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/conversations')]
#[IsGranted('ROLE_USER')]
class MessageController extends AbstractApiController
{
    #[Route('', methods: ['POST'])]
    public function start(
        #[CurrentUser] User $user,
        Request $request,
        AnimalRepository $animalRepo,
        ConversationRepository $convRepo,
        EntityManagerInterface $em,
        ChatMessageRepository $msgRepo,
    ): JsonResponse {
        $body     = json_decode($request->getContent(), true);
        $animalId = (int) ($body['animal_id'] ?? 0);

        $animal = $animalRepo->find($animalId);
        if (!$animal || $animal->getStatus() !== 'published') {
            return $this->error('Animal not found or not available.', 404);
        }

        $sellerUser = $animal->getSeller()->getUser();
        if ($sellerUser->getId() === $user->getId()) {
            return $this->error('You cannot message yourself.', 400);
        }

        $existing = $convRepo->findOneByAnimalAndBuyer($animalId, $user->getId());
        if ($existing) {
            return $this->success($this->serializeConversation($existing, $user, $msgRepo));
        }

        $conv = new Conversation();
        $conv->setAnimal($animal);
        $conv->setBuyer($user);
        $conv->setSeller($sellerUser);

        $em->persist($conv);
        $em->flush();

        return $this->created($this->serializeConversation($conv, $user, $msgRepo));
    }

    #[Route('', methods: ['GET'])]
    public function list(
        #[CurrentUser] User $user,
        ConversationRepository $convRepo,
        ChatMessageRepository $msgRepo,
    ): JsonResponse {
        $convs = $convRepo->findForUser($user);

        return $this->success(
            array_map(fn($c) => $this->serializeConversation($c, $user, $msgRepo), $convs)
        );
    }

    #[Route('/unread-count', methods: ['GET'])]
    public function unreadCount(
        #[CurrentUser] User $user,
        ConversationRepository $convRepo,
        ChatMessageRepository $msgRepo,
    ): JsonResponse {
        $convIds = $convRepo->findIdsForUser($user);

        return $this->success(['unread' => $msgRepo->countAllUnreadForUser($convIds, $user->getId())]);
    }

    #[Route('/{id}', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function show(
        int $id,
        #[CurrentUser] User $user,
        ConversationRepository $convRepo,
        ChatMessageRepository $msgRepo,
    ): JsonResponse {
        $conv = $convRepo->find($id);
        if (!$conv || !$conv->hasParticipant($user)) {
            return $this->error('Conversation not found.', 404);
        }

        $msgRepo->markConversationRead($id, $user->getId());

        return $this->success([
            'conversation' => $this->serializeConversation($conv, $user, $msgRepo),
            'messages'     => array_map(
                fn($m) => $this->serializeMessage($m, $user),
                $msgRepo->findByConversation($id),
            ),
        ]);
    }

    #[Route('/{id}/messages', methods: ['POST'])]
    public function send(
        int $id,
        #[CurrentUser] User $user,
        Request $request,
        ConversationRepository $convRepo,
        ChatMessageRepository $msgRepo,
        EntityManagerInterface $em,
        NotificationService $notificationService,
    ): JsonResponse {
        $conv = $convRepo->find($id);
        if (!$conv || !$conv->hasParticipant($user)) {
            return $this->error('Conversation not found.', 404);
        }

        $body    = json_decode($request->getContent(), true);
        $content = trim($body['content'] ?? '');
        if ($content === '') {
            return $this->error('Message cannot be empty.', 400);
        }

        $msg = new ChatMessage();
        $msg->setConversationId($conv->getId());
        $msg->setSenderId($user->getId());
        $msg->setContent($content);

        $msgRepo->save($msg);

        $conv->setLastMessageAt(new \DateTimeImmutable());
        $em->flush();

        $recipient = $conv->getBuyer()->getId() === $user->getId()
            ? $conv->getSeller()
            : $conv->getBuyer();

        $notificationService->create(
            $recipient,
            'new_message',
            [
                'conversation_id' => $conv->getId(),
                'animal_title'    => $conv->getAnimal()->getTitle(),
                'sender_name'     => $user->getFirstName() ?? $user->getEmail(),
            ]
        );

        return $this->created($this->serializeMessage($msg, $user));
    }

    #[Route('/{id}/read', methods: ['PATCH'])]
    public function markRead(
        int $id,
        #[CurrentUser] User $user,
        ConversationRepository $convRepo,
        ChatMessageRepository $msgRepo,
    ): JsonResponse {
        $conv = $convRepo->find($id);
        if (!$conv || !$conv->hasParticipant($user)) {
            return $this->error('Conversation not found.', 404);
        }

        $msgRepo->markConversationRead($id, $user->getId());

        return $this->noContent();
    }

    private function serializeConversation(
        Conversation $c,
        User $currentUser,
        ChatMessageRepository $msgRepo,
    ): array {
        $lastMsg = $msgRepo->findLastForConversation($c->getId());
        $unread  = $msgRepo->countUnreadInConversation($c->getId(), $currentUser->getId());

        $coverUrl = null;
        foreach ($c->getAnimal()->getMedia() as $m) {
            if ($m->isCover()) {
                $coverUrl = $m->getFileUrl();
                break;
            }
        }

        $interlocutor = $c->getBuyer()->getId() === $currentUser->getId()
            ? $c->getSeller()
            : $c->getBuyer();

        return [
            'id'             => $c->getId(),
            'animal'         => [
                'id'        => $c->getAnimal()->getId(),
                'title'     => $c->getAnimal()->getTitle(),
                'cover_url' => $coverUrl,
            ],
            'interlocutor'   => [
                'id'   => $interlocutor->getId(),
                'name' => trim(($interlocutor->getFirstName() ?? '') . ' ' . ($interlocutor->getLastName() ?? '')) ?: $interlocutor->getEmail(),
            ],
            'is_buyer'       => $c->getBuyer()->getId() === $currentUser->getId(),
            'unread_count'   => $unread,
            'last_message'   => $lastMsg ? [
                'content'    => mb_substr($lastMsg->getContent(), 0, 80),
                'created_at' => $lastMsg->getCreatedAt()->format(\DateTimeInterface::ATOM),
            ] : null,
            'last_message_at' => $c->getLastMessageAt()?->format(\DateTimeInterface::ATOM),
            'created_at'     => $c->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ];
    }

    private function serializeMessage(ChatMessage $m, User $currentUser): array
    {
        return [
            'id'         => $m->getId(),
            'content'    => $m->getContent(),
            'sender_id'  => $m->getSenderId(),
            'is_mine'    => $m->getSenderId() === $currentUser->getId(),
            'read'       => $m->isRead(),
            'created_at' => $m->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ];
    }
}
