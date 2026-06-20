<?php

namespace App\EventListener;

use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;
use Symfony\Component\Security\Core\Exception\AuthenticationException;

#[AsEventListener(event: KernelEvents::EXCEPTION, priority: 10)]
class ApiExceptionListener
{
    public function __invoke(ExceptionEvent $event): void
    {
        $request = $event->getRequest();

        if (!str_starts_with($request->getPathInfo(), '/api')) {
            return;
        }

        $exception = $event->getThrowable();
        $status = 500;
        $message = 'An error occurred.';
        $data = null;

        if ($exception instanceof HttpExceptionInterface) {
            $status = $exception->getStatusCode();
            $message = $exception->getMessage() ?: 'An error occurred.';

            // Symfony validation errors from MapRequestPayload
            $previous = $exception->getPrevious();
            if ($previous instanceof \Symfony\Component\Validator\Exception\ValidationFailedException) {
                $violations = [];
                foreach ($previous->getViolations() as $violation) {
                    $field = ltrim((string) $violation->getPropertyPath(), '.');
                    $violations[$field][] = $violation->getMessage();
                }
                $data = ['error' => 'Validation failed', 'violations' => $violations];
            }
        } elseif ($exception instanceof AuthenticationException) {
            $status = 401;
            $message = $exception->getMessageKey();
        } elseif ($exception instanceof AccessDeniedException) {
            // 401 if no token in request, 403 if authenticated but wrong role
            $status = $this->hasToken($request) ? 403 : 401;
            $message = $status === 401 ? 'Authentication required.' : 'Access denied.';
        }

        $event->setResponse(new JsonResponse($data ?? ['error' => $message], $status));
    }

    private function hasToken(Request $request): bool
    {
        $authHeader = $request->headers->get('Authorization', '');
        return str_starts_with($authHeader, 'Bearer ');
    }
}
