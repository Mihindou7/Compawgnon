<?php

namespace App\DTO\Admin;

use Symfony\Component\Validator\Constraints as Assert;

class RejectDTO
{
    #[Assert\Length(max: 500)]
    public ?string $rejectionReason = null;
}
