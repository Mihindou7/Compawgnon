<?php

namespace App\Entity;

use App\Repository\ReviewRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: ReviewRepository::class)]
#[ORM\Table(name: 'reviews')]
#[ORM\Index(columns: ['seller_id', 'status'], name: 'idx_reviews_seller')]
class Review
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'bigint')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Seller::class)]
    #[ORM\JoinColumn(nullable: false)]
    private Seller $seller;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private User $buyer;

    #[ORM\OneToOne(inversedBy: 'review', targetEntity: Reservation::class)]
    #[ORM\JoinColumn(nullable: false, unique: true)]
    private Reservation $reservation;

    #[ORM\Column(type: 'smallint')]
    #[Assert\NotNull]
    #[Assert\Range(min: 1, max: 5)]
    private int $rating;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $comment = null;

    #[ORM\Column(length: 20)]
    #[Assert\Choice(choices: ['pending', 'published', 'hidden'])]
    private string $status = 'pending';

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

    public function getSeller(): Seller { return $this->seller; }
    public function setSeller(Seller $seller): static { $this->seller = $seller; return $this; }

    public function getBuyer(): User { return $this->buyer; }
    public function setBuyer(User $buyer): static { $this->buyer = $buyer; return $this; }

    public function getReservation(): Reservation { return $this->reservation; }
    public function setReservation(Reservation $reservation): static { $this->reservation = $reservation; return $this; }

    public function getRating(): int { return $this->rating; }
    public function setRating(int $rating): static { $this->rating = $rating; return $this; }

    public function getComment(): ?string { return $this->comment; }
    public function setComment(?string $comment): static { $this->comment = $comment; return $this; }

    public function getStatus(): string { return $this->status; }
    public function setStatus(string $status): static { $this->status = $status; return $this; }

    public function getCreatedAt(): \DateTimeInterface { return $this->createdAt; }
    public function getUpdatedAt(): \DateTimeInterface { return $this->updatedAt; }
    public function setUpdatedAt(\DateTimeInterface $updatedAt): static { $this->updatedAt = $updatedAt; return $this; }
}
