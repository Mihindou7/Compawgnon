<?php

namespace App\DTO\User;

use Symfony\Component\Validator\Constraints as Assert;

class ChangePasswordDTO
{
    public ?string $currentPassword = null;

    #[Assert\NotBlank]
    #[Assert\Length(min: 8)]
    #[Assert\Regex(pattern: '/[A-Z]/', message: 'Password must contain at least one uppercase letter.')]
    #[Assert\Regex(pattern: '/[0-9]/', message: 'Password must contain at least one digit.')]
    public string $newPassword = '';

    #[Assert\NotBlank]
    public string $newPasswordConfirm = '';
}
