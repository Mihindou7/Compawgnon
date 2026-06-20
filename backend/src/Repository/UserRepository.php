<?php

namespace App\Repository;

use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Security\Core\Exception\UnsupportedUserException;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\PasswordUpgraderInterface;

class UserRepository extends ServiceEntityRepository implements PasswordUpgraderInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    public function upgradePassword(PasswordAuthenticatedUserInterface $user, string $newHashedPassword): void
    {
        if (!$user instanceof User) {
            throw new UnsupportedUserException(sprintf('Instances of "%s" are not supported.', $user::class));
        }
        $user->setPasswordHash($newHashedPassword);
        $this->getEntityManager()->persist($user);
        $this->getEntityManager()->flush();
    }

    public function findByEmail(string $email): ?User
    {
        return $this->findOneBy(['email' => $email]);
    }

    public function findForAdminQueryBuilder(?string $status = null, ?string $search = null): QueryBuilder
    {
        $qb = $this->createQueryBuilder('u')
            ->leftJoin('u.seller', 's')
            ->addSelect('s')
            ->orderBy('u.createdAt', 'DESC');

        if ($status) {
            $qb->andWhere('u.status = :status')->setParameter('status', $status);
        }
        if ($search) {
            $qb->andWhere('u.email LIKE :s OR u.firstName LIKE :s OR u.lastName LIKE :s')
               ->setParameter('s', '%' . $search . '%');
        }

        return $qb;
    }
}
