<?php

namespace App\Entity;

use App\Repository\AnimalRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: AnimalRepository::class)]
#[ORM\Table(name: 'animals')]
#[ORM\Index(columns: ['status', 'species_id', 'breed_id'], name: 'idx_animals_search')]
#[ORM\Index(columns: ['city', 'postal_code'], name: 'idx_animals_location')]
#[ORM\Index(columns: ['price'], name: 'idx_animals_price')]
#[ORM\Index(columns: ['seller_id', 'status'], name: 'idx_animals_seller')]
#[ORM\Index(columns: ['region'], name: 'idx_animals_region')]
#[ORM\Index(columns: ['department_code'], name: 'idx_animals_dept')]
class Animal
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'bigint')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Seller::class, inversedBy: 'animals')]
    #[ORM\JoinColumn(nullable: false)]
    private Seller $seller;

    #[ORM\ManyToOne(targetEntity: Species::class)]
    #[ORM\JoinColumn(nullable: false)]
    private Species $species;

    #[ORM\ManyToOne(targetEntity: Breed::class)]
    #[ORM\JoinColumn(nullable: true)]
    private ?Breed $breed = null;

    #[ORM\Column(length: 120, nullable: true)]
    private ?string $name = null;

    #[ORM\Column(length: 180)]
    #[Assert\NotBlank]
    private string $title;

    #[ORM\Column(type: 'text')]
    #[Assert\NotBlank]
    #[Assert\Length(min: 80)]
    private string $description;

    #[ORM\Column(length: 10)]
    #[Assert\NotBlank]
    #[Assert\Choice(choices: ['male', 'female', 'unknown'])]
    private string $sex;

    #[ORM\Column(type: 'date_immutable', nullable: true)]
    private ?\DateTimeInterface $birthdate = null;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2)]
    #[Assert\NotNull]
    #[Assert\PositiveOrZero]
    private string $price;

    #[ORM\Column(length: 20)]
    #[Assert\Choice(choices: ['draft', 'pending_review', 'published', 'reserved', 'sold', 'archived'])]
    private string $status = 'draft';

    #[ORM\Column(length: 120)]
    #[Assert\NotBlank]
    private string $city;

    #[ORM\Column(length: 20)]
    #[Assert\NotBlank]
    private string $postalCode;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 7, nullable: true)]
    private ?string $latitude = null;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 7, nullable: true)]
    private ?string $longitude = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $region = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $department = null;

    #[ORM\Column(length: 10, nullable: true)]
    private ?string $departmentCode = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeInterface $publishedAt = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeInterface $createdAt;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeInterface $updatedAt;

    #[ORM\OneToMany(mappedBy: 'animal', targetEntity: AnimalMedia::class, cascade: ['persist', 'remove'])]
    #[ORM\OrderBy(['position' => 'ASC'])]
    private Collection $media;

    #[ORM\OneToMany(mappedBy: 'animal', targetEntity: AnimalDocument::class, cascade: ['persist', 'remove'])]
    private Collection $documents;

    #[ORM\OneToMany(mappedBy: 'animal', targetEntity: Reservation::class)]
    private Collection $reservations;

    #[ORM\OneToMany(mappedBy: 'animal', targetEntity: Favorite::class, cascade: ['remove'])]
    private Collection $favoritedBy;

    public function __construct()
    {
        $this->media = new ArrayCollection();
        $this->documents = new ArrayCollection();
        $this->reservations = new ArrayCollection();
        $this->favoritedBy = new ArrayCollection();
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getSeller(): Seller { return $this->seller; }
    public function setSeller(Seller $seller): static { $this->seller = $seller; return $this; }

    public function getSpecies(): Species { return $this->species; }
    public function setSpecies(Species $species): static { $this->species = $species; return $this; }

    public function getBreed(): ?Breed { return $this->breed; }
    public function setBreed(?Breed $breed): static { $this->breed = $breed; return $this; }

    public function getName(): ?string { return $this->name; }
    public function setName(?string $name): static { $this->name = $name; return $this; }

    public function getTitle(): string { return $this->title; }
    public function setTitle(string $title): static { $this->title = $title; return $this; }

    public function getDescription(): string { return $this->description; }
    public function setDescription(string $description): static { $this->description = $description; return $this; }

    public function getSex(): string { return $this->sex; }
    public function setSex(string $sex): static { $this->sex = $sex; return $this; }

    public function getBirthdate(): ?\DateTimeInterface { return $this->birthdate; }
    public function setBirthdate(?\DateTimeInterface $birthdate): static { $this->birthdate = $birthdate; return $this; }

    public function getPrice(): string { return $this->price; }
    public function setPrice(string $price): static { $this->price = $price; return $this; }

    public function getStatus(): string { return $this->status; }
    public function setStatus(string $status): static { $this->status = $status; return $this; }

    public function isPublic(): bool { return $this->status === 'published'; }

    public function getCity(): string { return $this->city; }
    public function setCity(string $city): static { $this->city = $city; return $this; }

    public function getPostalCode(): string { return $this->postalCode; }
    public function setPostalCode(string $postalCode): static { $this->postalCode = $postalCode; return $this; }

    public function getLatitude(): ?string { return $this->latitude; }
    public function setLatitude(?string $latitude): static { $this->latitude = $latitude; return $this; }

    public function getLongitude(): ?string { return $this->longitude; }
    public function setLongitude(?string $longitude): static { $this->longitude = $longitude; return $this; }

    public function getRegion(): ?string { return $this->region; }
    public function setRegion(?string $region): static { $this->region = $region; return $this; }

    public function getDepartment(): ?string { return $this->department; }
    public function setDepartment(?string $department): static { $this->department = $department; return $this; }

    public function getDepartmentCode(): ?string { return $this->departmentCode; }
    public function setDepartmentCode(?string $departmentCode): static { $this->departmentCode = $departmentCode; return $this; }

    public function getPublishedAt(): ?\DateTimeInterface { return $this->publishedAt; }
    public function setPublishedAt(?\DateTimeInterface $publishedAt): static { $this->publishedAt = $publishedAt; return $this; }

    public function getCreatedAt(): \DateTimeInterface { return $this->createdAt; }
    public function getUpdatedAt(): \DateTimeInterface { return $this->updatedAt; }
    public function setUpdatedAt(\DateTimeInterface $updatedAt): static { $this->updatedAt = $updatedAt; return $this; }

    public function getMedia(): Collection { return $this->media; }
    public function getDocuments(): Collection { return $this->documents; }
    public function getReservations(): Collection { return $this->reservations; }
    public function getFavoritedBy(): Collection { return $this->favoritedBy; }
}
