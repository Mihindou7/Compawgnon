<?php

namespace App\Controller\Admin;

use App\Controller\AbstractApiController;
use App\Controller\Trait\HandlesDomainException;
use App\DTO\Admin\RejectDTO;
use App\Entity\Seller;
use App\Entity\User;
use App\Repository\ReviewRepository;
use App\Repository\SellerRepository;
use App\Service\PaginationService;
use App\Service\SellerService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/sellers')]
#[IsGranted('ROLE_ADMIN')]
class SellerAdminController extends AbstractApiController
{
    use HandlesDomainException;

    #[Route('', methods: ['GET'])]
    public function index(Request $request, SellerRepository $repo, PaginationService $paginator): JsonResponse
    {
        $result = $paginator->paginate(
            $repo->findForAdminQueryBuilder($request->query->get('verified_status', 'pending')),
            (int) $request->query->get('page', 1),
            (int) $request->query->get('limit', 20)
        );
        $result['data'] = array_map(fn(Seller $s) => $this->serialize($s), $result['data']);

        return $this->json($result);
    }

    #[Route('/{id}', methods: ['GET'])]
    public function show(int $id, SellerRepository $repo, ReviewRepository $reviewRepo): JsonResponse
    {
        $seller = $repo->find($id);
        if (!$seller) return $this->error('Seller not found.', 404);

        $rating = $reviewRepo->getSellerRating($seller->getId());

        $data                   = $this->serialize($seller);
        $data['rejection_reason'] = $seller->getRejectionReason();
        $data['description']    = $seller->getDescription();
        $data['address']        = $seller->getAddress();
        $data['postal_code']    = $seller->getPostalCode();
        $data['animals_count']  = $seller->getAnimals()->count();
        $data['rating']         = $rating['avg'];
        $data['reviews_count']  = $rating['count'];

        return $this->success($data);
    }

    #[Route('/{id}/approve', methods: ['PATCH'])]
    public function approve(int $id, #[CurrentUser] User $admin, SellerRepository $repo, SellerService $sellerService): JsonResponse
    {
        $seller = $repo->find($id);
        if (!$seller) return $this->error('Seller not found.', 404);

        $sellerService->approve($seller, $admin);

        return $this->success(['id' => $seller->getId(), 'verified_status' => 'approved']);
    }

    #[Route('/{id}/reject', methods: ['PATCH'])]
    public function reject(
        int $id,
        #[CurrentUser] User $admin,
        #[MapRequestPayload] RejectDTO $dto,
        SellerRepository $repo,
        SellerService $sellerService,
    ): JsonResponse {
        $seller = $repo->find($id);
        if (!$seller) return $this->error('Seller not found.', 404);

        $sellerService->reject($seller, $admin, $dto->rejectionReason);

        return $this->success(['id' => $seller->getId(), 'verified_status' => 'rejected']);
    }

    private function serialize(Seller $s): array
    {
        return [
            'id'              => $s->getId(),
            'name'            => $s->getName(),
            'type'            => $s->getType(),
            'siret'           => $s->getSiret(),
            'city'            => $s->getCity(),
            'verified_status' => $s->getVerifiedStatus(),
            'user'            => ['id' => $s->getUser()->getId(), 'email' => $s->getUser()->getEmail(), 'first_name' => $s->getUser()->getFirstName()],
            'created_at'      => $s->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ];
    }
}
