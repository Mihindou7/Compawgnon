<?php

namespace App\Controller\Admin;

use App\Controller\AbstractApiController;
use App\Entity\AuditLog;
use App\Repository\AuditLogRepository;
use App\Service\PaginationService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/audit-logs')]
#[IsGranted('ROLE_ADMIN')]
class AuditLogAdminController extends AbstractApiController
{
    #[Route('', methods: ['GET'])]
    public function index(
        Request $request,
        AuditLogRepository $repo,
        PaginationService $paginator,
    ): JsonResponse {
        $page       = (int) $request->query->get('page', 1);
        $limit      = min((int) $request->query->get('limit', 50), 100);
        $action     = $request->query->get('action');
        $actorId    = $request->query->get('actor_id');
        $entityType = $request->query->get('entity_type');
        $entityId   = $request->query->get('entity_id');
        $dateFrom   = $request->query->get('date_from');
        $dateTo     = $request->query->get('date_to');

        $qb = $repo->createQueryBuilder('al')
            ->leftJoin('al.actor', 'u')
            ->addSelect('u')
            ->orderBy('al.createdAt', 'DESC');

        if ($action)     { $qb->andWhere('al.action = :action')->setParameter('action', $action); }
        if ($actorId)    { $qb->andWhere('al.actor = :actor')->setParameter('actor', (int) $actorId); }
        if ($entityType) { $qb->andWhere('al.entityType = :et')->setParameter('et', $entityType); }
        if ($entityId)   { $qb->andWhere('al.entityId = :eid')->setParameter('eid', (int) $entityId); }
        if ($dateFrom)   { $qb->andWhere('al.createdAt >= :from')->setParameter('from', new \DateTimeImmutable($dateFrom)); }
        if ($dateTo)     { $qb->andWhere('al.createdAt <= :to')->setParameter('to', new \DateTimeImmutable($dateTo . ' 23:59:59')); }

        $result = $paginator->paginate($qb, $page, $limit);
        $result['data'] = array_map(fn(AuditLog $log) => [
            'id'          => $log->getId(),
            'actor'       => $log->getActor() ? [
                'id'         => $log->getActor()->getId(),
                'email'      => $log->getActor()->getEmail(),
                'first_name' => $log->getActor()->getFirstName(),
            ] : null,
            'action'      => $log->getAction(),
            'entity_type' => $log->getEntityType(),
            'entity_id'   => $log->getEntityId(),
            'old_values'  => $log->getOldValues(),
            'new_values'  => $log->getNewValues(),
            'ip_address'  => $log->getIpAddress(),
            'created_at'  => $log->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ], $result['data']);

        return $this->json($result);
    }
}
