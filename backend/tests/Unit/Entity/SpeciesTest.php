<?php

namespace App\Tests\Unit\Entity;

use App\Entity\Species;
use Doctrine\Common\Collections\Collection;
use PHPUnit\Framework\TestCase;

class SpeciesTest extends TestCase
{
    public function testCollectionRacesVideeALaCreation(): void
    {
        $species = new Species();
        $this->assertInstanceOf(Collection::class, $species->getBreeds());
        $this->assertCount(0, $species->getBreeds());
    }

    public function testCreatedAtEstImmutableALaCreation(): void
    {
        $species = new Species();
        $this->assertInstanceOf(\DateTimeImmutable::class, $species->getCreatedAt());
    }

    public function testIdEstNullAvantPersistance(): void
    {
        $species = new Species();
        $this->assertNull($species->getId());
    }

    public function testSettersGettersNom(): void
    {
        $species = new Species();
        $species->setName('Chien');
        $this->assertSame('Chien', $species->getName());
    }

    public function testSettersGettersSlug(): void
    {
        $species = new Species();
        $species->setSlug('chien');
        $this->assertSame('chien', $species->getSlug());
    }

    public function testCareLevelEstNullParDefaut(): void
    {
        $species = new Species();
        $this->assertNull($species->getCareLevel());
    }

    public function testSettersChainage(): void
    {
        $species = new Species();
        $result = $species
            ->setName('Chat')
            ->setSlug('chat')
            ->setDescription('Félin domestique');
        $this->assertSame($species, $result);
    }

    public function testImageUrlEstNullParDefaut(): void
    {
        $species = new Species();
        $this->assertNull($species->getImageUrl());
    }

    public function testDefinirImageUrl(): void
    {
        $species = new Species();
        $species->setImageUrl('/uploads/species/chat.jpg');
        $this->assertSame('/uploads/species/chat.jpg', $species->getImageUrl());
    }
}
