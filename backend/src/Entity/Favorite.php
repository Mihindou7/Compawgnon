<?php

namespace App\Entity;

use App\Repository\FavoriteRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: FavoriteRepository::class)]
#[ORM\Table(name: 'favorites')]
#[ORM\UniqueConstraint(name: 'uniq_favorite_user_animal', columns: ['user_id', 'animal_id'])]
class Favorite
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'bigint')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'favorites')]
    #[ORM\JoinColumn(nullable: false)]
    private User $user;

    #[ORM\ManyToOne(targetEntity: Animal::class, inversedBy: 'favoritedBy')]
    #[ORM\JoinColumn(nullable: false)]
    private Animal $animal;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeInterface $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getUser(): User { return $this->user; }
    public function setUser(User $user): static { $this->user = $user; return $this; }

    public function getAnimal(): Animal { return $this->animal; }
    public function setAnimal(Animal $animal): static { $this->animal = $animal; return $this; }

    public function getCreatedAt(): \DateTimeInterface { return $this->createdAt; }
}
