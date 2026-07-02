<?php

namespace App\Controller\Auth;

use App\Controller\AbstractApiController;
use App\DTO\Auth\ForgotPasswordDTO;
use App\DTO\Auth\RegisterDTO;
use App\DTO\Auth\ResetPasswordDTO;
use App\Entity\User;
use App\Service\AuthService;
use Gesdinet\JWTRefreshTokenBundle\Generator\RefreshTokenGeneratorInterface;
use Gesdinet\JWTRefreshTokenBundle\Model\RefreshTokenManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/auth')]
class AuthController extends AbstractApiController
{
    #[Route('/register', methods: ['POST'])]
    public function register(
        #[MapRequestPayload] RegisterDTO $dto,
        AuthService $authService,
    ): JsonResponse {
        $authService->register($dto);

        return $this->created([
            'message' => 'Compte créé avec succès.',
        ]);
    }

    #[Route('/verify-email', methods: ['GET'])]
    public function verifyEmail(
        Request $request,
        AuthService $authService,
        JWTTokenManagerInterface $jwtManager,
        RefreshTokenGeneratorInterface $refreshTokenGenerator,
        RefreshTokenManagerInterface $refreshTokenManager,
        #[Autowire('%env(int:JWT_REFRESH_TOKEN_TTL)%')] int $refreshTokenTtl,
    ): JsonResponse {
        $token = $request->query->get('token', '');

        if (!$token) {
            return $this->error('Token is required.', 400);
        }

        $user = $authService->verifyEmail($token);

        if ($user === null) {
            return $this->error('Invalid or expired verification token.', 410);
        }

        // Auto-login après vérification : on émet aussi un refresh token
        // (comme le login), sinon la session expire au bout de l'access token TTL.
        $refreshToken = $refreshTokenGenerator->createForUserWithTtl($user, $refreshTokenTtl);
        $refreshTokenManager->save($refreshToken);

        return $this->success([
            'access_token'  => $jwtManager->create($user),
            'refresh_token' => $refreshToken->getRefreshToken(),
            'expires_in'    => 3600,
            'message'       => 'Email vérifié avec succès',
        ]);
    }

    #[Route('/resend-verification', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function resendVerification(
        #[CurrentUser] User $user,
        AuthService $authService,
    ): JsonResponse {
        if ($user->isEmailVerified()) {
            return $this->success(['message' => 'Email déjà vérifié', 'already_verified' => true]);
        }

        $authService->resendVerification($user);

        return $this->success(['message' => 'Mail de vérification renvoyé', 'already_verified' => false]);
    }

    #[Route('/forgot-password', methods: ['POST'])]
    public function forgotPassword(
        #[MapRequestPayload] ForgotPasswordDTO $dto,
        AuthService $authService,
    ): JsonResponse {
        $authService->requestPasswordReset($dto->email);

        return $this->success([
            'message' => 'Si cet email existe, un lien de réinitialisation a été envoyé.',
        ]);
    }

    #[Route('/reset-password', methods: ['POST'])]
    public function resetPassword(
        #[MapRequestPayload] ResetPasswordDTO $dto,
        AuthService $authService,
    ): JsonResponse {
        if ($dto->password !== $dto->passwordConfirm) {
            return $this->error('Passwords do not match.', 422);
        }

        $user = $authService->resetPassword($dto->token, $dto->password);

        if ($user === null) {
            return $this->error('Invalid or expired reset token.', 410);
        }

        return $this->success(['message' => 'Mot de passe modifié avec succès']);
    }

    #[Route('/logout', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function logout(
        Request $request,
        RefreshTokenManagerInterface $refreshTokenManager,
    ): JsonResponse {
        $data = json_decode($request->getContent(), true) ?? [];
        $refreshTokenString = $data['refresh_token'] ?? null;

        if ($refreshTokenString) {
            $refreshToken = $refreshTokenManager->get($refreshTokenString);
            if ($refreshToken !== null) {
                $refreshTokenManager->delete($refreshToken);
            }
        }

        return $this->noContent();
    }
}
