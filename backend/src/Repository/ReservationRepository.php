<?php

namespace App\Repository;

use App\Entity\Reservation;
use App\Entity\Seller;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

class ReservationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Reservation::class);
    }

    public function findByBuyerQueryBuilder(User $buyer, ?string $status = null): QueryBuilder
    {
        $qb = $this->createQueryBuilder('r')
            ->leftJoin('r.animal', 'a')
            ->leftJoin('r.seller', 's')
            ->addSelect('a', 's')
            ->where('r.buyer = :buyer')
            ->setParameter('buyer', $buyer)
            ->orderBy('r.createdAt', 'DESC');

        if ($status) {
            $qb->andWhere('r.status = :status')->setParameter('status', $status);
        }

        return $qb;
    }

    public function countByBuyerAndStatus(User $buyer, string $status): int
    {
        return (int) $this->createQueryBuilder('r')
            ->select('COUNT(r.id)')
            ->where('r.buyer = :buyer')
            ->andWhere('r.status = :status')
            ->setParameter('buyer', $buyer)
            ->setParameter('status', $status)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function findBySellerQueryBuilder(Seller $seller, ?string $status = null): QueryBuilder
    {
        $qb = $this->createQueryBuilder('r')
            ->leftJoin('r.animal', 'a')
            ->leftJoin('a.media', 'm', 'WITH', 'm.isCover = true')
            ->leftJoin('r.buyer', 'b')
            ->addSelect('a', 'm', 'b')
            ->where('r.seller = :seller')
            ->setParameter('seller', $seller)
            ->orderBy('r.createdAt', 'DESC');

        if ($status) {
            $qb->andWhere('r.status = :status')->setParameter('status', $status);
        }

        return $qb;
    }
}
