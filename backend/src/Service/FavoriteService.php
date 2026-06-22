<?php

namespace App\Service;

use App\Entity\Animal;
use App\Entity\Favorite;
use App\Entity\User;
use App\Repository\FavoriteRepository;
use Doctrine\ORM\EntityManagerInterface;

class FavoriteService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly FavoriteRepository $favoriteRepo,
    ) {
    }

    public function add(User $user, Animal $animal): void
    {
        if ($this->favoriteRepo->findOneBy(['user' => $user, 'animal' => $animal])) {
            return; // idempotent
        }

        $favorite = new Favorite();
        $favorite->setUser($user);
        $favorite->setAnimal($animal);
        $this->em->persist($favorite);
        $this->em->flush();
    }

    public function remove(User $user, Animal $animal): void
    {
        $favorite = $this->favoriteRepo->findOneBy(['user' => $user, 'animal' => $animal]);
        if ($favorite) {
            $this->em->remove($favorite);
            $this->em->flush();
        }
        // idempotent — no error if not found
    }
}
