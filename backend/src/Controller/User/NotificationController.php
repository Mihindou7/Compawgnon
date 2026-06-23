<?php

namespace App\Controller\User;

use App\Controller\AbstractApiController;
use App\Entity\User;
use App\Repository\NotificationRepository;
use App\Service\NotificationService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/notifications')]
#[IsGranted('ROLE_USER')]
class NotificationController extends AbstractApiController
{
    #[Route('', methods: ['GET'])]
    public function list(
        #[CurrentUser] User $user,
        NotificationRepository $repo,
    ): JsonResponse {
        $notifications = $repo->findRecentForUser($user, 20);
        return $this->success(array_map(fn($n) => $this->serialize($n), $notifications));
    }

    #[Route('/count', methods: ['GET'])]
    public function count(
        #[CurrentUser] User $user,
        NotificationService $service,
    ): JsonResponse {
        return $this->success(['unread' => $service->getUnreadCount($user)]);
    }

    #[Route('/{id}/read', methods: ['PATCH'])]
    public function markRead(
        int $id,
        #[CurrentUser] User $user,
        NotificationService $service,
    ): JsonResponse {
        $service->markAsRead($id, $user);
        return $this->noContent();
    }

    #[Route('/read-all', methods: ['PATCH'])]
    public function markAllRead(
        #[CurrentUser] User $user,
        NotificationService $service,
    ): JsonResponse {
        $service->markAllRead($user);
        return $this->noContent();
    }

    private function serialize(\App\Entity\Notification $n): array
    {
        return [
            'id'         => $n->getId(),
            'type'       => $n->getType(),
            'payload'    => $n->getPayload(),
            'read'       => $n->isRead(),
            'created_at' => $n->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ];
    }
}
