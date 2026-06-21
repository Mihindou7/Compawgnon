<?php

namespace App\Repository;

use App\Entity\Breed;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class BreedRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Breed::class);
    }

    /** All breeds (optionally filtered by species) with species eagerly loaded */
    public function findWithSpeciesFiltered(?int $speciesId = null, ?string $speciesSlug = null): array
    {
        $qb = $this->createQueryBuilder('b')
            ->leftJoin('b.species', 's')
            ->addSelect('s')
            ->orderBy('b.name', 'ASC');

        if ($speciesId) {
            $qb->where('b.species = :sid')->setParameter('sid', $speciesId);
        } elseif ($speciesSlug) {
            $qb->leftJoin('b.species', 'sf')
               ->where('sf.slug = :slug')
               ->setParameter('slug', $speciesSlug);
        }

        return $qb->getQuery()->getResult();
    }

    public function findBySlugWithSpecies(string $slug): ?Breed
    {
        return $this->createQueryBuilder('b')
            ->leftJoin('b.species', 's')
            ->addSelect('s')
            ->where('b.slug = :slug')
            ->setParameter('slug', $slug)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
