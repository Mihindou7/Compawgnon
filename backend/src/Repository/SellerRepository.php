<?php

namespace App\Repository;

use App\Entity\Seller;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

class SellerRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Seller::class);
    }

    public function findForAdminQueryBuilder(?string $verifiedStatus = null): QueryBuilder
    {
        $qb = $this->createQueryBuilder('s')
            ->leftJoin('s.user', 'u')
            ->addSelect('u')
            ->orderBy('s.createdAt', 'ASC'); // oldest first for moderation queue

        if ($verifiedStatus) {
            $qb->where('s.verifiedStatus = :status')->setParameter('status', $verifiedStatus);
        }

        return $qb;
    }
}
