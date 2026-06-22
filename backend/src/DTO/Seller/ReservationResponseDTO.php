<?php

namespace App\DTO\Seller;

use Symfony\Component\Validator\Constraints as Assert;

class ReservationResponseDTO
{
    #[Assert\Length(max: 500)]
    public ?string $sellerResponse = null;
}
