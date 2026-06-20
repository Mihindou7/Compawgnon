<?php

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: 'users')]
#[ORM\Index(columns: ['status'], name: 'idx_users_status')]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'bigint')]
    private ?int $id = null;

    #[ORM\Column(length: 180, unique: true)]
    #[Assert\NotBlank]
    #[Assert\Email]
    private string $email;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $passwordHash = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $firstName = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $lastName = null;

    #[ORM\Column(length: 30, nullable: true)]
    private ?string $phone = null;

    #[ORM\Column(length: 500, nullable: true)]
    private ?string $avatarUrl = null;

    #[ORM\Column(type: 'json')]
    private array $roles = [];

    #[ORM\Column(length: 20)]
    #[Assert\Choice(choices: ['active', 'disabled'])]
    private string $status = 'active';

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeInterface $emailVerifiedAt = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeInterface $lastLoginAt = null;

    #[ORM\Column(length: 64, nullable: true, unique: true)]
    private ?string $emailVerificationToken = null;

    #[ORM\Column(length: 64, nullable: true)]
    private ?string $resetPasswordToken = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeInterface $resetPasswordTokenExpiresAt = null;

    #[ORM\Column(type: 'datetime_immutable')]
    #[Assert\NotNull]
    private \DateTimeInterface $termsAcceptedAt;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeInterface $createdAt;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeInterface $updatedAt;

    #[ORM\OneToOne(mappedBy: 'user', targetEntity: Seller::class, cascade: ['persist'])]
    private ?Seller $seller = null;

    #[ORM\OneToMany(mappedBy: 'user', targetEntity: UserAuthProvider::class, cascade: ['persist', 'remove'])]
    private Collection $authProviders;

    #[ORM\OneToMany(mappedBy: 'user', targetEntity: Favorite::class, cascade: ['remove'])]
    private Collection $favorites;

    public function __construct()
    {
        $this->authProviders = new ArrayCollection();
        $this->favorites = new ArrayCollection();
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;
        return $this;
    }

    public function getUserIdentifier(): string
    {
        return $this->email;
    }

    public function getRoles(): array
    {
        $roles = $this->roles;
        $roles[] = 'ROLE_USER';
        return array_unique($roles);
    }

    public function setRoles(array $roles): static
    {
        $this->roles = $roles;
        return $this;
    }

    public function getPassword(): ?string
    {
        return $this->passwordHash;
    }

    public function getPasswordHash(): ?string
    {
        return $this->passwordHash;
    }

    public function setPasswordHash(?string $passwordHash): static
    {
        $this->passwordHash = $passwordHash;
        return $this;
    }

    public function eraseCredentials(): void {}

    public function getFirstName(): ?string { return $this->firstName; }
    public function setFirstName(?string $firstName): static { $this->firstName = $firstName; return $this; }

    public function getLastName(): ?string { return $this->lastName; }
    public function setLastName(?string $lastName): static { $this->lastName = $lastName; return $this; }

    public function getPhone(): ?string { return $this->phone; }
    public function setPhone(?string $phone): static { $this->phone = $phone; return $this; }

    public function getAvatarUrl(): ?string { return $this->avatarUrl; }
    public function setAvatarUrl(?string $avatarUrl): static { $this->avatarUrl = $avatarUrl; return $this; }

    public function getStatus(): string { return $this->status; }
    public function setStatus(string $status): static { $this->status = $status; return $this; }

    public function isActive(): bool { return $this->status === 'active'; }

    public function getEmailVerifiedAt(): ?\DateTimeInterface { return $this->emailVerifiedAt; }
    public function setEmailVerifiedAt(?\DateTimeInterface $emailVerifiedAt): static { $this->emailVerifiedAt = $emailVerifiedAt; return $this; }

    public function getLastLoginAt(): ?\DateTimeInterface { return $this->lastLoginAt; }
    public function setLastLoginAt(?\DateTimeInterface $lastLoginAt): static { $this->lastLoginAt = $lastLoginAt; return $this; }

    public function isEmailVerified(): bool { return $this->emailVerifiedAt !== null; }

    public function getEmailVerificationToken(): ?string { return $this->emailVerificationToken; }
    public function setEmailVerificationToken(?string $token): static { $this->emailVerificationToken = $token; return $this; }

    public function getResetPasswordToken(): ?string { return $this->resetPasswordToken; }
    public function setResetPasswordToken(?string $token): static { $this->resetPasswordToken = $token; return $this; }

    public function getResetPasswordTokenExpiresAt(): ?\DateTimeInterface { return $this->resetPasswordTokenExpiresAt; }
    public function setResetPasswordTokenExpiresAt(?\DateTimeInterface $dt): static { $this->resetPasswordTokenExpiresAt = $dt; return $this; }

    public function getTermsAcceptedAt(): \DateTimeInterface { return $this->termsAcceptedAt; }
    public function setTermsAcceptedAt(\DateTimeInterface $termsAcceptedAt): static { $this->termsAcceptedAt = $termsAcceptedAt; return $this; }

    public function getCreatedAt(): \DateTimeInterface { return $this->createdAt; }
    public function getUpdatedAt(): \DateTimeInterface { return $this->updatedAt; }
    public function setUpdatedAt(\DateTimeInterface $updatedAt): static { $this->updatedAt = $updatedAt; return $this; }

    public function getSeller(): ?Seller { return $this->seller; }
    public function getAuthProviders(): Collection { return $this->authProviders; }
    public function getFavorites(): Collection { return $this->favorites; }
}
