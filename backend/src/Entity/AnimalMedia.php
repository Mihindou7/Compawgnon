<?php

namespace App\Entity;

use App\Repository\AnimalMediaRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: AnimalMediaRepository::class)]
#[ORM\Table(name: 'animal_media')]
class AnimalMedia
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'bigint')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Animal::class, inversedBy: 'media')]
    #[ORM\JoinColumn(nullable: false)]
    private Animal $animal;

    #[ORM\Column(length: 500)]
    #[Assert\NotBlank]
    private string $fileUrl;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $originalName = null;

    #[ORM\Column(length: 100)]
    #[Assert\Choice(choices: ['image/jpeg', 'image/png', 'image/webp'])]
    private string $mimeType;

    #[ORM\Column(type: 'smallint')]
    private int $position = 0;

    #[ORM\Column(type: 'boolean')]
    private bool $isCover = false;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeInterface $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getAnimal(): Animal { return $this->animal; }
    public function setAnimal(Animal $animal): static { $this->animal = $animal; return $this; }

    public function getFileUrl(): string { return $this->fileUrl; }
    public function setFileUrl(string $fileUrl): static { $this->fileUrl = $fileUrl; return $this; }

    public function getOriginalName(): ?string { return $this->originalName; }
    public function setOriginalName(?string $originalName): static { $this->originalName = $originalName; return $this; }

    public function getMimeType(): string { return $this->mimeType; }
    public function setMimeType(string $mimeType): static { $this->mimeType = $mimeType; return $this; }

    public function getPosition(): int { return $this->position; }
    public function setPosition(int $position): static { $this->position = $position; return $this; }

    public function isCover(): bool { return $this->isCover; }
    public function setIsCover(bool $isCover): static { $this->isCover = $isCover; return $this; }

    public function getCreatedAt(): \DateTimeInterface { return $this->createdAt; }
}
