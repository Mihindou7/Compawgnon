<?php

namespace App\Controller\Public;

use App\Controller\AbstractApiController;
use App\Entity\Breed;
use App\Repository\AnimalRepository;
use App\Repository\BreedRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/breeds')]
class BreedController extends AbstractApiController
{
    #[Route('', methods: ['GET'])]
    public function index(Request $request, BreedRepository $repo, AnimalRepository $animalRepo): JsonResponse
    {
        $breeds = $repo->findWithSpeciesFiltered(
            $request->query->get('species_id') ? (int) $request->query->get('species_id') : null,
            $request->query->get('species_slug')
        );

        $data = array_map(fn(Breed $b) => [
            ...$this->serialize($b),
            'available_animals_count' => $animalRepo->countPublishedByBreed($b->getId()),
        ], $breeds);

        return $this->success($data);
    }

    #[Route('/{slug}', methods: ['GET'])]
    public function show(string $slug, BreedRepository $repo, AnimalRepository $animalRepo): JsonResponse
    {
        $breed = $repo->findBySlugWithSpecies($slug);
        if (!$breed) {
            return $this->error('Breed not found.', 404);
        }

        return $this->success([
            ...$this->serialize($breed),
            'description'             => $breed->getDescription(),
            'temperament'             => $breed->getTemperament(),
            'available_animals_count' => $animalRepo->countPublishedByBreed($breed->getId()),
        ]);
    }

    private function serialize(Breed $b): array
    {
        return [
            'id'         => $b->getId(),
            'name'       => $b->getName(),
            'slug'       => $b->getSlug(),
            'species'    => ['id' => $b->getSpecies()->getId(), 'name' => $b->getSpecies()->getName(), 'slug' => $b->getSpecies()->getSlug()],
            'size'       => $b->getSize(),
            'care_level' => $b->getCareLevel(),
            'image_url'  => $b->getImageUrl(),
        ];
    }
}
