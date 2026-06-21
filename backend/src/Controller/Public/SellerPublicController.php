<?php

namespace App\Controller\Public;

use App\Controller\AbstractApiController;
use App\Entity\Animal;
use App\Entity\Review;
use App\Repository\AnimalRepository;
use App\Repository\ReviewRepository;
use App\Repository\SellerRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/sellers')]
class SellerPublicController extends AbstractApiController
{
    #[Route('/{id}', methods: ['GET'])]
    public function show(
        int $id,
        SellerRepository $repo,
        AnimalRepository $animalRepo,
        ReviewRepository $reviewRepo,
    ): JsonResponse {
        $seller = $repo->find($id);

        if (!$seller || $seller->getVerifiedStatus() !== 'approved') {
            return $this->error('Seller not found.', 404);
        }

        $rating        = $reviewRepo->getSellerRating($seller->getId());
        $activeAnimals = $animalRepo->findPublishedBySellerOrdered($seller, 6);
        $reviews       = $reviewRepo->findPublishedBySellerOrdered($seller, 5);

        return $this->success([
            'id'          => $seller->getId(),
            'name'        => $seller->getName(),
            'type'        => $seller->getType(),
            'description' => $seller->getDescription(),
            'logo_url'    => $seller->getLogoUrl(),
            'city'        => $seller->getCity(),
            'postal_code' => $seller->getPostalCode(),
            'rating'         => $rating['avg'],
            'reviews_count'  => $rating['count'],
            'animals_count'  => count($activeAnimals),
            'active_animals' => array_map(fn(Animal $a) => [
                'id'        => $a->getId(),
                'title'     => $a->getTitle(),
                'price'     => (float) $a->getPrice(),
                'cover_url' => $this->getCoverUrl($a),
            ], $activeAnimals),
            'reviews' => array_map(fn(Review $r) => [
                'id'               => $r->getId(),
                'rating'           => $r->getRating(),
                'comment'          => $r->getComment(),
                'buyer_first_name' => $r->getBuyer()->getFirstName(),
                'created_at'       => $r->getCreatedAt()->format(\DateTimeInterface::ATOM),
            ], $reviews),
        ]);
    }

    private function getCoverUrl(Animal $a): ?string
    {
        foreach ($a->getMedia() as $m) {
            if ($m->isCover()) return $m->getFileUrl();
        }
        return $a->getMedia()->first() ? $a->getMedia()->first()->getFileUrl() : null;
    }
}
