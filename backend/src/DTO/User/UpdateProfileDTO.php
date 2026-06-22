<?php

namespace App\DTO\User;

use Symfony\Component\Validator\Constraints as Assert;

class UpdateProfileDTO
{
    #[Assert\Length(max: 100)]
    public ?string $firstName = null;

    #[Assert\Length(max: 100)]
    public ?string $lastName = null;

    #[Assert\Length(max: 30)]
    public ?string $phone = null;
}
