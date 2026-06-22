<?php

namespace App\Repository;

use App\Entity\ContactMessage;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

class ContactMessageRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ContactMessage::class);
    }

    public function findForAdminQueryBuilder(?string $status = null, ?string $search = null): QueryBuilder
    {
        $qb = $this->createQueryBuilder('c')
            ->leftJoin('c.handledBy', 'h')
            ->addSelect('h')
            ->orderBy('c.createdAt', 'DESC');

        if ($status && in_array($status, ContactMessage::STATUSES, true)) {
            $qb->andWhere('c.status = :status')->setParameter('status', $status);
        }

        if ($search) {
            $qb->andWhere('c.name LIKE :search OR c.email LIKE :search OR c.message LIKE :search')
                ->setParameter('search', '%' . $search . '%');
        }

        return $qb;
    }

    /** @return array<string,int> counts keyed by status */
    public function countByStatus(): array
    {
        $rows = $this->createQueryBuilder('c')
            ->select('c.status AS status, COUNT(c.id) AS total')
            ->groupBy('c.status')
            ->getQuery()
            ->getResult();

        $counts = array_fill_keys(ContactMessage::STATUSES, 0);
        foreach ($rows as $row) {
            $counts[$row['status']] = (int) $row['total'];
        }

        return $counts;
    }
}
