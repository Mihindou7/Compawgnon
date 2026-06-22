<?php

namespace App\Controller\Public;

use App\Controller\AbstractApiController;
use App\Entity\Animal;
use App\Entity\User;
use App\Repository\AnimalRepository;
use App\Repository\ReviewRepository;
use App\Service\PaginationService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/animals')]
class AnimalPublicController extends AbstractApiController
{
    #[Route('', methods: ['GET'])]
    public function index(
        Request $request,
        AnimalRepository $repo,
        ReviewRepository $reviewRepo,
        PaginationService $paginator,
    ): JsonResponse {
        $page  = (int) $request->query->get('page', 1);
        $limit = (int) $request->query->get('limit', 20);

        $filters = array_filter([
            'q'            => $request->query->get('q'),
            'species_id'   => $request->query->get('species_id'),
            'species_slug' => $request->query->get('species_slug'),
            'breed_id'     => $request->query->get('breed_id'),
            'breed_slug'   => $request->query->get('breed_slug'),
            'sex'          => $request->query->get('sex'),
            'city'         => $request->query->get('city'),
            'postal_code'  => $request->query->get('postal_code'),
            'price_min'    => $request->query->get('price_min'),
            'price_max'    => $request->query->get('price_max'),
            'age_min'      => $request->query->get('age_min'),
            'age_max'      => $request->query->get('age_max'),
            'seller_type'     => $request->query->get('seller_type'),
            'region'          => $request->query->get('region'),
            'department_code' => $request->query->get('department_code'),
            'lat'             => $request->query->get('lat'),
            'lng'             => $request->query->get('lng'),
            'radius_km'       => $request->query->get('radius_km'),
            'sort'            => $request->query->get('sort', 'published_at_desc'),
        ], fn($v) => $v !== null && $v !== '');

        $qb     = $repo->findPublicQueryBuilder($filters);
        $result = $paginator->paginate($qb, $page, $limit);

        $result['data'] = array_map(
            fn(Animal $a) => $this->serializeCard($a, $reviewRepo),
            $result['data']
        );

        return $this->json($result);
    }

    #[Route('/{id}', methods: ['GET'])]
    public function show(
        int $id,
        AnimalRepository $repo,
        ReviewRepository $reviewRepo,
        #[CurrentUser] ?User $user = null,
    ): JsonResponse {
        $animal = $repo->find($id);

        if (!$animal) {
            return $this->error('Animal not found.', 404);
        }

        $isSeller = $user
            && $user->getSeller()
            && $animal->getSeller()->getId() === $user->getSeller()->getId();

        if (!$isSeller && $animal->getStatus() !== 'published') {
            return $this->error('Animal not found.', 404);
        }

        $similar  = $repo->findSimilar($animal, 3);
        $seller   = $animal->getSeller();
        $sellerRating = $reviewRepo->getSellerRating($seller->getId());

        $data = [
            'id'          => $animal->getId(),
            'title'       => $animal->getTitle(),
            'description' => $animal->getDescription(),
            'species'     => ['id' => $animal->getSpecies()->getId(), 'name' => $animal->getSpecies()->getName(), 'slug' => $animal->getSpecies()->getSlug()],
            'breed'       => $animal->getBreed() ? ['id' => $animal->getBreed()->getId(), 'name' => $animal->getBreed()->getName(), 'slug' => $animal->getBreed()->getSlug()] : null,
            'sex'         => $animal->getSex(),
            'birthdate'   => $animal->getBirthdate()?->format('Y-m-d'),
            'age_months'  => $this->calcAgeMonths($animal),
            'price'       => (float) $animal->getPrice(),
            'status'      => $animal->getStatus(),
            'city'        => $animal->getCity(),
            'postal_code' => $animal->getPostalCode(),
            'media'       => array_map(fn($m) => [
                'id'       => $m->getId(),
                'file_url' => $m->getFileUrl(),
                'is_cover' => $m->isCover(),
                'position' => $m->getPosition(),
            ], $animal->getMedia()->toArray()),
            'documents'   => array_values(array_map(fn($d) => [
                'id'            => $d->getId(),
                'type'          => $d->getType(),
                'original_name' => $d->getOriginalName(),
                'file_url'      => $d->getFileUrl(),
            ], array_filter($animal->getDocuments()->toArray(), fn($d) => $d->isPublic()))),
            'seller'      => [
                'id'              => $seller->getId(),
                'user_id'         => $seller->getUser()->getId(),
                'name'            => $seller->getName(),
                'type'            => $seller->getType(),
                'verified_status' => $seller->getVerifiedStatus(),
                'city'            => $seller->getCity(),
                'logo_url'        => $seller->getLogoUrl(),
                'rating'          => $sellerRating['avg'],
                'reviews_count'   => $sellerRating['count'],
            ],
            'similar_animals' => array_map(fn(Animal $a) => [
                'id'        => $a->getId(),
                'title'     => $a->getTitle(),
                'price'     => (float) $a->getPrice(),
                'cover_url' => $this->getCoverUrl($a),
            ], $similar),
            'published_at' => $animal->getPublishedAt()?->format(\DateTimeInterface::ATOM),
        ];

        return $this->success($data);
    }

    private function serializeCard(Animal $a, ReviewRepository $reviewRepo): array
    {
        $sellerRating = $reviewRepo->getSellerRating($a->getSeller()->getId());

        return [
            'id'          => $a->getId(),
            'title'       => $a->getTitle(),
            'status'      => $a->getStatus(),
            'species'     => ['id' => $a->getSpecies()->getId(), 'name' => $a->getSpecies()->getName(), 'slug' => $a->getSpecies()->getSlug()],
            'breed'       => $a->getBreed() ? ['id' => $a->getBreed()->getId(), 'name' => $a->getBreed()->getName(), 'slug' => $a->getBreed()->getSlug()] : null,
            'sex'         => $a->getSex(),
            'age_months'  => $this->calcAgeMonths($a),
            'price'       => (float) $a->getPrice(),
            'city'        => $a->getCity(),
            'postal_code' => $a->getPostalCode(),
            'cover_url'   => $this->getCoverUrl($a),
            'seller'      => [
                'id'              => $a->getSeller()->getId(),
                'name'            => $a->getSeller()->getName(),
                'type'            => $a->getSeller()->getType(),
                'verified_status' => $a->getSeller()->getVerifiedStatus(),
                'rating'          => $sellerRating['avg'],
            ],
            'published_at' => $a->getPublishedAt()?->format(\DateTimeInterface::ATOM),
        ];
    }

    private function calcAgeMonths(Animal $a): ?int
    {
        if (!$a->getBirthdate()) return null;
        $diff = $a->getBirthdate()->diff(new \DateTimeImmutable());
        return $diff->y * 12 + $diff->m;
    }

    private function getCoverUrl(Animal $a): ?string
    {
        foreach ($a->getMedia() as $m) {
            if ($m->isCover()) return $m->getFileUrl();
        }
        return $a->getMedia()->first() ? $a->getMedia()->first()->getFileUrl() : null;
    }

}
