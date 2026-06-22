<?php

namespace App\Service;

use App\DTO\Seller\CreateAnimalDTO;
use App\Entity\Animal;
use App\Entity\AnimalDocument;
use App\Entity\AnimalMedia;
use App\Entity\Seller;
use App\Repository\BreedRepository;
use App\Repository\SpeciesRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class AnimalService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly SpeciesRepository $speciesRepo,
        private readonly BreedRepository $breedRepo,
        private readonly UploadService $uploadService,
    ) {
    }

    public function create(Seller $seller, CreateAnimalDTO $dto): Animal
    {
        if (!$seller->isApproved()) {
            throw new \DomainException('Seller account not approved.', 403);
        }

        $species = $this->speciesRepo->find($dto->speciesId);
        if (!$species) {
            throw new \DomainException('Species not found.', 404);
        }

        $animal = new Animal();
        $animal->setSeller($seller);
        $animal->setSpecies($species);
        $animal->setTitle($dto->title);
        $animal->setDescription($dto->description);
        $animal->setSex($dto->sex);
        $animal->setPrice((string) $dto->price);
        $animal->setCity($dto->city);
        $animal->setPostalCode($dto->postalCode);
        $animal->setLatitude($dto->latitude !== null ? (string) $dto->latitude : null);
        $animal->setLongitude($dto->longitude !== null ? (string) $dto->longitude : null);
        $animal->setRegion($dto->region);
        $animal->setDepartment($dto->department);
        $animal->setDepartmentCode($dto->departmentCode);
        $animal->setName($dto->name);
        $animal->setStatus('pending_review');

        if ($dto->breedId) {
            $breed = $this->breedRepo->find($dto->breedId);
            if ($breed) {
                $animal->setBreed($breed);
            }
        }

        if ($dto->birthdate) {
            $animal->setBirthdate(new \DateTimeImmutable($dto->birthdate));
        }

        $this->em->persist($animal);
        $this->em->flush();

        return $animal;
    }

    public function update(Animal $animal, Seller $seller, array $data): Animal
    {
        if ($animal->getSeller()->getId() !== $seller->getId()) {
            throw new \DomainException('Animal not found.', 404);
        }

        if (in_array($animal->getStatus(), ['reserved', 'sold', 'archived'], true)) {
            throw new \DomainException('Cannot edit an animal with status: ' . $animal->getStatus() . '.', 409);
        }

        if (isset($data['title']))       $animal->setTitle($data['title']);
        if (isset($data['description'])) $animal->setDescription($data['description']);
        if (isset($data['price']))       $animal->setPrice((string) $data['price']);
        if (isset($data['city']))              $animal->setCity($data['city']);
        if (isset($data['postal_code']))       $animal->setPostalCode($data['postal_code']);
        if (array_key_exists('latitude', $data))        $animal->setLatitude($data['latitude'] !== null ? (string) $data['latitude'] : null);
        if (array_key_exists('longitude', $data))       $animal->setLongitude($data['longitude'] !== null ? (string) $data['longitude'] : null);
        if (array_key_exists('region', $data))          $animal->setRegion($data['region']);
        if (array_key_exists('department', $data))      $animal->setDepartment($data['department']);
        if (array_key_exists('department_code', $data)) $animal->setDepartmentCode($data['department_code']);
        if (isset($data['sex']))               $animal->setSex($data['sex']);
        if (isset($data['birthdate']))   $animal->setBirthdate(new \DateTimeImmutable($data['birthdate']));

        if (isset($data['breed_id'])) {
            $breed = $this->breedRepo->find($data['breed_id']);
            if ($breed) {
                $animal->setBreed($breed);
            }
        }

        $wasPublished = $animal->getStatus() === 'published';
        if ($wasPublished) {
            $animal->setStatus('pending_review');
        }

        $animal->setUpdatedAt(new \DateTimeImmutable());
        $this->em->flush();

        return $animal;
    }

    public function archive(Animal $animal, Seller $seller): void
    {
        if ($animal->getSeller()->getId() !== $seller->getId()) {
            throw new \DomainException('Animal not found.', 404);
        }

        if ($animal->getStatus() === 'reserved') {
            throw new \DomainException('Cannot archive a reserved animal. Handle the reservation first.', 409);
        }

        $animal->setStatus('archived');
        $animal->setUpdatedAt(new \DateTimeImmutable());
        $this->em->flush();
    }

    public function uploadMedia(Animal $animal, Seller $seller, UploadedFile $file, bool $isCover, int $position): AnimalMedia
    {
        if ($animal->getSeller()->getId() !== $seller->getId()) {
            throw new \DomainException('Animal not found.', 404);
        }

        if ($animal->getMedia()->count() >= 10) {
            throw new \DomainException('Maximum 10 photos per listing.', 409);
        }

        $originalName = $file->getClientOriginalName();
        $mimeType     = $file->getMimeType() ?? $file->getClientMimeType() ?? 'image/jpeg';
        $url          = $this->uploadService->uploadAnimalMedia($file);

        if ($isCover) {
            foreach ($animal->getMedia() as $existing) {
                if ($existing->isCover()) {
                    $existing->setIsCover(false);
                }
            }
        }

        $media = new AnimalMedia();
        $media->setAnimal($animal);
        $media->setFileUrl($url);
        $media->setOriginalName($originalName);
        $media->setMimeType($mimeType);
        $media->setPosition($position);
        $media->setIsCover($isCover);

        $this->em->persist($media);
        $this->em->flush();

        return $media;
    }

    public function deleteMedia(Animal $animal, Seller $seller, int $mediaId): void
    {
        if ($animal->getSeller()->getId() !== $seller->getId()) {
            throw new \DomainException('Animal not found.', 404);
        }

        $media = null;
        foreach ($animal->getMedia() as $m) {
            if ($m->getId() === $mediaId) {
                $media = $m;
                break;
            }
        }

        if (!$media) {
            throw new \DomainException('Media not found.', 404);
        }

        if ($animal->getStatus() === 'published' && $animal->getMedia()->count() === 1) {
            throw new \DomainException('Cannot delete the only photo of a published listing.', 409);
        }

        $wasCover = $media->isCover();
        $this->uploadService->delete($media->getFileUrl());
        $this->em->remove($media);
        $this->em->flush();

        if ($wasCover && $animal->getMedia()->count() > 0) {
            $first = $animal->getMedia()->first();
            if ($first) {
                $first->setIsCover(true);
                $this->em->flush();
            }
        }
    }

    public function uploadDocument(Animal $animal, Seller $seller, UploadedFile $file, string $type, bool $isPublic): AnimalDocument
    {
        if ($animal->getSeller()->getId() !== $seller->getId()) {
            throw new \DomainException('Animal not found.', 404);
        }

        if (!in_array($type, ['vaccine', 'certificate', 'pedigree', 'other'], true)) {
            throw new \DomainException('Invalid document type.', 422);
        }

        $originalName = $file->getClientOriginalName();
        $mimeType     = $file->getMimeType() ?? $file->getClientMimeType() ?? 'application/pdf';
        $url          = $this->uploadService->uploadAnimalDocument($file);

        $doc = new AnimalDocument();
        $doc->setAnimal($animal);
        $doc->setType($type);
        $doc->setFileUrl($url);
        $doc->setOriginalName($originalName);
        $doc->setMimeType($mimeType);
        $doc->setIsPublic($isPublic);

        $this->em->persist($doc);
        $this->em->flush();

        return $doc;
    }

    public function deleteDocument(Animal $animal, Seller $seller, int $docId): void
    {
        if ($animal->getSeller()->getId() !== $seller->getId()) {
            throw new \DomainException('Animal not found.', 404);
        }

        $doc = null;
        foreach ($animal->getDocuments() as $d) {
            if ($d->getId() === $docId) {
                $doc = $d;
                break;
            }
        }

        if (!$doc) {
            throw new \DomainException('Document not found.', 404);
        }

        $this->uploadService->delete($doc->getFileUrl());
        $this->em->remove($doc);
        $this->em->flush();
    }

    public function publish(Animal $animal, \App\Entity\User $admin, MailService $mailService, \App\Service\AuditService $audit): void
    {
        if ($animal->getStatus() !== 'pending_review') {
            throw new \DomainException('Animal is not pending review.', 409);
        }

        $animal->setStatus('published');
        $animal->setPublishedAt(new \DateTimeImmutable());
        $animal->setUpdatedAt(new \DateTimeImmutable());
        $this->em->flush();

        $mailService->sendAnimalPublished($animal->getSeller()->getUser()->getEmail(), $animal->getTitle());
        $audit->log('animal.published', 'Animal', $animal->getId(), $admin);
    }

    public function reject(Animal $animal, \App\Entity\User $admin, ?string $reason, MailService $mailService, \App\Service\AuditService $audit): void
    {
        if ($animal->getStatus() !== 'pending_review') {
            throw new \DomainException('Animal is not pending review.', 409);
        }

        $animal->setStatus('draft');
        $animal->setUpdatedAt(new \DateTimeImmutable());
        $this->em->flush();

        $mailService->sendAnimalRejected($animal->getSeller()->getUser()->getEmail(), $animal->getTitle(), $reason);
        $audit->log('animal.rejected', 'Animal', $animal->getId(), $admin);
    }
}
