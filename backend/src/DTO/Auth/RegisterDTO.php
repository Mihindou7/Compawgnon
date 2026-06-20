<?php

namespace App\DTO\Auth;

use App\Validator\UniqueEmail;
use Symfony\Component\Validator\Constraints as Assert;

class RegisterDTO
{
    #[Assert\NotBlank(message: 'Email is required.')]
    #[Assert\Email(message: 'Invalid email address.')]
    #[UniqueEmail]
    public string $email = '';

    #[Assert\NotBlank(message: 'Password is required.')]
    #[Assert\Length(min: 8, minMessage: 'Password must be at least 8 characters.')]
    #[Assert\Regex(pattern: '/[A-Z]/', message: 'Password must contain at least one uppercase letter.')]
    #[Assert\Regex(pattern: '/[0-9]/', message: 'Password must contain at least one digit.')]
    public string $password = '';

    #[Assert\Length(max: 100)]
    public ?string $firstName = null;

    #[Assert\Length(max: 100)]
    public ?string $lastName = null;

    #[Assert\NotNull(message: 'You must accept the terms and conditions.')]
    #[Assert\IsTrue(message: 'You must accept the terms and conditions.')]
    public ?bool $termsAccepted = null;
}
