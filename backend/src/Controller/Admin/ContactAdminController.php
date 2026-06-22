<?php

namespace App\Controller\Admin;

use App\Controller\AbstractApiController;
use App\Controller\Trait\HandlesDomainException;
use App\DTO\Contact\ReplyContactDTO;
use App\DTO\Contact\UpdateContactStatusDTO;
use App\Entity\ContactMessage;
use App\Entity\User;
use App\Repository\ContactMessageRepository;
use App\Service\ContactService;
use App\Service\PaginationService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/contacts')]
#[IsGranted('ROLE_ADMIN')]
class ContactAdminController extends AbstractApiController
{
    use HandlesDomainException;

    #[Route('', methods: ['GET'])]
    public function index(Request $request, ContactMessageRepository $repo, PaginationService $paginator): JsonResponse
    {
        $result = $paginator->paginate(
            $repo->findForAdminQueryBuilder(
                $request->query->get('status'),
                $request->query->get('search'),
            ),
            (int) $request->query->get('page', 1),
            (int) $request->query->get('limit', 20),
        );

        $result['data'] = array_map(fn(ContactMessage $c) => $this->serialize($c), $result['data']);
        $result['stats'] = $repo->countByStatus();

        return $this->json($result);
    }

    #[Route('/{id}', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(int $id, ContactMessageRepository $repo): JsonResponse
    {
        $contact = $repo->find($id);
        if (!$contact) return $this->error('Demande introuvable.', 404);

        return $this->success($this->serialize($contact, true));
    }

    #[Route('/{id}/status', methods: ['PATCH'], requirements: ['id' => '\d+'])]
    public function updateStatus(
        int $id,
        #[CurrentUser] User $admin,
        #[MapRequestPayload] UpdateContactStatusDTO $dto,
        ContactMessageRepository $repo,
        ContactService $contactService,
    ): JsonResponse {
        $contact = $repo->find($id);
        if (!$contact) return $this->error('Demande introuvable.', 404);

        return $this->tryService(function () use ($contact, $dto, $admin, $contactService) {
            $contactService->updateStatus($contact, $dto->status, $admin);
            return $this->success($this->serialize($contact, true));
        });
    }

    #[Route('/{id}/reply', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function reply(
        int $id,
        #[CurrentUser] User $admin,
        #[MapRequestPayload] ReplyContactDTO $dto,
        ContactMessageRepository $repo,
        ContactService $contactService,
    ): JsonResponse {
        $contact = $repo->find($id);
        if (!$contact) return $this->error('Demande introuvable.', 404);

        return $this->tryService(function () use ($contact, $dto, $admin, $contactService) {
            $contactService->reply($contact, $dto->message, $admin);
            return $this->success($this->serialize($contact, true));
        });
    }

    #[Route('/{id}', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(
        int $id,
        #[CurrentUser] User $admin,
        ContactMessageRepository $repo,
        ContactService $contactService,
    ): JsonResponse {
        $contact = $repo->find($id);
        if (!$contact) return $this->error('Demande introuvable.', 404);

        $contactService->delete($contact, $admin);

        return $this->noContent();
    }

    private function serialize(ContactMessage $c, bool $detailed = false): array
    {
        $data = [
            'id'         => $c->getId(),
            'name'       => $c->getName(),
            'email'      => $c->getEmail(),
            'subject'    => $c->getSubject(),
            'status'     => $c->getStatus(),
            'created_at' => $c->getCreatedAt()->format(\DateTimeInterface::ATOM),
            'handled_by' => $c->getHandledBy()
                ? ['id' => $c->getHandledBy()->getId(), 'email' => $c->getHandledBy()->getEmail(), 'first_name' => $c->getHandledBy()->getFirstName()]
                : null,
            'handled_at' => $c->getHandledAt()?->format(\DateTimeInterface::ATOM),
        ];

        if ($detailed) {
            $data['message']     = $c->getMessage();
            $data['admin_reply'] = $c->getAdminReply();
            $data['ip_address']  = $c->getIpAddress();
            $data['updated_at']  = $c->getUpdatedAt()->format(\DateTimeInterface::ATOM);
        } else {
            $data['excerpt'] = mb_substr($c->getMessage(), 0, 120);
        }

        return $data;
    }
}
