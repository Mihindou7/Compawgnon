<?php

namespace App\Repository;

use App\Entity\Species;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class SpeciesRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Species::class);
    }

    /** All species ordered alphabetically, breeds eagerly loaded */
    public function findAllWithBreeds(): array
    {
        return $this->createQueryBuilder('s')
            ->leftJoin('s.breeds', 'b')
            ->addSelect('b')
            ->orderBy('s.name', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findBySlug(string $slug): ?Species
    {
        return $this->findOneBy(['slug' => $slug]);
    }
}
