<?php

namespace App\Entity;

use App\Repository\ConversationRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ConversationRepository::class)]
#[ORM\Table(name: 'conversations')]
#[ORM\UniqueConstraint(name: 'uq_conv_animal_buyer', columns: ['animal_id', 'buyer_id'])]
#[ORM\Index(columns: ['buyer_id'], name: 'idx_conv_buyer')]
#[ORM\Index(columns: ['seller_id'], name: 'idx_conv_seller')]
#[ORM\Index(columns: ['last_message_at'], name: 'idx_conv_last_msg')]
class Conversation
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'bigint')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Animal::class)]
    #[ORM\JoinColumn(nullable: false)]
    private Animal $animal;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private User $buyer;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private User $seller;

    #[ORM\Column(length: 20)]
    private string $status = 'open';

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeInterface $lastMessageAt = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeInterface $createdAt;

    #[ORM\OneToMany(mappedBy: 'conversation', targetEntity: Message::class, cascade: ['persist', 'remove'])]
    #[ORM\OrderBy(['createdAt' => 'ASC'])]
    private Collection $messages;

    public function __construct()
    {
        $this->messages  = new ArrayCollection();
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getAnimal(): Animal { return $this->animal; }
    public function setAnimal(Animal $animal): static { $this->animal = $animal; return $this; }

    public function getBuyer(): User { return $this->buyer; }
    public function setBuyer(User $buyer): static { $this->buyer = $buyer; return $this; }

    public function getSeller(): User { return $this->seller; }
    public function setSeller(User $seller): static { $this->seller = $seller; return $this; }

    public function getStatus(): string { return $this->status; }
    public function setStatus(string $status): static { $this->status = $status; return $this; }

    public function getLastMessageAt(): ?\DateTimeInterface { return $this->lastMessageAt; }
    public function setLastMessageAt(?\DateTimeInterface $dt): static { $this->lastMessageAt = $dt; return $this; }

    public function getCreatedAt(): \DateTimeInterface { return $this->createdAt; }

    public function getMessages(): Collection { return $this->messages; }

    public function hasParticipant(User $user): bool
    {
        return $this->buyer->getId() === $user->getId()
            || $this->seller->getId() === $user->getId();
    }

    public function getUnreadCountFor(User $user): int
    {
        return $this->messages->filter(
            fn(Message $m) => $m->getSender()->getId() !== $user->getId() && !$m->isRead()
        )->count();
    }
}
