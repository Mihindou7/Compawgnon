<?php

namespace App\Controller\User;

use App\Controller\AbstractApiController;
use App\Controller\Trait\HandlesDomainException;
use App\DTO\Seller\SellerApplyDTO;
use App\DTO\Seller\SellerUpdateDTO;
use App\Entity\Seller;
use App\Entity\User;
use App\Service\SellerService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/me/seller')]
#[IsGranted('ROLE_USER')]
class SellerUserController extends AbstractApiController
{
    use HandlesDomainException;

    #[Route('', methods: ['GET'])]
    public function get(#[CurrentUser] User $user): JsonResponse
    {
        $seller = $user->getSeller();
        return $this->success($seller ? $this->serialize($seller) : null);
    }

    #[Route('/apply', methods: ['POST'])]
    public function apply(
        #[CurrentUser] User $user,
        #[MapRequestPayload] SellerApplyDTO $dto,
        SellerService $sellerService,
    ): JsonResponse {
        return $this->tryService(fn() => $this->created([
            'id'              => ($s = $sellerService->apply($user, $dto))->getId(),
            'verified_status' => $s->getVerifiedStatus(),
        ]));
    }

    #[Route('', methods: ['PATCH'])]
    public function update(
        #[CurrentUser] User $user,
        #[MapRequestPayload] SellerUpdateDTO $dto,
        SellerService $sellerService,
    ): JsonResponse {
        $seller = $user->getSeller();
        if (!$seller) {
            return $this->error('No seller profile found.', 404);
        }

        return $this->success($this->serialize($sellerService->update($seller, $dto)));
    }

    private function serialize(Seller $s): array
    {
        return [
            'id'               => $s->getId(),
            'name'             => $s->getName(),
            'type'             => $s->getType(),
            'siret'            => $s->getSiret(),
            'description'      => $s->getDescription(),
            'verified_status'  => $s->getVerifiedStatus(),
            'rejection_reason' => $s->getRejectionReason(),
            'city'             => $s->getCity(),
            'postal_code'      => $s->getPostalCode(),
            'created_at'       => $s->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ];
    }
}
