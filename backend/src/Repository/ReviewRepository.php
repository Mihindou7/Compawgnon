<?php

namespace App\Repository;

use App\Entity\Review;
use App\Entity\Seller;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

class ReviewRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Review::class);
    }

    public function findByBuyerQueryBuilder(User $buyer): QueryBuilder
    {
        return $this->createQueryBuilder('r')
            ->leftJoin('r.seller', 's')
            ->addSelect('s')
            ->where('r.buyer = :buyer')
            ->setParameter('buyer', $buyer)
            ->orderBy('r.createdAt', 'DESC');
    }

    public function findForAdminQueryBuilder(?string $status = null, ?int $sellerId = null): QueryBuilder
    {
        $qb = $this->createQueryBuilder('r')
            ->leftJoin('r.seller', 's')
            ->leftJoin('r.buyer', 'b')
            ->addSelect('s', 'b')
            ->orderBy('r.createdAt', 'ASC');

        if ($status) {
            $qb->where('r.status = :status')->setParameter('status', $status);
        }
        if ($sellerId) {
            $qb->andWhere('r.seller = :seller')->setParameter('seller', $sellerId);
        }

        return $qb;
    }

    /** Last N published reviews for a seller's public profile */
    public function findPublishedBySellerOrdered(Seller $seller, int $limit = 5): array
    {
        return $this->createQueryBuilder('r')
            ->where('r.seller = :seller')
            ->andWhere('r.status = :status')
            ->setParameter('seller', $seller)
            ->setParameter('status', 'published')
            ->orderBy('r.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    public function findPublishedRecent(int $limit = 10): array
    {
        return $this->createQueryBuilder('r')
            ->leftJoin('r.buyer', 'b')
            ->addSelect('b')
            ->where('r.status = :status')
            ->andWhere('r.comment IS NOT NULL')
            ->andWhere('r.rating >= 4')
            ->setParameter('status', 'published')
            ->orderBy('r.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    public function getSellerRating(int $sellerId): array
    {
        $result = $this->createQueryBuilder('r')
            ->select('AVG(r.rating) as avg_rating, COUNT(r.id) as total')
            ->where('r.seller = :seller')
            ->andWhere('r.status = :status')
            ->setParameter('seller', $sellerId)
            ->setParameter('status', 'published')
            ->getQuery()
            ->getSingleResult();

        return [
            'avg'   => $result['avg_rating'] ? round((float) $result['avg_rating'], 1) : null,
            'count' => (int) $result['total'],
        ];
    }
}
