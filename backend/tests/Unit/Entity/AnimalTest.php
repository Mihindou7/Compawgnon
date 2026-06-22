<?php

namespace App\Tests\Unit\Entity;

use App\Entity\Animal;
use Doctrine\Common\Collections\Collection;
use PHPUnit\Framework\TestCase;

class AnimalTest extends TestCase
{
    public function testStatutParDefautEstDraft(): void
    {
        $animal = new Animal();
        $this->assertSame('draft', $animal->getStatus());
    }

    public function testIsPublicRetourneFalsePourDraft(): void
    {
        $animal = new Animal();
        $this->assertFalse($animal->isPublic());
    }

    public function testIsPublicRetourneTruePourPublished(): void
    {
        $animal = new Animal();
        $animal->setStatus('published');
        $this->assertTrue($animal->isPublic());
    }

    public function testIsPublicRetourneFalsePourReserved(): void
    {
        $animal = new Animal();
        $animal->setStatus('reserved');
        $this->assertFalse($animal->isPublic());
    }

    public function testSettersChainage(): void
    {
        $animal = new Animal();
        $result = $animal
            ->setTitle('Labrador adorable')
            ->setCity('Paris')
            ->setPostalCode('75001')
            ->setSex('male');
        $this->assertSame($animal, $result);
    }

    public function testGettersApresSetters(): void
    {
        $animal = new Animal();
        $animal->setTitle('Golden Retriever');
        $animal->setCity('Lyon');
        $animal->setPostalCode('69001');
        $animal->setSex('female');
        $animal->setPrice('850.00');

        $this->assertSame('Golden Retriever', $animal->getTitle());
        $this->assertSame('Lyon', $animal->getCity());
        $this->assertSame('69001', $animal->getPostalCode());
        $this->assertSame('female', $animal->getSex());
        $this->assertSame('850.00', $animal->getPrice());
    }

    public function testIdEstNullAvantPersistance(): void
    {
        $animal = new Animal();
        $this->assertNull($animal->getId());
    }

    public function testCreatedAtEstImmutable(): void
    {
        $animal = new Animal();
        $this->assertInstanceOf(\DateTimeImmutable::class, $animal->getCreatedAt());
    }

    public function testCollectionsVideesALaCreation(): void
    {
        $animal = new Animal();
        $this->assertInstanceOf(Collection::class, $animal->getMedia());
        $this->assertCount(0, $animal->getMedia());
        $this->assertCount(0, $animal->getDocuments());
        $this->assertCount(0, $animal->getReservations());
        $this->assertCount(0, $animal->getFavoritedBy());
    }

    public function testNameEstNullParDefaut(): void
    {
        $animal = new Animal();
        $this->assertNull($animal->getName());
    }

    public function testDefinirEtRecupererName(): void
    {
        $animal = new Animal();
        $animal->setName('Milo');
        $this->assertSame('Milo', $animal->getName());
    }
}
