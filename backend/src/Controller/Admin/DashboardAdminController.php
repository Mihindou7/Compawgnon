<?php

namespace App\Controller\Admin;

use App\Controller\AbstractApiController;
use App\Repository\AnimalRepository;
use App\Repository\ContactMessageRepository;
use App\Repository\ReviewRepository;
use App\Repository\SellerRepository;
use App\Repository\UserRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/dashboard')]
#[IsGranted('ROLE_ADMIN')]
class DashboardAdminController extends AbstractApiController
{
    #[Route('', methods: ['GET'])]
    public function dashboard(
        UserRepository $userRepo,
        SellerRepository $sellerRepo,
        AnimalRepository $animalRepo,
        ReviewRepository $reviewRepo,
        ContactMessageRepository $contactRepo,
    ): JsonResponse {
        $sevenDaysAgo = new \DateTimeImmutable('-7 days');

        $totalUsers    = $userRepo->count([]);
        $activeUsers   = $userRepo->count(['status' => 'active']);
        $disabledUsers = $userRepo->count(['status' => 'disabled']);

        $newUsersLast7 = (int) $userRepo->createQueryBuilder('u')
            ->select('COUNT(u.id)')
            ->where('u.createdAt >= :date')
            ->setParameter('date', $sevenDaysAgo)
            ->getQuery()->getSingleScalarResult();

        $totalSellers    = $sellerRepo->count([]);
        $approvedSellers = $sellerRepo->count(['verifiedStatus' => 'approved']);
        $pendingSellers  = $sellerRepo->count(['verifiedStatus' => 'pending']);
        $rejectedSellers = $sellerRepo->count(['verifiedStatus' => 'rejected']);

        $publishedAnimals      = $animalRepo->count(['status' => 'published']);
        $pendingReviewAnimals  = $animalRepo->count(['status' => 'pending_review']);
        $reservedAnimals       = $animalRepo->count(['status' => 'reserved']);
        $soldAnimals           = $animalRepo->count(['status' => 'sold']);

        $pendingReviews   = $reviewRepo->count(['status' => 'pending']);
        $publishedReviews = $reviewRepo->count(['status' => 'published']);
        $hiddenReviews    = $reviewRepo->count(['status' => 'hidden']);

        $contactCounts = $contactRepo->countByStatus();
        $newContacts   = $contactCounts['new'] ?? 0;

        return $this->success([
            'users' => [
                'total'            => $totalUsers,
                'active'           => $activeUsers,
                'disabled'         => $disabledUsers,
                'new_last_7_days'  => $newUsersLast7,
            ],
            'sellers' => [
                'total'    => $totalSellers,
                'approved' => $approvedSellers,
                'pending'  => $pendingSellers,
                'rejected' => $rejectedSellers,
            ],
            'animals' => [
                'published'      => $publishedAnimals,
                'pending_review' => $pendingReviewAnimals,
                'reserved'       => $reservedAnimals,
                'sold'           => $soldAnimals,
            ],
            'reviews' => [
                'pending'   => $pendingReviews,
                'published' => $publishedReviews,
                'hidden'    => $hiddenReviews,
            ],
            'contacts' => [
                'new'         => $contactCounts['new'] ?? 0,
                'in_progress' => $contactCounts['in_progress'] ?? 0,
                'resolved'    => $contactCounts['resolved'] ?? 0,
                'archived'    => $contactCounts['archived'] ?? 0,
            ],
            'pending_actions' => [
                'sellers_to_validate'  => $pendingSellers,
                'animals_to_moderate'  => $pendingReviewAnimals,
                'reviews_to_moderate'  => $pendingReviews,
                'contacts_to_handle'   => $newContacts,
            ],
        ]);
    }
}
