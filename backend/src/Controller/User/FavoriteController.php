<?php

namespace App\Controller\User;

use App\Controller\AbstractApiController;
use App\Entity\Favorite;
use App\Entity\User;
use App\Repository\AnimalRepository;
use App\Repository\FavoriteRepository;
use App\Service\FavoriteService;
use App\Service\PaginationService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/me/favorites')]
#[IsGranted('ROLE_USER')]
class FavoriteController extends AbstractApiController
{
    #[Route('', methods: ['GET'])]
    public function index(
        #[CurrentUser] User $user,
        Request $request,
        FavoriteRepository $repo,
        PaginationService $paginator,
    ): JsonResponse {
        $result = $paginator->paginate(
            $repo->findByUserQueryBuilder($user),
            (int) $request->query->get('page', 1),
            (int) $request->query->get('limit', 20)
        );

        $result['data'] = array_map(fn(Favorite $f) => [
            'id'         => $f->getId(),
            'animal'     => [
                'id'        => $f->getAnimal()->getId(),
                'title'     => $f->getAnimal()->getTitle(),
                'price'     => (float) $f->getAnimal()->getPrice(),
                'status'    => $f->getAnimal()->getStatus(),
                'sex'       => $f->getAnimal()->getSex(),
                'cover_url' => ($f->getAnimal()->getMedia()->filter(fn($m) => $m->isCover())->first() ?: null)?->getFileUrl()
                              ?? ($f->getAnimal()->getMedia()->first() ?: null)?->getFileUrl(),
                'city'      => $f->getAnimal()->getCity(),
            ],
            'created_at' => $f->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ], $result['data']);

        return $this->json($result);
    }

    #[Route('/ids', methods: ['GET'])]
    public function ids(
        #[CurrentUser] User $user,
        FavoriteRepository $repo,
    ): JsonResponse {
        $ids = array_map(
            fn(Favorite $f) => $f->getAnimal()->getId(),
            $repo->findBy(['user' => $user])
        );

        return $this->success($ids);
    }

    #[Route('/{animalId}', methods: ['POST'])]
    public function add(
        int $animalId,
        #[CurrentUser] User $user,
        AnimalRepository $animalRepo,
        FavoriteService $favoriteService,
    ): JsonResponse {
        $animal = $animalRepo->find($animalId);
        if (!$animal) {
            return $this->error('Animal not found.', 404);
        }

        $favoriteService->add($user, $animal);

        return $this->success(['message' => 'Ajouté aux favoris']);
    }

    #[Route('/{animalId}', methods: ['DELETE'])]
    public function remove(
        int $animalId,
        #[CurrentUser] User $user,
        AnimalRepository $animalRepo,
        FavoriteService $favoriteService,
    ): JsonResponse {
        $animal = $animalRepo->find($animalId);
        if ($animal) {
            $favoriteService->remove($user, $animal);
        }

        return $this->noContent();
    }
}
