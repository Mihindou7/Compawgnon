<?php

namespace App\DTO\Auth;

use Symfony\Component\Validator\Constraints as Assert;

class ForgotPasswordDTO
{
    #[Assert\NotBlank]
    #[Assert\Email]
    public string $email = '';
}
