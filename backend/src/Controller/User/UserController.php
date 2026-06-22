<?php

namespace App\Controller\User;

use App\Controller\AbstractApiController;
use App\Controller\Trait\HandlesDomainException;
use App\DTO\User\ChangePasswordDTO;
use App\DTO\User\UpdateProfileDTO;
use App\Entity\User;
use App\Service\UserService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/me')]
#[IsGranted('ROLE_USER')]
class UserController extends AbstractApiController
{
    use HandlesDomainException;

    #[Route('', methods: ['GET'])]
    public function me(#[CurrentUser] User $user): JsonResponse
    {
        return $this->success($this->serialize($user));
    }

    #[Route('', methods: ['PATCH'])]
    public function update(
        #[CurrentUser] User $user,
        #[MapRequestPayload] UpdateProfileDTO $dto,
        UserService $userService,
    ): JsonResponse {
        return $this->success($this->serialize($userService->updateProfile($user, $dto)));
    }

    #[Route('/password', methods: ['PATCH'])]
    public function changePassword(
        #[CurrentUser] User $user,
        #[MapRequestPayload] ChangePasswordDTO $dto,
        UserPasswordHasherInterface $hasher,
        UserService $userService,
    ): JsonResponse {
        if ($dto->newPassword !== $dto->newPasswordConfirm) {
            return $this->error('Passwords do not match.', 422);
        }

        if ($user->getPasswordHash() !== null) {
            if (!$dto->currentPassword || !$hasher->isPasswordValid($user, $dto->currentPassword)) {
                return $this->error('Current password is incorrect.', 400);
            }
        }

        $userService->changePassword($user, $dto->newPassword);

        return $this->success(['message' => 'Mot de passe modifié']);
    }

    #[Route('/avatar', methods: ['PATCH'])]
    public function uploadAvatar(
        #[CurrentUser] User $user,
        Request $request,
        UserService $userService,
    ): JsonResponse {
        $file = $request->files->get('avatar');
        if (!$file) {
            return $this->error('No file uploaded.', 400);
        }

        return $this->tryService(function () use ($user, $userService, $file) {
            $userService->updateAvatar($user, $file);
            return $this->success($this->serialize($user));
        });
    }

    #[Route('', methods: ['DELETE'])]
    public function deleteAccount(
        #[CurrentUser] User $user,
        Request $request,
        UserPasswordHasherInterface $hasher,
        UserService $userService,
    ): JsonResponse {
        if ($user->getPasswordHash() !== null) {
            $password = json_decode($request->getContent(), true)['password'] ?? null;
            if (!$password || !$hasher->isPasswordValid($user, $password)) {
                return $this->error('Password confirmation is required.', 400);
            }
        }

        $userService->deleteAccount($user);

        return $this->noContent();
    }

    public function serialize(User $user): array
    {
        $data = [
            'id'          => $user->getId(),
            'email'       => $user->getEmail(),
            'first_name'  => $user->getFirstName(),
            'last_name'   => $user->getLastName(),
            'phone'       => $user->getPhone(),
            'avatar_url'  => $user->getAvatarUrl(),
            'roles'       => $user->getRoles(),
            'is_verified' => $user->isEmailVerified(),
            'status'      => $user->getStatus(),
            'created_at'  => $user->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ];

        $data['seller'] = $user->getSeller() ? [
            'id'              => $user->getSeller()->getId(),
            'name'            => $user->getSeller()->getName(),
            'verified_status' => $user->getSeller()->getVerifiedStatus(),
        ] : null;

        return $data;
    }
}
