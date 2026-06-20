<?php

namespace App\DTO\Auth;

use Symfony\Component\Validator\Constraints as Assert;

class ResetPasswordDTO
{
    #[Assert\NotBlank]
    public string $token = '';

    #[Assert\NotBlank]
    #[Assert\Length(min: 8)]
    #[Assert\Regex(pattern: '/[A-Z]/', message: 'Password must contain at least one uppercase letter.')]
    #[Assert\Regex(pattern: '/[0-9]/', message: 'Password must contain at least one digit.')]
    public string $password = '';

    #[Assert\NotBlank]
    public string $passwordConfirm = '';
}
