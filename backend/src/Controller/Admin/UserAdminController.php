<?php

namespace App\Controller\Admin;

use App\Controller\AbstractApiController;
use App\Controller\Trait\HandlesDomainException;
use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\PaginationService;
use App\Service\UserService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/users')]
#[IsGranted('ROLE_ADMIN')]
class UserAdminController extends AbstractApiController
{
    use HandlesDomainException;

    #[Route('', methods: ['GET'])]
    public function index(Request $request, UserRepository $repo, PaginationService $paginator): JsonResponse
    {
        $result = $paginator->paginate(
            $repo->findForAdminQueryBuilder($request->query->get('status'), $request->query->get('search')),
            (int) $request->query->get('page', 1),
            (int) $request->query->get('limit', 20)
        );
        $result['data'] = array_map(fn(User $u) => $this->serializeSummary($u), $result['data']);

        return $this->json($result);
    }

    #[Route('/{id}', methods: ['GET'])]
    public function show(int $id, UserRepository $repo): JsonResponse
    {
        $user = $repo->find($id);
        if (!$user) return $this->error('User not found.', 404);

        return $this->success($this->serializeFull($user));
    }

    #[Route('/{id}/toggle-status', methods: ['PATCH'])]
    public function toggleStatus(
        int $id,
        #[CurrentUser] User $admin,
        UserRepository $repo,
        UserService $userService,
    ): JsonResponse {
        $user = $repo->find($id);
        if (!$user) return $this->error('User not found.', 404);

        return $this->tryService(function () use ($user, $admin, $userService) {
            $result = $userService->toggleStatus($user, $admin);
            return $this->success([
                'id'                     => $user->getId(),
                'status'                 => $result['status'],
                'archived_animals_count' => $result['archived_animals_count'],
            ]);
        });
    }

    #[Route('/{id}', methods: ['DELETE'])]
    public function delete(
        int $id,
        #[CurrentUser] User $admin,
        UserRepository $repo,
        UserService $userService,
    ): JsonResponse {
        $user = $repo->find($id);
        if (!$user) return $this->error('User not found.', 404);

        return $this->tryService(function () use ($user, $admin, $userService) {
            $userService->anonymizeByAdmin($user, $admin);
            return $this->noContent();
        });
    }

    private function serializeSummary(User $u): array
    {
        return [
            'id'            => $u->getId(),
            'email'         => $u->getEmail(),
            'first_name'    => $u->getFirstName(),
            'last_name'     => $u->getLastName(),
            'roles'         => $u->getRoles(),
            'status'        => $u->getStatus(),
            'is_verified'   => $u->isEmailVerified(),
            'last_login_at' => $u->getLastLoginAt()?->format(\DateTimeInterface::ATOM),
            'seller'        => $u->getSeller() ? [
                'id'              => $u->getSeller()->getId(),
                'name'            => $u->getSeller()->getName(),
                'verified_status' => $u->getSeller()->getVerifiedStatus(),
            ] : null,
            'created_at' => $u->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ];
    }

    private function serializeFull(User $u): array
    {
        $data = $this->serializeSummary($u);
        $data['phone']             = $u->getPhone();
        $data['avatar_url']        = $u->getAvatarUrl();
        $data['email_verified_at'] = $u->getEmailVerifiedAt()?->format(\DateTimeInterface::ATOM);
        $data['terms_accepted_at'] = $u->getTermsAcceptedAt()->format(\DateTimeInterface::ATOM);

        if ($u->getSeller()) {
            $data['seller']['animals_count'] = $u->getSeller()->getAnimals()->count();
        }

        $data['auth_providers'] = array_map(fn($p) => [
            'provider'   => $p->getProvider(),
            'linked_at'  => $p->getLinkedAt()->format(\DateTimeInterface::ATOM),
        ], $u->getAuthProviders()->toArray());

        return $data;
    }
}
