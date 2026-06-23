<?php

namespace App\Service;

use App\Entity\Notification;
use App\Entity\User;
use App\Repository\NotificationRepository;
use Doctrine\ORM\EntityManagerInterface;

class NotificationService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly NotificationRepository $repo,
    ) {}

    public function create(User $user, string $type, array $payload): Notification
    {
        $notif = new Notification();
        $notif->setUser($user);
        $notif->setType($type);
        $notif->setPayload($payload);

        $this->em->persist($notif);
        $this->em->flush();

        return $notif;
    }

    public function markAsRead(int $id, User $user): void
    {
        $notif = $this->repo->find($id);
        if (!$notif || $notif->getUser()->getId() !== $user->getId()) return;
        if ($notif->isRead()) return;

        $notif->setReadAt(new \DateTimeImmutable());
        $this->em->flush();
    }

    public function markAllRead(User $user): void
    {
        $this->em->createQuery(
            'UPDATE App\Entity\Notification n SET n.readAt = :now WHERE n.user = :user AND n.readAt IS NULL'
        )
        ->setParameter('now', new \DateTimeImmutable())
        ->setParameter('user', $user)
        ->execute();
    }

    public function getUnreadCount(User $user): int
    {
        return $this->repo->countUnreadForUser($user);
    }
}
