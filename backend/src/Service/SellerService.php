<?php

namespace App\Service;

use App\DTO\Seller\SellerApplyDTO;
use App\DTO\Seller\SellerUpdateDTO;
use App\Entity\Seller;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

class SellerService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly MailService $mailService,
        private readonly AuditService $audit,
    ) {
    }

    public function apply(User $user, SellerApplyDTO $dto): Seller
    {
        if (!$user->isEmailVerified()) {
            throw new \DomainException('Email verification required.', 403);
        }

        $existing = $user->getSeller();
        if ($existing !== null && in_array($existing->getVerifiedStatus(), ['pending', 'approved'], true)) {
            throw new \DomainException('A seller application is already pending or approved.', 409);
        }

        $seller = new Seller();
        $seller->setUser($user);
        $seller->setName($dto->name);
        $seller->setType($dto->type);
        $seller->setSiret($dto->siret);
        $seller->setCity($dto->city);
        $seller->setPostalCode($dto->postalCode);
        $seller->setAddress($dto->address);
        $seller->setDescription($dto->description);
        $seller->setLatitude($dto->latitude);
        $seller->setLongitude($dto->longitude);
        $seller->setVerifiedStatus('pending');

        $this->em->persist($seller);
        $this->em->flush();

        return $seller;
    }

    public function update(Seller $seller, SellerUpdateDTO $dto): Seller
    {
        if ($dto->name !== null)        $seller->setName($dto->name);
        if ($dto->type !== null)        $seller->setType($dto->type);
        if ($dto->siret !== null)       $seller->setSiret($dto->siret);
        if ($dto->address !== null)     $seller->setAddress($dto->address);
        if ($dto->city !== null)        $seller->setCity($dto->city);
        if ($dto->postalCode !== null)  $seller->setPostalCode($dto->postalCode);
        if ($dto->description !== null) $seller->setDescription($dto->description);
        if ($dto->logoUrl !== null)     $seller->setLogoUrl($dto->logoUrl);

        if ($seller->getVerifiedStatus() === 'rejected') {
            $seller->setVerifiedStatus('pending');
            $seller->setRejectionReason(null);
        }

        $seller->setUpdatedAt(new \DateTimeImmutable());
        $this->em->flush();

        return $seller;
    }

    public function approve(Seller $seller, User $admin): void
    {
        $seller->setVerifiedStatus('approved');
        $seller->setRejectionReason(null);
        $seller->setUpdatedAt(new \DateTimeImmutable());

        $user   = $seller->getUser();
        $roles  = array_unique(array_merge($user->getRoles(), ['ROLE_SELLER']));
        $user->setRoles(array_values($roles));

        $this->em->flush();

        $this->mailService->sendSellerApproved($user->getEmail(), $seller->getName());
        $this->audit->log('seller.approved', 'Seller', $seller->getId(), $admin,
            ['verified_status' => 'pending'], ['verified_status' => 'approved']);
    }

    public function reject(Seller $seller, User $admin, ?string $reason): void
    {
        $seller->setVerifiedStatus('rejected');
        $seller->setRejectionReason($reason);
        $seller->setUpdatedAt(new \DateTimeImmutable());
        $this->em->flush();

        $this->mailService->sendSellerRejected($seller->getUser()->getEmail(), $seller->getName(), $reason);
        $this->audit->log('seller.rejected', 'Seller', $seller->getId(), $admin,
            ['verified_status' => 'pending'], ['verified_status' => 'rejected', 'reason' => $reason]);
    }
}
