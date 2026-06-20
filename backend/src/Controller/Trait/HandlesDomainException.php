<?php

namespace App\Controller\Trait;

use Symfony\Component\HttpFoundation\JsonResponse;

trait HandlesDomainException
{
    private function tryService(callable $fn): JsonResponse
    {
        try {
            return $fn();
        } catch (\DomainException $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 400);
        }
    }
}
