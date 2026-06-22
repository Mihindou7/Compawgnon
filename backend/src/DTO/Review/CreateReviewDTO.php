<?php

namespace App\DTO\Review;

use Symfony\Component\Validator\Constraints as Assert;

class CreateReviewDTO
{
    #[Assert\NotNull]
    #[Assert\Positive]
    public int $reservationId = 0;

    #[Assert\NotNull]
    #[Assert\Range(min: 1, max: 5)]
    public int $rating = 5;

    #[Assert\Length(max: 1000)]
    public ?string $comment = null;
}
