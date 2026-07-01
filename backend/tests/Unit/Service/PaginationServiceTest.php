<?php

namespace App\Tests\Unit\Service;

use App\Service\PaginationService;
use Doctrine\ORM\Query;
use Doctrine\ORM\QueryBuilder;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class PaginationServiceTest extends TestCase
{
    private PaginationService $service;

    protected function setUp(): void
    {
        $this->service = new PaginationService();
    }

    public function testHasNextEstFalseSurLaDernierePage(): void
    {
        // total=20, limit=10, page=2 → totalPages=2 → has_next = (2 < 2) = false
        $qb = $this->makeQb(total: 20, items: array_fill(0, 10, new \stdClass()));

        $result = $this->service->paginate($qb, page: 2, limit: 10);

        $this->assertFalse($result['meta']['has_next']);
        $this->assertTrue($result['meta']['has_prev']);
        $this->assertSame(2, $result['meta']['total_pages']);
    }

    public function testHasPrevEstFalseSurLaPage1(): void
    {
        // page=1 → has_prev = (1 > 1) = false
        $qb = $this->makeQb(total: 20, items: array_fill(0, 10, new \stdClass()));

        $result = $this->service->paginate($qb, page: 1, limit: 10);

        $this->assertFalse($result['meta']['has_prev']);
        $this->assertTrue($result['meta']['has_next']);
        $this->assertSame(1, $result['meta']['page']);
    }

    public function testCalculeCorrectementTotalPages(): void
    {
        // total=25, limit=10 → totalPages = ceil(25/10) = 3
        $qb = $this->makeQb(total: 25, items: array_fill(0, 10, new \stdClass()));

        $result = $this->service->paginate($qb, page: 1, limit: 10);

        $this->assertSame(3, $result['meta']['total_pages']);
        $this->assertSame(25, $result['meta']['total']);
    }

    public function testResultatsVidesRetourneTotalEtTotalPagesAZero(): void
    {
        $qb = $this->makeQb(total: 0, items: []);

        $result = $this->service->paginate($qb, page: 1, limit: 10);

        $this->assertSame(0, $result['meta']['total']);
        $this->assertSame(0, $result['meta']['total_pages']);
        $this->assertFalse($result['meta']['has_next']);
        $this->assertFalse($result['meta']['has_prev']);
        $this->assertSame([], $result['data']);
    }

    // =========================================================================
    // Helper
    // =========================================================================

    /**
     * Construit un QueryBuilder mock configuré pour le service de pagination.
     *
     * Séquence d'appels dans paginate() :
     *   1. (clone $qb)->select(...)->getQuery()->getSingleScalarResult() → $total
     *   2. $qb->setFirstResult()->setMaxResults()->getQuery()->getResult()   → $items
     *
     * Le clone hérite des mêmes stubs → select() retourne $qb (l'original),
     * les deux appels à getQuery() tombent sur le même $query mock.
     *
     * @return QueryBuilder&MockObject
     */
    private function makeQb(int $total, array $items): QueryBuilder
    {
        $query = $this->createStub(Query::class);
        $query->method('getSingleScalarResult')->willReturn($total);
        $query->method('getResult')->willReturn($items);

        $qb = $this->createStub(QueryBuilder::class);
        $qb->method('getRootAliases')->willReturn(['a']);
        $qb->method('select')->willReturn($qb);
        $qb->method('setFirstResult')->willReturn($qb);
        $qb->method('setMaxResults')->willReturn($qb);
        $qb->method('getQuery')->willReturn($query);

        return $qb;
    }
}
