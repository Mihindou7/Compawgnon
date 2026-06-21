<?php

namespace App\Entity;

use App\Repository\BreedRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: BreedRepository::class)]
#[ORM\Table(name: 'breeds')]
#[ORM\UniqueConstraint(name: 'uniq_breed_species_slug', columns: ['species_id', 'slug'])]
class Breed
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'bigint')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Species::class, inversedBy: 'breeds')]
    #[ORM\JoinColumn(nullable: false)]
    private Species $species;

    #[ORM\Column(length: 120)]
    #[Assert\NotBlank]
    private string $name;

    #[ORM\Column(length: 140)]
    #[Assert\NotBlank]
    private string $slug;

    #[ORM\Column(type: 'text')]
    #[Assert\NotBlank]
    private string $description;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $temperament = null;

    #[ORM\Column(length: 20, nullable: true)]
    #[Assert\Choice(choices: ['small', 'medium', 'large'])]
    private ?string $size = null;

    #[ORM\Column(length: 20, nullable: true)]
    #[Assert\Choice(choices: ['easy', 'medium', 'high'])]
    private ?string $careLevel = null;

    #[ORM\Column(length: 500, nullable: true)]
    private ?string $imageUrl = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeInterface $createdAt;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeInterface $updatedAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getSpecies(): Species { return $this->species; }
    public function setSpecies(Species $species): static { $this->species = $species; return $this; }

    public function getName(): string { return $this->name; }
    public function setName(string $name): static { $this->name = $name; return $this; }

    public function getSlug(): string { return $this->slug; }
    public function setSlug(string $slug): static { $this->slug = $slug; return $this; }

    public function getDescription(): string { return $this->description; }
    public function setDescription(string $description): static { $this->description = $description; return $this; }

    public function getTemperament(): ?string { return $this->temperament; }
    public function setTemperament(?string $temperament): static { $this->temperament = $temperament; return $this; }

    public function getSize(): ?string { return $this->size; }
    public function setSize(?string $size): static { $this->size = $size; return $this; }

    public function getCareLevel(): ?string { return $this->careLevel; }
    public function setCareLevel(?string $careLevel): static { $this->careLevel = $careLevel; return $this; }

    public function getImageUrl(): ?string { return $this->imageUrl; }
    public function setImageUrl(?string $imageUrl): static { $this->imageUrl = $imageUrl; return $this; }

    public function getCreatedAt(): \DateTimeInterface { return $this->createdAt; }
    public function getUpdatedAt(): \DateTimeInterface { return $this->updatedAt; }
    public function setUpdatedAt(\DateTimeInterface $updatedAt): static { $this->updatedAt = $updatedAt; return $this; }
}
