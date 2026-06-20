<?php

namespace App\EventListener;

use App\Entity\User;
use App\Repository\UserRepository;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTDecodedEvent;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAuthenticationException;

#[AsEventListener(event: 'lexik_jwt_authentication.on_jwt_decoded')]
class AccountDisabledListener
{
    public function __construct(private readonly UserRepository $userRepository)
    {
    }

    public function __invoke(JWTDecodedEvent $event): void
    {
        $payload = $event->getPayload();

        if (!isset($payload['username'])) {
            return;
        }

        $user = $this->userRepository->findByEmail($payload['username']);

        if ($user instanceof User && !$user->isActive()) {
            $event->markAsInvalid();
            throw new CustomUserMessageAuthenticationException('Account is disabled.');
        }
    }
}
