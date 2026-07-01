<?php

namespace App\Tests\Unit\Service;

use App\Entity\Animal;
use App\Entity\Favorite;
use App\Entity\User;
use App\Repository\FavoriteRepository;
use App\Service\FavoriteService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class FavoriteServiceTest extends TestCase
{
    private MockObject&EntityManagerInterface $em;
    private FavoriteRepository $favoriteRepo;
    private FavoriteService $service;

    protected function setUp(): void
    {
        $this->em           = $this->createMock(EntityManagerInterface::class);
        $this->favoriteRepo = $this->createStub(FavoriteRepository::class);

        $this->service = new FavoriteService($this->em, $this->favoriteRepo);
    }

    // =========================================================================
    // add()
    // =========================================================================

    public function testAddEstIdempotentSiLeFavoriExisteDeja(): void
    {
        $this->favoriteRepo->method('findOneBy')->willReturn(new Favorite());

        // persist et flush ne doivent jamais être appelés si le favori existe déjà
        $this->em->expects($this->never())->method('persist');
        $this->em->expects($this->never())->method('flush');

        $this->service->add(new User(), new Animal());
        $this->addToAssertionCount(1); // confirme qu'aucune exception n'a été levée
    }

    public function testAddCreeLeFavoriSilNexistePasEncore(): void
    {
        $this->favoriteRepo->method('findOneBy')->willReturn(null);
        $this->em->expects($this->once())->method('persist')->with($this->isInstanceOf(Favorite::class));
        $this->em->expects($this->once())->method('flush');

        $this->service->add(new User(), new Animal());
    }

    // =========================================================================
    // remove()
    // =========================================================================

    public function testRemoveEstIdempotentSiLeFavoriNexistePas(): void
    {
        $this->favoriteRepo->method('findOneBy')->willReturn(null);

        // remove et flush ne doivent jamais être appelés si le favori est absent
        $this->em->expects($this->never())->method('remove');
        $this->em->expects($this->never())->method('flush');

        $this->service->remove(new User(), new Animal());
        $this->addToAssertionCount(1); // confirme qu'aucune exception n'a été levée
    }

    public function testRemoveSupprimeLeFavoriSilExiste(): void
    {
        $favorite = new Favorite();

        $this->favoriteRepo->method('findOneBy')->willReturn($favorite);
        $this->em->expects($this->once())->method('remove')->with($favorite);
        $this->em->expects($this->once())->method('flush');

        $this->service->remove(new User(), new Animal());
    }
}
