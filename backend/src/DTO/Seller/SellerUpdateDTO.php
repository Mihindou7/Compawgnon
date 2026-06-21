<?php

namespace App\DTO\Seller;

use Symfony\Component\Validator\Constraints as Assert;

class SellerUpdateDTO
{
    #[Assert\Length(max: 180)]
    public ?string $name = null;

    #[Assert\Choice(choices: ['breeder', 'pet_shop'])]
    public ?string $type = null;

    #[Assert\Length(min: 14, max: 14, exactMessage: 'SIRET must be 14 digits.')]
    public ?string $siret = null;

    public ?string $address   = null;
    public ?string $city      = null;
    public ?string $postalCode = null;
    public ?string $description = null;
    public ?string $logoUrl   = null;
}
