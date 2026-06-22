<?php

namespace App\Entity;

use App\Repository\AnimalDocumentRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: AnimalDocumentRepository::class)]
#[ORM\Table(name: 'animal_documents')]
class AnimalDocument
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'bigint')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Animal::class, inversedBy: 'documents')]
    #[ORM\JoinColumn(nullable: false)]
    private Animal $animal;

    #[ORM\Column(length: 20)]
    #[Assert\NotBlank]
    #[Assert\Choice(choices: ['vaccine', 'certificate', 'pedigree', 'other'])]
    private string $type;

    #[ORM\Column(length: 500)]
    #[Assert\NotBlank]
    private string $fileUrl;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $originalName = null;

    #[ORM\Column(length: 100)]
    #[Assert\Choice(choices: ['image/jpeg', 'image/png', 'application/pdf'])]
    private string $mimeType;

    #[ORM\Column(type: 'boolean')]
    private bool $isPublic = false;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeInterface $verifiedAt = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeInterface $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getAnimal(): Animal { return $this->animal; }
    public function setAnimal(Animal $animal): static { $this->animal = $animal; return $this; }

    public function getType(): string { return $this->type; }
    public function setType(string $type): static { $this->type = $type; return $this; }

    public function getFileUrl(): string { return $this->fileUrl; }
    public function setFileUrl(string $fileUrl): static { $this->fileUrl = $fileUrl; return $this; }

    public function getOriginalName(): ?string { return $this->originalName; }
    public function setOriginalName(?string $originalName): static { $this->originalName = $originalName; return $this; }

    public function getMimeType(): string { return $this->mimeType; }
    public function setMimeType(string $mimeType): static { $this->mimeType = $mimeType; return $this; }

    public function isPublic(): bool { return $this->isPublic; }
    public function setIsPublic(bool $isPublic): static { $this->isPublic = $isPublic; return $this; }

    public function getVerifiedAt(): ?\DateTimeInterface { return $this->verifiedAt; }
    public function setVerifiedAt(?\DateTimeInterface $verifiedAt): static { $this->verifiedAt = $verifiedAt; return $this; }

    public function getCreatedAt(): \DateTimeInterface { return $this->createdAt; }
}
