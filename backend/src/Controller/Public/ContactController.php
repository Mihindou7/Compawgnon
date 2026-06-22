<?php

namespace App\Controller\Public;

use App\Controller\AbstractApiController;
use App\Controller\Trait\HandlesDomainException;
use App\DTO\Contact\CreateContactDTO;
use App\Service\ContactService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/contact')]
class ContactController extends AbstractApiController
{
    use HandlesDomainException;

    #[Route('', methods: ['POST'])]
    public function submit(
        #[MapRequestPayload] CreateContactDTO $dto,
        Request $request,
        ContactService $contactService,
    ): JsonResponse {
        return $this->tryService(function () use ($dto, $request, $contactService) {
            $contact = $contactService->create($dto, $request->getClientIp());

            return $this->created([
                'id'      => $contact->getId(),
                'message' => 'Votre message a bien été envoyé. Nous vous répondrons dans les plus brefs délais.',
            ]);
        });
    }
}
