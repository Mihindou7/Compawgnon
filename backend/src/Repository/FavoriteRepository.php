<?php

namespace App\Repository;

use App\Entity\Favorite;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

class FavoriteRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Favorite::class);
    }

    public function findByUserQueryBuilder(User $user): QueryBuilder
    {
        return $this->createQueryBuilder('f')
            ->leftJoin('f.animal', 'a')
            ->leftJoin('a.media', 'm', 'WITH', 'm.isCover = true')
            ->addSelect('a', 'm')
            ->where('f.user = :user')
            ->setParameter('user', $user)
            ->orderBy('f.createdAt', 'DESC');
    }
}
