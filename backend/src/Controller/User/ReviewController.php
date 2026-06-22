<?php

namespace App\Controller\User;

use App\Controller\AbstractApiController;
use App\Controller\Trait\HandlesDomainException;
use App\DTO\Review\CreateReviewDTO;
use App\Entity\Review;
use App\Entity\User;
use App\Repository\ReviewRepository;
use App\Service\PaginationService;
use App\Service\ReviewService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/me/reviews')]
#[IsGranted('ROLE_USER')]
class ReviewController extends AbstractApiController
{
    use HandlesDomainException;

    #[Route('', methods: ['GET'])]
    public function index(
        #[CurrentUser] User $user,
        Request $request,
        ReviewRepository $repo,
        PaginationService $paginator,
    ): JsonResponse {
        $result = $paginator->paginate(
            $repo->findByBuyerQueryBuilder($user),
            (int) $request->query->get('page', 1),
            (int) $request->query->get('limit', 20)
        );
        $result['data'] = array_map(fn(Review $r) => [
            'id'         => $r->getId(),
            'rating'     => $r->getRating(),
            'comment'    => $r->getComment(),
            'status'     => $r->getStatus(),
            'seller'     => ['id' => $r->getSeller()->getId(), 'name' => $r->getSeller()->getName()],
            'created_at' => $r->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ], $result['data']);

        return $this->json($result);
    }

    #[Route('', methods: ['POST'])]
    public function create(
        #[CurrentUser] User $user,
        #[MapRequestPayload] CreateReviewDTO $dto,
        ReviewService $reviewService,
    ): JsonResponse {
        return $this->tryService(function () use ($user, $dto, $reviewService) {
            $review = $reviewService->create($user, $dto);
            return $this->created([
                'id'      => $review->getId(),
                'rating'  => $review->getRating(),
                'status'  => $review->getStatus(),
                'message' => 'Votre avis a été soumis. Il sera visible après modération.',
            ]);
        });
    }
}
