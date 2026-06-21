<?php

namespace App\Controller\Seller;

use App\Controller\AbstractApiController;
use App\Entity\Review;
use App\Entity\User;
use App\Repository\ReservationRepository;
use App\Repository\ReviewRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/seller/dashboard')]
#[IsGranted('ROLE_SELLER')]
class DashboardSellerController extends AbstractApiController
{
    #[Route('', methods: ['GET'])]
    public function dashboard(
        #[CurrentUser] User $user,
        ReservationRepository $reservationRepo,
        ReviewRepository $reviewRepo,
    ): JsonResponse {
        $seller = $user->getSeller();
        if (!$seller) return $this->error('No seller profile.', 403);

        $stats = [
            'animals_published'      => 0,
            'animals_reserved'       => 0,
            'animals_sold'           => 0,
            'animals_pending_review' => 0,
            'reservations_pending'   => 0,
            'reservations_accepted'  => 0,
        ];

        foreach ($seller->getAnimals() as $a) {
            match ($a->getStatus()) {
                'published'      => $stats['animals_published']++,
                'reserved'       => $stats['animals_reserved']++,
                'sold'           => $stats['animals_sold']++,
                'pending_review' => $stats['animals_pending_review']++,
                default          => null,
            };
        }

        $stats['reservations_pending']  = $reservationRepo->count(['seller' => $seller, 'status' => 'pending']);
        $stats['reservations_accepted'] = $reservationRepo->count(['seller' => $seller, 'status' => 'accepted']);

        $rating = $reviewRepo->getSellerRating($seller->getId());

        return $this->success([
            'seller' => [
                'name'            => $seller->getName(),
                'verified_status' => $seller->getVerifiedStatus(),
                'rating'          => $rating['avg'],
                'reviews_count'   => $rating['count'],
            ],
            'stats' => $stats,
        ]);
    }
}
