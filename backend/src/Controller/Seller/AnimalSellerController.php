<?php

namespace App\Controller\Seller;

use App\Controller\AbstractApiController;
use App\Controller\Trait\HandlesDomainException;
use App\DTO\Seller\CreateAnimalDTO;
use App\Entity\Animal;
use App\Entity\User;
use App\Repository\AnimalRepository;
use App\Service\AnimalService;
use App\Service\PaginationService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/seller/animals')]
#[IsGranted('ROLE_SELLER')]
class AnimalSellerController extends AbstractApiController
{
    use HandlesDomainException;

    #[Route('', methods: ['GET'])]
    public function index(
        #[CurrentUser] User $user,
        Request $request,
        AnimalRepository $repo,
        PaginationService $paginator,
    ): JsonResponse {
        $seller = $user->getSeller();
        if (!$seller) return $this->error('No seller profile.', 403);

        $result = $paginator->paginate(
            $repo->findBySellerQueryBuilder($seller, $request->query->get('status')),
            (int) $request->query->get('page', 1),
            (int) $request->query->get('limit', 20)
        );
        $result['data'] = array_map(fn(Animal $a) => $this->serializeList($a), $result['data']);

        return $this->json($result);
    }

    #[Route('/{id}', methods: ['GET'])]
    public function show(int $id, #[CurrentUser] User $user, AnimalRepository $repo): JsonResponse
    {
        [$animal, $err] = $this->findOwned($id, $user, $repo);
        if ($err) return $err;

        return $this->success($this->serializeDetail($animal));
    }

    #[Route('', methods: ['POST'])]
    public function create(
        #[CurrentUser] User $user,
        #[MapRequestPayload] CreateAnimalDTO $dto,
        AnimalService $animalService,
    ): JsonResponse {
        $seller = $user->getSeller();
        if (!$seller) return $this->error('No seller profile.', 403);

        return $this->tryService(fn() => $this->created([
            'id'      => ($a = $animalService->create($seller, $dto))->getId(),
            'status'  => $a->getStatus(),
            'message' => 'Votre annonce a été soumise. Elle sera visible après validation par notre équipe.',
        ]));
    }

    #[Route('/{id}', methods: ['PATCH'])]
    public function update(
        int $id,
        #[CurrentUser] User $user,
        Request $request,
        AnimalRepository $repo,
        AnimalService $animalService,
    ): JsonResponse {
        [$animal, $err] = $this->findOwned($id, $user, $repo);
        if ($err) return $err;

        return $this->tryService(function () use ($animal, $user, $request, $animalService) {
            $data     = json_decode($request->getContent(), true) ?? [];
            $updated  = $animalService->update($animal, $user->getSeller(), $data);
            $remod    = $data && $updated->getStatus() === 'pending_review' && isset($data['title']);
            return $this->success([
                'id'                    => $updated->getId(),
                'status'                => $updated->getStatus(),
                'requires_remoderation' => $remod,
                'message' => $remod
                    ? 'Vos modifications ont été enregistrées. Votre annonce est repassée en attente de validation.'
                    : 'Modifications enregistrées.',
            ]);
        });
    }

    #[Route('/{id}', methods: ['DELETE'])]
    public function delete(int $id, #[CurrentUser] User $user, AnimalRepository $repo, AnimalService $animalService): JsonResponse
    {
        [$animal, $err] = $this->findOwned($id, $user, $repo);
        if ($err) return $err;

        return $this->tryService(function () use ($animal, $user, $animalService) {
            $animalService->archive($animal, $user->getSeller());
            return $this->noContent();
        });
    }

    // ─── Media ────────────────────────────────────────────────────────────────

    #[Route('/{id}/media', methods: ['POST'])]
    public function uploadMedia(int $id, #[CurrentUser] User $user, Request $request, AnimalRepository $repo, AnimalService $animalService): JsonResponse
    {
        [$animal, $err] = $this->findOwned($id, $user, $repo);
        if ($err) return $err;

        $file = $request->files->get('photo');
        if (!$file) return $this->error('No file uploaded.', 400);

        return $this->tryService(function () use ($animal, $user, $request, $file, $animalService) {
            $isCover  = filter_var($request->request->get('is_cover', false), FILTER_VALIDATE_BOOLEAN);
            $position = (int) $request->request->get('position', $animal->getMedia()->count());
            $m = $animalService->uploadMedia($animal, $user->getSeller(), $file, $isCover, $position);
            return $this->created(['id' => $m->getId(), 'file_url' => $m->getFileUrl(), 'is_cover' => $m->isCover(), 'position' => $m->getPosition()]);
        });
    }

    #[Route('/{id}/media/{mediaId}', methods: ['DELETE'])]
    public function deleteMedia(int $id, int $mediaId, #[CurrentUser] User $user, AnimalRepository $repo, AnimalService $animalService): JsonResponse
    {
        [$animal, $err] = $this->findOwned($id, $user, $repo);
        if ($err) return $err;

        return $this->tryService(function () use ($animal, $user, $mediaId, $animalService) {
            $animalService->deleteMedia($animal, $user->getSeller(), $mediaId);
            return $this->noContent();
        });
    }

    // ─── Documents ────────────────────────────────────────────────────────────

    #[Route('/{id}/documents', methods: ['POST'])]
    public function uploadDocument(int $id, #[CurrentUser] User $user, Request $request, AnimalRepository $repo, AnimalService $animalService): JsonResponse
    {
        [$animal, $err] = $this->findOwned($id, $user, $repo);
        if ($err) return $err;

        $file = $request->files->get('document');
        if (!$file) return $this->error('No file uploaded.', 400);

        return $this->tryService(function () use ($animal, $user, $request, $file, $animalService) {
            $type     = $request->request->get('type', 'other');
            $isPublic = filter_var($request->request->get('is_public', false), FILTER_VALIDATE_BOOLEAN);
            $d = $animalService->uploadDocument($animal, $user->getSeller(), $file, $type, $isPublic);
            return $this->created(['id' => $d->getId(), 'type' => $d->getType(), 'original_name' => $d->getOriginalName(), 'is_public' => $d->isPublic()]);
        });
    }

    #[Route('/{id}/documents/{docId}', methods: ['DELETE'])]
    public function deleteDocument(int $id, int $docId, #[CurrentUser] User $user, AnimalRepository $repo, AnimalService $animalService): JsonResponse
    {
        [$animal, $err] = $this->findOwned($id, $user, $repo);
        if ($err) return $err;

        return $this->tryService(function () use ($animal, $user, $docId, $animalService) {
            $animalService->deleteDocument($animal, $user->getSeller(), $docId);
            return $this->noContent();
        });
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function findOwned(int $id, User $user, AnimalRepository $repo): array
    {
        $seller = $user->getSeller();
        $animal = $repo->find($id);
        if (!$animal || !$seller || $animal->getSeller()->getId() !== $seller->getId()) {
            return [null, $this->error('Animal not found.', 404)];
        }
        return [$animal, null];
    }

    private function serializeList(Animal $a): array
    {
        $cover = null;
        foreach ($a->getMedia() as $m) { if ($m->isCover()) { $cover = $m->getFileUrl(); break; } }
        return [
            'id'                         => $a->getId(),
            'title'                      => $a->getTitle(),
            'species'                    => ['id' => $a->getSpecies()->getId(), 'name' => $a->getSpecies()->getName()],
            'breed'                      => $a->getBreed() ? ['id' => $a->getBreed()->getId(), 'name' => $a->getBreed()->getName()] : null,
            'status'                     => $a->getStatus(),
            'price'                      => (float) $a->getPrice(),
            'city'                       => $a->getCity(),
            'sex'                        => $a->getSex(),
            'cover_url'                  => $cover,
            'pending_reservations_count' => count(array_filter($a->getReservations()->toArray(), fn($r) => $r->getStatus() === 'pending')),
            'published_at'               => $a->getPublishedAt()?->format(\DateTimeInterface::ATOM),
            'created_at'                 => $a->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ];
    }

    private function serializeDetail(Animal $a): array
    {
        $data              = $this->serializeList($a);
        $data['description']     = $a->getDescription();
        $data['birthdate']       = $a->getBirthdate()?->format('Y-m-d');
        $data['postal_code']     = $a->getPostalCode();
        $data['latitude']        = $a->getLatitude() !== null ? (float) $a->getLatitude() : null;
        $data['longitude']       = $a->getLongitude() !== null ? (float) $a->getLongitude() : null;
        $data['region']          = $a->getRegion();
        $data['department']      = $a->getDepartment();
        $data['department_code'] = $a->getDepartmentCode();
        $data['media']           = array_map(fn($m) => ['id' => $m->getId(), 'file_url' => $m->getFileUrl(), 'is_cover' => $m->isCover(), 'position' => $m->getPosition()], $a->getMedia()->toArray());
        $data['documents']       = array_map(fn($d) => ['id' => $d->getId(), 'type' => $d->getType(), 'original_name' => $d->getOriginalName(), 'is_public' => $d->isPublic()], $a->getDocuments()->toArray());
        return $data;
    }
}