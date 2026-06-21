<?php

namespace App\Entity;

use App\Repository\SpeciesRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: SpeciesRepository::class)]
#[ORM\Table(name: 'species')]
class Species
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'bigint')]
    private ?int $id = null;

    #[ORM\Column(length: 120)]
    #[Assert\NotBlank]
    private string $name;

    #[ORM\Column(length: 140, unique: true)]
    #[Assert\NotBlank]
    private string $slug;

    #[ORM\Column(length: 120, nullable: true)]
    private ?string $family = null;

    #[ORM\Column(type: 'text')]
    #[Assert\NotBlank]
    private string $description;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $temperament = null;

    #[ORM\Column(type: 'smallint', nullable: true)]
    private ?int $lifeExpectancyMin = null;

    #[ORM\Column(type: 'smallint', nullable: true)]
    private ?int $lifeExpectancyMax = null;

    #[ORM\Column(length: 120, nullable: true)]
    private ?string $dietType = null;

    #[ORM\Column(type: 'decimal', precision: 8, scale: 2, nullable: true)]
    private ?string $avgMonthlyCost = null;

    #[ORM\Column(length: 20, nullable: true)]
    #[Assert\Choice(choices: ['easy', 'medium', 'high'])]
    private ?string $careLevel = null;

    #[ORM\Column(length: 500, nullable: true)]
    private ?string $imageUrl = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeInterface $createdAt;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeInterface $updatedAt;

    #[ORM\OneToMany(mappedBy: 'species', targetEntity: Breed::class, cascade: ['persist', 'remove'])]
    private Collection $breeds;

    public function __construct()
    {
        $this->breeds = new ArrayCollection();
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getName(): string { return $this->name; }
    public function setName(string $name): static { $this->name = $name; return $this; }

    public function getSlug(): string { return $this->slug; }
    public function setSlug(string $slug): static { $this->slug = $slug; return $this; }

    public function getFamily(): ?string { return $this->family; }
    public function setFamily(?string $family): static { $this->family = $family; return $this; }

    public function getDescription(): string { return $this->description; }
    public function setDescription(string $description): static { $this->description = $description; return $this; }

    public function getTemperament(): ?string { return $this->temperament; }
    public function setTemperament(?string $temperament): static { $this->temperament = $temperament; return $this; }

    public function getLifeExpectancyMin(): ?int { return $this->lifeExpectancyMin; }
    public function setLifeExpectancyMin(?int $lifeExpectancyMin): static { $this->lifeExpectancyMin = $lifeExpectancyMin; return $this; }

    public function getLifeExpectancyMax(): ?int { return $this->lifeExpectancyMax; }
    public function setLifeExpectancyMax(?int $lifeExpectancyMax): static { $this->lifeExpectancyMax = $lifeExpectancyMax; return $this; }

    public function getDietType(): ?string { return $this->dietType; }
    public function setDietType(?string $dietType): static { $this->dietType = $dietType; return $this; }

    public function getAvgMonthlyCost(): ?string { return $this->avgMonthlyCost; }
    public function setAvgMonthlyCost(?string $avgMonthlyCost): static { $this->avgMonthlyCost = $avgMonthlyCost; return $this; }

    public function getCareLevel(): ?string { return $this->careLevel; }
    public function setCareLevel(?string $careLevel): static { $this->careLevel = $careLevel; return $this; }

    public function getImageUrl(): ?string { return $this->imageUrl; }
    public function setImageUrl(?string $imageUrl): static { $this->imageUrl = $imageUrl; return $this; }

    public function getCreatedAt(): \DateTimeInterface { return $this->createdAt; }
    public function getUpdatedAt(): \DateTimeInterface { return $this->updatedAt; }
    public function setUpdatedAt(\DateTimeInterface $updatedAt): static { $this->updatedAt = $updatedAt; return $this; }

    public function getBreeds(): Collection { return $this->breeds; }
}
