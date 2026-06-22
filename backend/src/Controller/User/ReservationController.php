<?php

namespace App\Controller\User;

use App\Controller\AbstractApiController;
use App\Controller\Trait\HandlesDomainException;
use App\DTO\Reservation\CreateReservationDTO;
use App\Entity\Reservation;
use App\Entity\User;
use App\Repository\ReservationRepository;
use App\Service\PaginationService;
use App\Service\ReservationService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/me/reservations')]
#[IsGranted('ROLE_USER')]
class ReservationController extends AbstractApiController
{
    use HandlesDomainException;

    #[Route('', methods: ['GET'])]
    public function index(
        #[CurrentUser] User $user,
        Request $request,
        ReservationRepository $repo,
        PaginationService $paginator,
    ): JsonResponse {
        $result = $paginator->paginate(
            $repo->findByBuyerQueryBuilder($user, $request->query->get('status')),
            (int) $request->query->get('page', 1),
            (int) $request->query->get('limit', 20)
        );
        $result['data'] = array_map(fn(Reservation $r) => $this->serialize($r), $result['data']);

        return $this->json($result);
    }

    #[Route('', methods: ['POST'])]
    public function create(
        #[CurrentUser] User $user,
        #[MapRequestPayload] CreateReservationDTO $dto,
        ReservationService $reservationService,
    ): JsonResponse {
        if (!$user->isEmailVerified()) {
            return $this->error('Email verification required.', 403);
        }

        return $this->tryService(function () use ($user, $dto, $reservationService) {
            $r = $reservationService->create($user, $dto->animalId, $dto->message);
            return $this->created([
                'id'         => $r->getId(),
                'status'     => $r->getStatus(),
                'animal'     => ['id' => $r->getAnimal()->getId(), 'title' => $r->getAnimal()->getTitle()],
                'created_at' => $r->getCreatedAt()->format(\DateTimeInterface::ATOM),
            ]);
        });
    }

    #[Route('/count', methods: ['GET'])]
    public function count(
        #[CurrentUser] User $user,
        ReservationRepository $repo,
    ): JsonResponse {
        return $this->success([
            'pending'  => $repo->countByBuyerAndStatus($user, 'pending'),
            'accepted' => $repo->countByBuyerAndStatus($user, 'accepted'),
        ]);
    }

    #[Route('/{id}', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function show(int $id, #[CurrentUser] User $user, ReservationRepository $repo): JsonResponse
    {
        $r = $repo->find($id);
        if (!$r) return $this->error('Reservation not found.', 404);
        if ($r->getBuyer()->getId() !== $user->getId()) return $this->error('Access denied.', 403);

        return $this->success($this->serialize($r));
    }

    #[Route('/{id}/cancel', methods: ['PATCH'])]
    public function cancel(
        int $id,
        #[CurrentUser] User $user,
        ReservationRepository $repo,
        ReservationService $reservationService,
    ): JsonResponse {
        $r = $repo->find($id);
        if (!$r) return $this->error('Reservation not found.', 404);

        return $this->tryService(fn() => $this->success([
            'status' => $reservationService->cancel($r, $user)->getStatus(),
        ]));
    }

    private function serialize(Reservation $r): array
    {
        $animal = $r->getAnimal();
        $cover  = $animal->getMedia()->filter(fn($m) => $m->isCover())->first()
            ?: $animal->getMedia()->first();

        return [
            'id'              => $r->getId(),
            'status'          => $r->getStatus(),
            'message'         => $r->getMessage(),
            'seller_response' => $r->getSellerResponse(),
            'animal'          => [
                'id'        => $animal->getId(),
                'title'     => $animal->getTitle(),
                'price'     => (float) $animal->getPrice(),
                'cover_url' => $cover ? $cover->getFileUrl() : null,
            ],
            'seller'          => ['name' => $r->getSeller()->getName(), 'city' => $r->getSeller()->getCity()],
            'created_at'      => $r->getCreatedAt()->format(\DateTimeInterface::ATOM),
            'updated_at'      => $r->getUpdatedAt()->format(\DateTimeInterface::ATOM),
        ];
    }
}
