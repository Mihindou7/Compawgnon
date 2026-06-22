<?php

namespace App\Tests\Unit\Entity;

use App\Entity\User;
use PHPUnit\Framework\TestCase;

class UserTest extends TestCase
{
    public function testStatutParDefautEstActive(): void
    {
        $user = new User();
        $this->assertSame('active', $user->getStatus());
    }

    public function testIsActiveRetourneTrueParDefaut(): void
    {
        $user = new User();
        $this->assertTrue($user->isActive());
    }

    public function testIsActiveRetourneFalseSiDisabled(): void
    {
        $user = new User();
        $user->setStatus('disabled');
        $this->assertFalse($user->isActive());
    }

    public function testIsEmailVerifiedRetourneFalseSansDate(): void
    {
        $user = new User();
        $this->assertFalse($user->isEmailVerified());
    }

    public function testIsEmailVerifiedRetourneTrueAvecDate(): void
    {
        $user = new User();
        $user->setEmailVerifiedAt(new \DateTimeImmutable());
        $this->assertTrue($user->isEmailVerified());
    }

    public function testGetRolesInclusToujoursRoleUser(): void
    {
        $user = new User();
        $this->assertContains('ROLE_USER', $user->getRoles());
    }

    public function testGetRolesSansDoublons(): void
    {
        $user = new User();
        $user->setRoles(['ROLE_USER', 'ROLE_ADMIN']);
        $roles = $user->getRoles();
        $this->assertCount(count(array_unique($roles)), $roles);
    }

    public function testGetUserIdentifierRetourneEmail(): void
    {
        $user = new User();
        $user->setEmail('test@example.com');
        $this->assertSame('test@example.com', $user->getUserIdentifier());
    }

    public function testSettersEmail(): void
    {
        $user = new User();
        $user->setEmail('naomi@compawgnon.fr');
        $this->assertSame('naomi@compawgnon.fr', $user->getEmail());
    }

    public function testCreatedAtEstImmutableALaCreation(): void
    {
        $user = new User();
        $this->assertInstanceOf(\DateTimeImmutable::class, $user->getCreatedAt());
    }

    public function testIdEstNullAvantPersistance(): void
    {
        $user = new User();
        $this->assertNull($user->getId());
    }

    public function testEraseCredentials(): void
    {
        $user = new User();
        $user->setPasswordHash('hashed_password');
        $user->eraseCredentials();
        $this->assertSame('hashed_password', $user->getPasswordHash());
    }
}
