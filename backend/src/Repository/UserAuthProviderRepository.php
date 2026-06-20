<?php

namespace App\Repository;

use App\Entity\UserAuthProvider;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class UserAuthProviderRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, UserAuthProvider::class);
    }

    public function findByProvider(string $provider, string $providerUserId): ?UserAuthProvider
    {
        return $this->findOneBy([
            'provider' => $provider,
            'providerUserId' => $providerUserId,
        ]);
    }
}
