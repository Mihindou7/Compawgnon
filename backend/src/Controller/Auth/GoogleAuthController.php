<?php

namespace App\Controller\Auth;

use App\Controller\AbstractApiController;
use App\Service\GoogleAuthService;
use Gesdinet\JWTRefreshTokenBundle\Generator\RefreshTokenGeneratorInterface;
use Gesdinet\JWTRefreshTokenBundle\Model\RefreshTokenManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/auth/google')]
class GoogleAuthController extends AbstractApiController
{
    #[Route('', methods: ['POST'])]
    public function authenticate(
        Request $request,
        GoogleAuthService $googleAuthService,
        JWTTokenManagerInterface $jwtManager,
        RefreshTokenGeneratorInterface $refreshTokenGenerator,
        RefreshTokenManagerInterface $refreshTokenManager,
        #[Autowire('%env(int:JWT_REFRESH_TOKEN_TTL)%')] int $refreshTokenTtl,
    ): JsonResponse {
        $data = json_decode($request->getContent(), true) ?? [];
        $accessToken = trim($data['access_token'] ?? '');

        if (!$accessToken) {
            return $this->error('access_token is required.', 400);
        }

        try {
            $payload = $googleAuthService->verifyAccessToken($accessToken);
            $user    = $googleAuthService->findOrCreate($payload);
        } catch (\RuntimeException $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 400);
        }

        if ($user->getStatus() !== 'active') {
            return $this->error('Your account has been disabled.', 403);
        }

        $refreshToken = $refreshTokenGenerator->createForUserWithTtl($user, $refreshTokenTtl);
        $refreshTokenManager->save($refreshToken);

        return $this->success([
            'access_token'  => $jwtManager->create($user),
            'refresh_token' => $refreshToken->getRefreshToken(),
            'expires_in'    => 3600,
        ]);
    }
}
