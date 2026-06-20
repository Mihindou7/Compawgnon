<?php

namespace App\Service;

use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Twig\Environment;

class MailService
{
    public function __construct(
        private readonly MailerInterface $mailer,
        private readonly Environment $twig,
        private readonly string $fromAddress,
        private readonly string $fromName,
    ) {
    }

    private function send(string $to, string $subject, string $template, array $context = []): void
    {
        $html = $this->twig->render("emails/{$template}.html.twig", $context);

        $email = (new Email())
            ->from(sprintf('%s <%s>', $this->fromName, $this->fromAddress))
            ->to($to)
            ->subject($subject)
            ->html($html);

        $this->mailer->send($email);
    }

    public function sendVerificationEmail(string $to, string $verificationUrl): void
    {
        $this->send($to, 'Vérifiez votre adresse email', 'auth/verify_email', [
            'verification_url' => $verificationUrl,
            'expires_in'       => '1 heure',
        ]);
    }

    public function sendPasswordResetEmail(string $to, string $resetUrl): void
    {
        $this->send($to, 'Réinitialisation de votre mot de passe', 'auth/reset_password', [
            'reset_url'  => $resetUrl,
            'expires_in' => '1 heure',
        ]);
    }

    public function sendReservationCreated(string $sellerEmail, array $context): void
    {
        $this->send($sellerEmail, 'Nouvelle demande de réservation', 'reservation/created', $context);
    }

    public function sendReservationAccepted(string $buyerEmail, array $context): void
    {
        $this->send($buyerEmail, 'Votre réservation a été acceptée', 'reservation/accepted', $context);
    }

    public function sendReservationRejected(string $buyerEmail, array $context): void
    {
        $this->send($buyerEmail, "Votre réservation n'a pas été retenue", 'reservation/rejected', $context);
    }

    public function sendReservationCancelled(string $sellerEmail, array $context): void
    {
        $this->send($sellerEmail, 'Une réservation a été annulée', 'reservation/cancelled', $context);
    }

    public function sendSellerApproved(string $to, string $sellerName): void
    {
        $this->send($to, 'Votre compte vendeur a été approuvé', 'seller/approved', [
            'seller_name' => $sellerName,
        ]);
    }

    public function sendSellerRejected(string $to, string $sellerName, ?string $reason): void
    {
        $this->send($to, "Votre demande vendeur n'a pas été acceptée", 'seller/rejected', [
            'seller_name'      => $sellerName,
            'rejection_reason' => $reason,
        ]);
    }

    public function sendAnimalPublished(string $to, string $animalTitle): void
    {
        $this->send($to, 'Votre annonce est en ligne', 'animal/published', [
            'animal_title' => $animalTitle,
        ]);
    }

    public function sendAnimalRejected(string $to, string $animalTitle, ?string $reason): void
    {
        $this->send($to, "Votre annonce n'a pas été publiée", 'animal/rejected', [
            'animal_title'     => $animalTitle,
            'rejection_reason' => $reason,
        ]);
    }

    public function sendReservationCompleted(string $buyerEmail, array $context): void
    {
        $this->send($buyerEmail, 'Votre achat est finalisé — laissez un avis !', 'reservation/completed', $context);
    }

    public function sendContactAcknowledgement(string $to, string $name): void
    {
        $this->send($to, 'Nous avons bien reçu votre message', 'contact/acknowledgement', [
            'name' => $name,
        ]);
    }

    public function sendContactReply(string $to, array $context): void
    {
        $this->send($to, 'Réponse à votre demande — Compawgnon', 'contact/reply', $context);
    }
}
