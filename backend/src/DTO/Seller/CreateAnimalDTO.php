<?php

namespace App\DTO\Seller;

use Symfony\Component\Validator\Constraints as Assert;

class CreateAnimalDTO
{
    #[Assert\NotNull]
    #[Assert\Positive]
    public int $speciesId = 0;

    public ?int $breedId = null;

    #[Assert\NotBlank]
    #[Assert\Length(max: 180)]
    public string $title = '';

    #[Assert\NotBlank]
    #[Assert\Length(min: 80, minMessage: 'Description must be at least 80 characters.')]
    public string $description = '';

    #[Assert\NotBlank]
    #[Assert\Choice(choices: ['male', 'female', 'unknown'])]
    public string $sex = '';

    public ?string $birthdate = null;

    #[Assert\NotNull]
    #[Assert\PositiveOrZero]
    public float $price = 0;

    #[Assert\NotBlank]
    public string $city = '';

    #[Assert\NotBlank]
    public string $postalCode = '';

    public ?string $name = null;

    #[Assert\Type('float')]
    public ?float $latitude = null;

    #[Assert\Type('float')]
    public ?float $longitude = null;

    #[Assert\Length(max: 100)]
    public ?string $region = null;

    #[Assert\Length(max: 100)]
    public ?string $department = null;

    #[Assert\Length(max: 10)]
    public ?string $departmentCode = null;
}
