<?php

namespace App\DTO\Contact;

use App\Entity\ContactMessage;
use Symfony\Component\Validator\Constraints as Assert;

class CreateContactDTO
{
    #[Assert\NotBlank(message: 'Veuillez indiquer votre nom.')]
    #[Assert\Length(min: 2, max: 80)]
    public string $name = '';

    #[Assert\NotBlank(message: 'Email requis.')]
    #[Assert\Email(message: 'Email invalide.')]
    public string $email = '';

    #[Assert\NotBlank(message: 'Veuillez choisir un sujet.')]
    #[Assert\Choice(choices: ContactMessage::SUBJECTS, message: 'Sujet invalide.')]
    public string $subject = '';

    #[Assert\NotBlank(message: 'Le message est requis.')]
    #[Assert\Length(min: 20, max: 2000, minMessage: 'Votre message doit faire au moins {{ limit }} caractères.')]
    public string $message = '';
}
