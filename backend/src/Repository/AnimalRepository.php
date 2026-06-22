<?php

namespace App\Repository;

use App\Entity\Animal;
use App\Entity\Seller;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

class AnimalRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Animal::class);
    }

    /** Public catalogue search — only published animals */
    public function findPublicQueryBuilder(array $filters = []): QueryBuilder
    {
        $now = new \DateTimeImmutable();

        $qb = $this->createQueryBuilder('a')
            ->leftJoin('a.species', 's')
            ->leftJoin('a.breed', 'b')
            ->leftJoin('a.seller', 'seller')
            ->leftJoin('a.media', 'm', 'WITH', 'm.isCover = true')
            ->addSelect('s', 'b', 'seller', 'm')
            ->where('a.status = :status')
            ->setParameter('status', 'published');

        if (!empty($filters['q'])) {
            $qb->andWhere('a.title LIKE :q OR a.description LIKE :q OR s.name LIKE :q OR b.name LIKE :q OR a.city LIKE :q')
               ->setParameter('q', '%' . trim($filters['q']) . '%');
        }
        if (!empty($filters['species_id'])) {
            $qb->andWhere('s.id = :speciesId')->setParameter('speciesId', (int) $filters['species_id']);
        }
        if (!empty($filters['species_slug'])) {
            $qb->andWhere('s.slug = :speciesSlug')->setParameter('speciesSlug', $filters['species_slug']);
        }
        if (!empty($filters['breed_id'])) {
            $qb->andWhere('b.id = :breedId')->setParameter('breedId', (int) $filters['breed_id']);
        }
        if (!empty($filters['breed_slug'])) {
            $qb->andWhere('b.slug = :breedSlug')->setParameter('breedSlug', $filters['breed_slug']);
        }
        if (!empty($filters['sex'])) {
            $qb->andWhere('a.sex = :sex')->setParameter('sex', $filters['sex']);
        }
        if (!empty($filters['city'])) {
            $qb->andWhere('a.city LIKE :city')->setParameter('city', '%' . $filters['city'] . '%');
        }
        if (!empty($filters['postal_code'])) {
            $qb->andWhere('a.postalCode = :postalCode')->setParameter('postalCode', $filters['postal_code']);
        }
        if (isset($filters['price_min']) && $filters['price_min'] !== '') {
            $qb->andWhere('a.price >= :priceMin')->setParameter('priceMin', (float) $filters['price_min']);
        }
        if (isset($filters['price_max']) && $filters['price_max'] !== '') {
            $qb->andWhere('a.price <= :priceMax')->setParameter('priceMax', (float) $filters['price_max']);
        }
        if (!empty($filters['seller_type'])) {
            $qb->andWhere('seller.type = :sellerType')->setParameter('sellerType', $filters['seller_type']);
        }
        if (!empty($filters['region'])) {
            $qb->andWhere('a.region = :region')->setParameter('region', $filters['region']);
        }
        if (!empty($filters['department_code'])) {
            $qb->andWhere('a.departmentCode = :deptCode')->setParameter('deptCode', $filters['department_code']);
        }
        if (!empty($filters['lat']) && !empty($filters['lng']) && !empty($filters['radius_km'])) {
            $lat    = (float) $filters['lat'];
            $lng    = (float) $filters['lng'];
            $radius = (float) $filters['radius_km'];
            $qb->andWhere('a.latitude IS NOT NULL')
               ->andWhere('(6371 * acos(cos(radians(:geoLat)) * cos(radians(a.latitude)) * cos(radians(a.longitude) - radians(:geoLng)) + sin(radians(:geoLat)) * sin(radians(a.latitude)))) <= :geoRadius')
               ->setParameter('geoLat', $lat)
               ->setParameter('geoLng', $lng)
               ->setParameter('geoRadius', $radius);
        }
        if (isset($filters['age_min']) && $filters['age_min'] !== '') {
            $qb->andWhere('a.birthdate <= :maxBirthdate')
               ->setParameter('maxBirthdate', $now->modify('-' . (int) $filters['age_min'] . ' months'));
        }
        if (isset($filters['age_max']) && $filters['age_max'] !== '') {
            $qb->andWhere('a.birthdate >= :minBirthdate')
               ->setParameter('minBirthdate', $now->modify('-' . (int) $filters['age_max'] . ' months'));
        }

        match ($filters['sort'] ?? 'published_at_desc') {
            'price_asc'  => $qb->orderBy('a.price', 'ASC'),
            'price_desc' => $qb->orderBy('a.price', 'DESC'),
            'age_asc'    => $qb->orderBy('a.birthdate', 'DESC'),
            default      => $qb->orderBy('a.publishedAt', 'DESC'),
        };

        return $qb;
    }

    /** Seller's own animals list */
    public function findBySellerQueryBuilder(Seller $seller, ?string $status = null): QueryBuilder
    {
        $qb = $this->createQueryBuilder('a')
            ->leftJoin('a.species', 'sp')
            ->leftJoin('a.breed', 'b')
            ->leftJoin('a.media', 'm', 'WITH', 'm.isCover = true')
            ->addSelect('sp', 'b', 'm')
            ->where('a.seller = :seller')
            ->setParameter('seller', $seller)
            ->orderBy('a.createdAt', 'DESC');

        if ($status) {
            $qb->andWhere('a.status = :status')->setParameter('status', $status);
        }

        return $qb;
    }

    /** Admin moderation list */
    public function findForAdminQueryBuilder(?string $status = null, ?int $sellerId = null): QueryBuilder
    {
        $qb = $this->createQueryBuilder('a')
            ->leftJoin('a.seller', 's')
            ->leftJoin('a.species', 'sp')
            ->leftJoin('a.breed', 'b')
            ->leftJoin('a.media', 'm', 'WITH', 'm.isCover = true')
            ->addSelect('s', 'sp', 'b', 'm')
            ->orderBy('a.createdAt', 'ASC');

        if ($status) {
            $qb->andWhere('a.status = :status')->setParameter('status', $status);
        }
        if ($sellerId) {
            $qb->andWhere('a.seller = :seller')->setParameter('seller', $sellerId);
        }

        return $qb;
    }

    public function findSimilar(Animal $animal, int $limit = 3): array
    {
        $qb = $this->createQueryBuilder('a')
            ->leftJoin('a.media', 'm', 'WITH', 'm.isCover = true')
            ->addSelect('m')
            ->where('a.status = :status')
            ->andWhere('a.id != :id')
            ->setParameter('status', 'published')
            ->setParameter('id', $animal->getId())
            ->setMaxResults($limit);

        if ($animal->getBreed()) {
            $results = (clone $qb)->andWhere('a.breed = :breed')
                ->setParameter('breed', $animal->getBreed())
                ->getQuery()->getResult();
            if (count($results) >= $limit) return $results;
        }

        return (clone $qb)->andWhere('a.species = :species')
            ->setParameter('species', $animal->getSpecies())
            ->getQuery()->getResult();
    }

    /** Active published animals for a seller's public profile */
    public function findPublishedBySellerOrdered(Seller $seller, int $limit = 6): array
    {
        return $this->createQueryBuilder('a')
            ->leftJoin('a.media', 'm', 'WITH', 'm.isCover = true')
            ->addSelect('m')
            ->where('a.seller = :seller')
            ->andWhere('a.status = :status')
            ->setParameter('seller', $seller)
            ->setParameter('status', 'published')
            ->orderBy('a.publishedAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    public function countPublishedBySpecies(int $speciesId): int
    {
        return (int) $this->createQueryBuilder('a')
            ->select('COUNT(a.id)')
            ->where('a.species = :s')->andWhere('a.status = :st')
            ->setParameter('s', $speciesId)->setParameter('st', 'published')
            ->getQuery()->getSingleScalarResult();
    }

    public function countPublishedByBreed(int $breedId): int
    {
        return (int) $this->createQueryBuilder('a')
            ->select('COUNT(a.id)')
            ->where('a.breed = :b')->andWhere('a.status = :st')
            ->setParameter('b', $breedId)->setParameter('st', 'published')
            ->getQuery()->getSingleScalarResult();
    }
}
