<?php

namespace App\Controller;

use App\Entity\Review;
use App\Repository\ReviewRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/reviews')]
class PublicReviewController extends AbstractController
{
    #[Route('', methods: ['GET'])]
    public function index(ReviewRepository $repo): JsonResponse
    {
        $reviews = $repo->findPublishedRecent(10);

        return $this->json(array_map(function (Review $r) {
            $buyer = $r->getBuyer();
            $firstName = $buyer->getFirstName();
            $lastName = $buyer->getLastName();

            if ($firstName) {
                $displayName = $lastName ? $firstName . ' ' . mb_substr($lastName, 0, 1) . '.' : $firstName;
            } else {
                $displayName = mb_substr(explode('@', $buyer->getEmail())[0], 0, 12);
            }

            return [
                'id'           => $r->getId(),
                'rating'       => $r->getRating(),
                'comment'      => $r->getComment(),
                'buyer_name'   => $displayName,
                'created_at'   => $r->getCreatedAt()->format(\DateTimeInterface::ATOM),
            ];
        }, $reviews));
    }
}
