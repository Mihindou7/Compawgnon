<?php

namespace App\Controller\Admin;

use App\Controller\AbstractApiController;
use App\Controller\Trait\HandlesDomainException;
use App\Entity\Review;
use App\Entity\User;
use App\Repository\ReviewRepository;
use App\Service\PaginationService;
use App\Service\ReviewService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/reviews')]
#[IsGranted('ROLE_ADMIN')]
class ReviewAdminController extends AbstractApiController
{
    use HandlesDomainException;

    #[Route('', methods: ['GET'])]
    public function index(Request $request, ReviewRepository $repo, PaginationService $paginator): JsonResponse
    {
        $result = $paginator->paginate(
            $repo->findForAdminQueryBuilder(
                $request->query->get('status', 'pending'),
                $request->query->get('seller_id') ? (int) $request->query->get('seller_id') : null
            ),
            (int) $request->query->get('page', 1),
            (int) $request->query->get('limit', 20)
        );
        $result['data'] = array_map(fn(Review $r) => [
            'id'             => $r->getId(),
            'rating'         => $r->getRating(),
            'comment'        => $r->getComment(),
            'status'         => $r->getStatus(),
            'buyer'          => ['id' => $r->getBuyer()->getId(), 'first_name' => $r->getBuyer()->getFirstName(), 'email' => $r->getBuyer()->getEmail()],
            'seller'         => ['id' => $r->getSeller()->getId(), 'name' => $r->getSeller()->getName()],
            'reservation_id' => $r->getReservation()->getId(),
            'created_at'     => $r->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ], $result['data']);

        return $this->json($result);
    }

    #[Route('/{id}/toggle-visibility', methods: ['PATCH'])]
    public function toggleVisibility(
        int $id,
        #[CurrentUser] User $admin,
        ReviewRepository $repo,
        ReviewService $reviewService,
    ): JsonResponse {
        $review = $repo->find($id);
        if (!$review) return $this->error('Review not found.', 404);

        $result = $reviewService->toggleVisibility($review, $admin);

        return $this->success([
            'id'                    => $review->getId(),
            'status'                => $review->getStatus(),
            'seller_rating_updated' => $result['rating'],
            'seller_reviews_count'  => $result['reviews_count'],
        ]);
    }
}
