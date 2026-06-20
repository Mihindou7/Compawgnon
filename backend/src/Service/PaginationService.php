<?php

namespace App\Service;

use Doctrine\ORM\QueryBuilder;

readonly class PaginationService
{
    public function paginate(QueryBuilder $qb, int $page, int $limit): array
    {
        $page  = max(1, $page);
        $limit = min(max(1, $limit), 50);

        $rootAliases = $qb->getRootAliases();
        $rootAlias   = $rootAliases[0];

        $total = (int) (clone $qb)
            ->select("COUNT(DISTINCT {$rootAlias}.id)")
            ->getQuery()
            ->getSingleScalarResult();

        $items = $qb
            ->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();

        $totalPages = $total > 0 ? (int) ceil($total / $limit) : 1;

        return [
            'data' => $items,
            'meta' => [
                'page'        => $page,
                'limit'       => $limit,
                'total'       => $total,
                'total_pages' => $totalPages,
                'has_next'    => $page < $totalPages,
                'has_prev'    => $page > 1,
            ],
        ];
    }
}
