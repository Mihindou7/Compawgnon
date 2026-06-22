<?php

namespace App\Entity;

use App\Repository\ReservationRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: ReservationRepository::class)]
#[ORM\Table(name: 'reservations')]
#[ORM\Index(columns: ['buyer_id', 'status'], name: 'idx_reservations_buyer')]
#[ORM\Index(columns: ['seller_id', 'status'], name: 'idx_reservations_seller')]
class Reservation
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'bigint')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Animal::class, inversedBy: 'reservations')]
    #[ORM\JoinColumn(nullable: false)]
    private Animal $animal;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private User $buyer;

    #[ORM\ManyToOne(targetEntity: Seller::class)]
    #[ORM\JoinColumn(nullable: false)]
    private Seller $seller;

    #[ORM\Column(length: 20)]
    #[Assert\Choice(choices: ['pending', 'accepted', 'rejected', 'cancelled', 'expired', 'completed'])]
    private string $status = 'pending';

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $message = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $sellerResponse = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeInterface $expiresAt = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeInterface $createdAt;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeInterface $updatedAt;

    #[ORM\OneToOne(mappedBy: 'reservation', targetEntity: Review::class)]
    private ?Review $review = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getAnimal(): Animal { return $this->animal; }
    public function setAnimal(Animal $animal): static { $this->animal = $animal; return $this; }

    public function getBuyer(): User { return $this->buyer; }
    public function setBuyer(User $buyer): static { $this->buyer = $buyer; return $this; }

    public function getSeller(): Seller { return $this->seller; }
    public function setSeller(Seller $seller): static { $this->seller = $seller; return $this; }

    public function getStatus(): string { return $this->status; }
    public function setStatus(string $status): static { $this->status = $status; return $this; }

    public function getMessage(): ?string { return $this->message; }
    public function setMessage(?string $message): static { $this->message = $message; return $this; }

    public function getSellerResponse(): ?string { return $this->sellerResponse; }
    public function setSellerResponse(?string $sellerResponse): static { $this->sellerResponse = $sellerResponse; return $this; }

    public function getExpiresAt(): ?\DateTimeInterface { return $this->expiresAt; }
    public function setExpiresAt(?\DateTimeInterface $expiresAt): static { $this->expiresAt = $expiresAt; return $this; }

    public function getCreatedAt(): \DateTimeInterface { return $this->createdAt; }
    public function getUpdatedAt(): \DateTimeInterface { return $this->updatedAt; }
    public function setUpdatedAt(\DateTimeInterface $updatedAt): static { $this->updatedAt = $updatedAt; return $this; }

    public function getReview(): ?Review { return $this->review; }
}
