<?php

namespace App\DTO\Reservation;

use Symfony\Component\Validator\Constraints as Assert;

class CreateReservationDTO
{
    #[Assert\NotNull]
    #[Assert\Positive]
    public int $animalId = 0;

    #[Assert\Length(max: 500)]
    public ?string $message = null;
}
