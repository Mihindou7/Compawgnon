<?php

namespace App\Repository;

use App\Entity\Conversation;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class ConversationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Conversation::class);
    }

    public function findForUser(User $user): array
    {
        return $this->createQueryBuilder('c')
            ->leftJoin('c.animal', 'a')
            ->leftJoin('a.media', 'm', 'WITH', 'm.isCover = true')
            ->addSelect('a', 'm')
            ->where('c.buyer = :user OR c.seller = :user')
            ->setParameter('user', $user)
            ->orderBy('c.lastMessageAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findOneByAnimalAndBuyer(int $animalId, int $buyerId): ?Conversation
    {
        return $this->createQueryBuilder('c')
            ->where('c.animal = :animal')
            ->andWhere('c.buyer = :buyer')
            ->setParameter('animal', $animalId)
            ->setParameter('buyer', $buyerId)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /** @return int[] */
    public function findIdsForUser(User $user): array
    {
        $rows = $this->createQueryBuilder('c')
            ->select('c.id')
            ->where('c.buyer = :user OR c.seller = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->getScalarResult();

        return array_column($rows, 'id');
    }
}
