<?php

namespace App\DTO\Contact;

use Symfony\Component\Validator\Constraints as Assert;

class ReplyContactDTO
{
    #[Assert\NotBlank(message: 'Le message de réponse est requis.')]
    #[Assert\Length(min: 10, max: 5000, minMessage: 'La réponse doit faire au moins {{ limit }} caractères.')]
    public string $message = '';
}
