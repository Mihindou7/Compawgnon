<?php

namespace App\Controller\Admin;

use App\Controller\AbstractApiController;
use App\Controller\Trait\HandlesDomainException;
use App\DTO\Admin\RejectDTO;
use App\Entity\Animal;
use App\Entity\User;
use App\Repository\AnimalRepository;
use App\Service\AnimalService;
use App\Service\AuditService;
use App\Service\MailService;
use App\Service\PaginationService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/animals')]
#[IsGranted('ROLE_ADMIN')]
class AnimalAdminController extends AbstractApiController
{
    use HandlesDomainException;

    #[Route('', methods: ['GET'])]
    public function index(Request $request, AnimalRepository $repo, PaginationService $paginator): JsonResponse
    {
        $result = $paginator->paginate(
            $repo->findForAdminQueryBuilder(
                $request->query->get('status', 'pending_review'),
                $request->query->get('seller_id') ? (int) $request->query->get('seller_id') : null
            ),
            (int) $request->query->get('page', 1),
            (int) $request->query->get('limit', 20)
        );
        $result['data'] = array_map(fn(Animal $a) => $this->serializeCard($a), $result['data']);

        return $this->json($result);
    }

    #[Route('/{id}', methods: ['GET'])]
    public function show(int $id, AnimalRepository $repo): JsonResponse
    {
        $animal = $repo->find($id);
        if (!$animal) return $this->error('Animal not found.', 404);

        return $this->success($this->serializeDetail($animal));
    }

    #[Route('/{id}/publish', methods: ['PATCH'])]
    public function publish(
        int $id,
        #[CurrentUser] User $admin,
        AnimalRepository $repo,
        AnimalService $animalService,
        MailService $mailService,
        AuditService $audit,
    ): JsonResponse {
        $animal = $repo->find($id);
        if (!$animal) return $this->error('Animal not found.', 404);

        return $this->tryService(function () use ($animal, $admin, $animalService, $mailService, $audit) {
            $animalService->publish($animal, $admin, $mailService, $audit);
            return $this->success([
                'id'           => $animal->getId(),
                'status'       => 'published',
                'published_at' => $animal->getPublishedAt()->format(\DateTimeInterface::ATOM),
            ]);
        });
    }

    #[Route('/{id}/reject', methods: ['PATCH'])]
    public function reject(
        int $id,
        #[CurrentUser] User $admin,
        #[MapRequestPayload] RejectDTO $dto,
        AnimalRepository $repo,
        AnimalService $animalService,
        MailService $mailService,
        AuditService $audit,
    ): JsonResponse {
        $animal = $repo->find($id);
        if (!$animal) return $this->error('Animal not found.', 404);

        return $this->tryService(function () use ($animal, $admin, $dto, $animalService, $mailService, $audit) {
            $animalService->reject($animal, $admin, $dto->rejectionReason, $mailService, $audit);
            return $this->success(['id' => $animal->getId(), 'status' => 'draft']);
        });
    }

    private function serializeCard(Animal $a): array
    {
        return [
            'id'          => $a->getId(),
            'title'       => $a->getTitle(),
            'description' => $a->getDescription(),
            'status'      => $a->getStatus(),
            'price'       => (float) $a->getPrice(),
            'city'        => $a->getCity(),
            'species'     => ['id' => $a->getSpecies()->getId(), 'name' => $a->getSpecies()->getName()],
            'breed'       => $a->getBreed() ? ['id' => $a->getBreed()->getId(), 'name' => $a->getBreed()->getName()] : null,
            'cover_url'   => $a->getMedia()->first() ? $a->getMedia()->first()->getFileUrl() : null,
            'media_count' => $a->getMedia()->count(),
            'seller'      => ['id' => $a->getSeller()->getId(), 'name' => $a->getSeller()->getName(), 'verified_status' => $a->getSeller()->getVerifiedStatus()],
            'created_at'  => $a->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ];
    }

    private function serializeDetail(Animal $a): array
    {
        $data              = $this->serializeCard($a);
        $data['birthdate'] = $a->getBirthdate()?->format('Y-m-d');
        $data['sex']       = $a->getSex();
        $data['postal_code'] = $a->getPostalCode();
        $data['media']     = array_map(fn($m) => ['id' => $m->getId(), 'file_url' => $m->getFileUrl(), 'is_cover' => $m->isCover(), 'position' => $m->getPosition()], $a->getMedia()->toArray());
        $data['documents'] = array_map(fn($d) => ['id' => $d->getId(), 'type' => $d->getType(), 'original_name' => $d->getOriginalName(), 'is_public' => $d->isPublic()], $a->getDocuments()->toArray());
        $data['published_at'] = $a->getPublishedAt()?->format(\DateTimeInterface::ATOM);
        return $data;
    }
}
