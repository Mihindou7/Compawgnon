<?php

namespace App\Controller\Seller;

use App\Controller\AbstractApiController;
use App\Controller\Trait\HandlesDomainException;
use App\DTO\Seller\ReservationResponseDTO;
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

#[Route('/api/seller/reservations')]
#[IsGranted('ROLE_SELLER')]
class ReservationSellerController extends AbstractApiController
{
    use HandlesDomainException;

    #[Route('', methods: ['GET'])]
    public function index(
        #[CurrentUser] User $user,
        Request $request,
        ReservationRepository $repo,
        PaginationService $paginator,
    ): JsonResponse {
        $seller = $user->getSeller();
        if (!$seller) return $this->error('No seller profile.', 403);

        $result = $paginator->paginate(
            $repo->findBySellerQueryBuilder($seller, $request->query->get('status')),
            (int) $request->query->get('page', 1),
            (int) $request->query->get('limit', 20)
        );
        $result['data'] = array_map(fn(Reservation $r) => $this->serializeList($r), $result['data']);

        return $this->json($result);
    }

    #[Route('/{id}', methods: ['GET'])]
    public function show(int $id, #[CurrentUser] User $user, ReservationRepository $repo): JsonResponse
    {
        [$r, $err] = $this->findOwned($id, $user, $repo);
        if ($err) return $err;

        $buyer = $r->getBuyer();
        return $this->success([
            'id'              => $r->getId(),
            'status'          => $r->getStatus(),
            'message'         => $r->getMessage(),
            'seller_response' => $r->getSellerResponse(),
            'animal'          => ['id' => $r->getAnimal()->getId(), 'title' => $r->getAnimal()->getTitle(), 'price' => (float) $r->getAnimal()->getPrice()],
            'buyer'           => [
                'first_name' => $buyer->getFirstName(),
                'last_name'  => $buyer->getLastName() ? substr($buyer->getLastName(), 0, 1) . '.' : null,
                'phone'      => $buyer->getPhone(),
            ],
            'created_at'  => $r->getCreatedAt()->format(\DateTimeInterface::ATOM),
            'expires_at'  => $r->getExpiresAt()?->format(\DateTimeInterface::ATOM),
        ]);
    }

    #[Route('/{id}/accept', methods: ['PATCH'])]
    public function accept(
        int $id,
        #[CurrentUser] User $user,
        #[MapRequestPayload] ReservationResponseDTO $dto,
        ReservationRepository $repo,
        ReservationService $reservationService,
    ): JsonResponse {
        [$r, $err] = $this->findOwned($id, $user, $repo);
        if ($err) return $err;

        return $this->tryService(function () use ($r, $user, $dto, $reservationService) {
            $result = $reservationService->accept($r, $user->getSeller(), $dto->sellerResponse);
            return $this->success(['status' => 'accepted', 'auto_rejected_count' => $result['auto_rejected_count']]);
        });
    }

    #[Route('/{id}/reject', methods: ['PATCH'])]
    public function reject(
        int $id,
        #[CurrentUser] User $user,
        #[MapRequestPayload] ReservationResponseDTO $dto,
        ReservationRepository $repo,
        ReservationService $reservationService,
    ): JsonResponse {
        [$r, $err] = $this->findOwned($id, $user, $repo);
        if ($err) return $err;

        return $this->tryService(function () use ($r, $user, $dto, $reservationService) {
            $reservationService->reject($r, $user->getSeller(), $dto->sellerResponse);
            return $this->success(['status' => 'rejected']);
        });
    }

    #[Route('/{id}/complete', methods: ['PATCH'])]
    public function complete(
        int $id,
        #[CurrentUser] User $user,
        ReservationRepository $repo,
        ReservationService $reservationService,
    ): JsonResponse {
        [$r, $err] = $this->findOwned($id, $user, $repo);
        if ($err) return $err;

        return $this->tryService(function () use ($r, $user, $reservationService) {
            $reservationService->complete($r, $user->getSeller());
            return $this->success(['status' => 'completed']);
        });
    }

    private function findOwned(int $id, User $user, ReservationRepository $repo): array
    {
        $seller = $user->getSeller();
        $r = $repo->find($id);
        if (!$r || !$seller || $r->getSeller()->getId() !== $seller->getId()) {
            return [null, $this->error('Reservation not found.', 404)];
        }
        return [$r, null];
    }

    private function serializeList(Reservation $r): array
    {
        $cover = null;
        foreach ($r->getAnimal()->getMedia() as $m) { if ($m->isCover()) { $cover = $m->getFileUrl(); break; } }
        return [
            'id'         => $r->getId(),
            'status'     => $r->getStatus(),
            'message'    => $r->getMessage(),
            'animal'     => ['id' => $r->getAnimal()->getId(), 'title' => $r->getAnimal()->getTitle(), 'price' => (float) $r->getAnimal()->getPrice(), 'cover_url' => $cover],
            'buyer'      => ['first_name' => $r->getBuyer()->getFirstName()],
            'created_at' => $r->getCreatedAt()->format(\DateTimeInterface::ATOM),
            'updated_at' => $r->getUpdatedAt()->format(\DateTimeInterface::ATOM),
        ];
    }
}
