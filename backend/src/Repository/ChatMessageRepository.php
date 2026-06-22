<?php

namespace App\Repository;

use App\Document\ChatMessage;
use Doctrine\ODM\MongoDB\DocumentManager;
use Doctrine\ODM\MongoDB\Query\Builder;

class ChatMessageRepository
{
    public function __construct(private readonly DocumentManager $dm) {}

    private function qb(): Builder
    {
        return $this->dm->createQueryBuilder(ChatMessage::class);
    }

    public function save(ChatMessage $message): void
    {
        $this->dm->persist($message);
        $this->dm->flush();
    }

    public function findByConversation(int $convId): array
    {
        return $this->qb()
            ->field('conversationId')->equals($convId)
            ->sort('createdAt', 1)
            ->getQuery()
            ->execute()
            ->toArray();
    }

    public function findLastForConversation(int $convId): ?ChatMessage
    {
        return $this->qb()
            ->field('conversationId')->equals($convId)
            ->sort('createdAt', -1)
            ->limit(1)
            ->getQuery()
            ->getSingleResult();
    }

    public function countUnreadInConversation(int $convId, int $readerId): int
    {
        return (int) $this->qb()
            ->count()
            ->field('conversationId')->equals($convId)
            ->field('senderId')->notEqual($readerId)
            ->field('readAt')->equals(null)
            ->getQuery()
            ->execute();
    }

    public function countAllUnreadForUser(array $convIds, int $readerId): int
    {
        if (empty($convIds)) {
            return 0;
        }

        return (int) $this->qb()
            ->count()
            ->field('conversationId')->in($convIds)
            ->field('senderId')->notEqual($readerId)
            ->field('readAt')->equals(null)
            ->getQuery()
            ->execute();
    }

    public function markConversationRead(int $convId, int $readerId): void
    {
        $this->qb()
            ->updateMany()
            ->field('conversationId')->equals($convId)
            ->field('senderId')->notEqual($readerId)
            ->field('readAt')->equals(null)
            ->field('readAt')->set(new \DateTime())
            ->getQuery()
            ->execute();
    }
}
