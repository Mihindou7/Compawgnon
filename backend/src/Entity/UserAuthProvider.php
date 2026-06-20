<?php

namespace App\Entity;

use App\Repository\UserAuthProviderRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: UserAuthProviderRepository::class)]
#[ORM\Table(name: 'user_auth_providers')]
#[ORM\UniqueConstraint(name: 'uniq_provider_user', columns: ['provider', 'provider_user_id'])]
#[ORM\UniqueConstraint(name: 'uniq_user_provider', columns: ['user_id', 'provider'])]
class UserAuthProvider
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'bigint')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'authProviders')]
    #[ORM\JoinColumn(nullable: false)]
    private User $user;

    #[ORM\Column(length: 50)]
    #[Assert\NotBlank]
    private string $provider;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    private string $providerUserId;

    #[ORM\Column(length: 180, nullable: true)]
    private ?string $providerEmail = null;

    #[ORM\Column(type: 'boolean')]
    private bool $providerEmailVerified = false;

    #[ORM\Column(length: 180, nullable: true)]
    private ?string $displayName = null;

    #[ORM\Column(length: 500, nullable: true)]
    private ?string $avatarUrl = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $accessTokenHash = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $refreshTokenEncrypted = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeInterface $linkedAt;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeInterface $lastUsedAt = null;

    public function __construct()
    {
        $this->linkedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getUser(): User { return $this->user; }
    public function setUser(User $user): static { $this->user = $user; return $this; }

    public function getProvider(): string { return $this->provider; }
    public function setProvider(string $provider): static { $this->provider = $provider; return $this; }

    public function getProviderUserId(): string { return $this->providerUserId; }
    public function setProviderUserId(string $providerUserId): static { $this->providerUserId = $providerUserId; return $this; }

    public function getProviderEmail(): ?string { return $this->providerEmail; }
    public function setProviderEmail(?string $providerEmail): static { $this->providerEmail = $providerEmail; return $this; }

    public function isProviderEmailVerified(): bool { return $this->providerEmailVerified; }
    public function setProviderEmailVerified(bool $providerEmailVerified): static { $this->providerEmailVerified = $providerEmailVerified; return $this; }

    public function getDisplayName(): ?string { return $this->displayName; }
    public function setDisplayName(?string $displayName): static { $this->displayName = $displayName; return $this; }

    public function getAvatarUrl(): ?string { return $this->avatarUrl; }
    public function setAvatarUrl(?string $avatarUrl): static { $this->avatarUrl = $avatarUrl; return $this; }

    public function getAccessTokenHash(): ?string { return $this->accessTokenHash; }
    public function setAccessTokenHash(?string $accessTokenHash): static { $this->accessTokenHash = $accessTokenHash; return $this; }

    public function getRefreshTokenEncrypted(): ?string { return $this->refreshTokenEncrypted; }
    public function setRefreshTokenEncrypted(?string $refreshTokenEncrypted): static { $this->refreshTokenEncrypted = $refreshTokenEncrypted; return $this; }

    public function getLinkedAt(): \DateTimeInterface { return $this->linkedAt; }

    public function getLastUsedAt(): ?\DateTimeInterface { return $this->lastUsedAt; }
    public function setLastUsedAt(?\DateTimeInterface $lastUsedAt): static { $this->lastUsedAt = $lastUsedAt; return $this; }
}
