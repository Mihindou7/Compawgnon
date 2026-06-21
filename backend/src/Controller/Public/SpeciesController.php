<?php

namespace App\Controller\Public;

use App\Controller\AbstractApiController;
use App\Entity\Species;
use App\Repository\AnimalRepository;
use App\Repository\SpeciesRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/species')]
class SpeciesController extends AbstractApiController
{
    #[Route('', methods: ['GET'])]
    public function index(SpeciesRepository $repo, AnimalRepository $animalRepo): JsonResponse
    {
        $data = array_map(fn(Species $s) => [
            ...$this->serialize($s),
            'breeds_count'            => $s->getBreeds()->count(),
            'available_animals_count' => $animalRepo->countPublishedBySpecies($s->getId()),
        ], $repo->findAllWithBreeds());

        return $this->success($data);
    }

    #[Route('/{slug}', methods: ['GET'])]
    public function show(string $slug, SpeciesRepository $repo, AnimalRepository $animalRepo): JsonResponse
    {
        $species = $repo->findBySlug($slug);
        if (!$species) {
            return $this->error('Species not found.', 404);
        }

        $data = $this->serialize($species);
        $data['breeds'] = array_map(fn($b) => [
            'id'                      => $b->getId(),
            'name'                    => $b->getName(),
            'slug'                    => $b->getSlug(),
            'size'                    => $b->getSize(),
            'care_level'              => $b->getCareLevel(),
            'image_url'               => $b->getImageUrl(),
            'available_animals_count' => $animalRepo->countPublishedByBreed($b->getId()),
        ], $species->getBreeds()->toArray());

        return $this->success($data);
    }

    private function serialize(Species $s): array
    {
        return [
            'id'                  => $s->getId(),
            'name'                => $s->getName(),
            'slug'                => $s->getSlug(),
            'family'              => $s->getFamily(),
            'description'         => $s->getDescription(),
            'temperament'         => $s->getTemperament(),
            'life_expectancy_min' => $s->getLifeExpectancyMin(),
            'life_expectancy_max' => $s->getLifeExpectancyMax(),
            'diet_type'           => $s->getDietType(),
            'avg_monthly_cost'    => $s->getAvgMonthlyCost() ? (float) $s->getAvgMonthlyCost() : null,
            'care_level'          => $s->getCareLevel(),
            'image_url'           => $s->getImageUrl(),
        ];
    }
}
