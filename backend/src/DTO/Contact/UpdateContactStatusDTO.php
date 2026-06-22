<?php

namespace App\DTO\Contact;

use App\Entity\ContactMessage;
use Symfony\Component\Validator\Constraints as Assert;

class UpdateContactStatusDTO
{
    #[Assert\NotBlank]
    #[Assert\Choice(choices: ContactMessage::STATUSES, message: 'Statut invalide.')]
    public string $status = '';
}
