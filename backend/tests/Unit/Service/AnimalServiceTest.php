<?php

namespace App\Tests\Unit\Service;

use App\DTO\Seller\CreateAnimalDTO;
use App\Entity\Animal;
use App\Entity\AnimalMedia;
use App\Entity\Seller;
use App\Entity\Species;
use App\Entity\User;
use App\Repository\BreedRepository;
use App\Repository\SpeciesRepository;
use App\Service\AnimalService;
use App\Service\UploadService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class AnimalServiceTest extends TestCase
{
    private MockObject&EntityManagerInterface $em;
    private MockObject&SpeciesRepository $speciesRepo;
    private BreedRepository $breedRepo;
    private UploadService $uploadService;
    private AnimalService $service;

    protected function setUp(): void
    {
        $this->em            = $this->createMock(EntityManagerInterface::class);
        $this->speciesRepo   = $this->createMock(SpeciesRepository::class);
        $this->breedRepo     = $this->createStub(BreedRepository::class);
        $this->uploadService = $this->createStub(UploadService::class);

        $this->service = new AnimalService(
            $this->em,
            $this->speciesRepo,
            $this->breedRepo,
            $this->uploadService,
        );
    }

    // =========================================================================
    // create()
    // =========================================================================

    public function testCreateLeveUneExceptionSiVendeurNonApprouve(): void
    {
        // verifiedStatus vaut 'pending' par défaut → isApproved() = false
        $seller = new Seller();
        $dto    = $this->makeCreateDTO();

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(403);
        $this->service->create($seller, $dto);
    }

    public function testCreateCreeLAnnonceEnStatutPendingReview(): void
    {
        $seller  = $this->makeSeller();
        $species = new Species();
        $dto     = $this->makeCreateDTO(speciesId: 1);

        $this->speciesRepo->expects($this->once())->method('find')->with(1)->willReturn($species);
        $this->em->expects($this->once())->method('persist')->with($this->isInstanceOf(Animal::class));
        $this->em->expects($this->once())->method('flush');

        $animal = $this->service->create($seller, $dto);

        $this->assertSame('pending_review', $animal->getStatus());
        $this->assertSame($seller, $animal->getSeller());
        $this->assertSame($species, $animal->getSpecies());
        $this->assertSame($dto->title, $animal->getTitle());
    }

    // =========================================================================
    // update()
    // =========================================================================

    public function testUpdateRepasseEnPendingReviewSiAnnonceEtaitPublished(): void
    {
        $seller = $this->makeSeller();
        $animal = $this->makeAnimal($seller, 'published');

        // même objet seller → getSeller()->getId() === $seller->getId() === null → vérif passe
        $this->em->expects($this->once())->method('flush');

        $result = $this->service->update($animal, $seller, ['title' => 'Nouveau titre']);

        $this->assertSame('pending_review', $result->getStatus());
    }

    // =========================================================================
    // archive()
    // =========================================================================

    public function testArchiveLeveUneExceptionSiAnimalEstReserved(): void
    {
        $seller = $this->makeSeller();
        $animal = $this->makeAnimal($seller, 'reserved');

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(409);
        $this->service->archive($animal, $seller);
    }

    // =========================================================================
    // uploadMedia()
    // =========================================================================

    public function testUploadMediaLeveUneExceptionSi10PhotosDejaPresentes(): void
    {
        $seller = $this->makeSeller();
        $animal = $this->makeAnimal($seller, 'published');

        // On remplit la collection jusqu'à la limite
        for ($i = 0; $i < 10; $i++) {
            $animal->getMedia()->add(new AnimalMedia());
        }

        // $file n'est pas utilisé : l'exception est levée avant son accès
        $file = $this->createMock(UploadedFile::class);

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(409);
        $this->service->uploadMedia($animal, $seller, $file, false, 0);
    }

    // =========================================================================
    // deleteMedia()
    // =========================================================================

    public function testDeleteMediaLeveUneExceptionSiSeulePhotoAnnoncePublished(): void
    {
        $seller = $this->makeSeller();
        $animal = $this->makeAnimal($seller, 'published');

        // Un seul média dont l'ID est identifiable via réflexion
        $media = new AnimalMedia();
        $this->setEntityId($media, 1);
        $animal->getMedia()->add($media);

        // Le service trouve le média par getId() === 1, puis détecte qu'il est le dernier
        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(409);
        $this->service->deleteMedia($animal, $seller, 1);
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private function makeSeller(): Seller
    {
        $user = new User();
        $user->setEmail('seller@test.com');

        $seller = new Seller();
        $seller->setUser($user);
        $seller->setVerifiedStatus('approved');

        return $seller;
    }

    private function makeAnimal(Seller $seller, string $status = 'draft'): Animal
    {
        $animal = new Animal();
        $animal->setSeller($seller);
        $animal->setTitle('Labrador à adopter');
        $animal->setStatus($status);

        return $animal;
    }

    private function makeCreateDTO(int $speciesId = 1): CreateAnimalDTO
    {
        $dto              = new CreateAnimalDTO();
        $dto->speciesId   = $speciesId;
        $dto->title       = 'Labrador à adopter';
        $dto->description = str_repeat('a', 80);
        $dto->sex         = 'male';
        $dto->price       = 500.0;
        $dto->city        = 'Paris';
        $dto->postalCode  = '75001';

        return $dto;
    }

    /**
     * Injecte un ID sur une entité non persistée via réflexion.
     * Nécessaire pour que deleteMedia() identifie le bon AnimalMedia par getId().
     */
    private function setEntityId(object $entity, int $id): void
    {
        $prop = new \ReflectionProperty($entity, 'id');
        $prop->setValue($entity, $id);
    }
}
