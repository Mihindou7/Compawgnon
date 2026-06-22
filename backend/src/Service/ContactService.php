<?php

namespace App\Service;

use App\DTO\Contact\CreateContactDTO;
use App\Entity\ContactMessage;
use App\Entity\User;
use App\Repository\ContactMessageRepository;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;

class ContactService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly ContactMessageRepository $repo,
        private readonly MailService $mail,
        private readonly AuditService $audit,
        private readonly LoggerInterface $logger,
    ) {
    }

    public function create(CreateContactDTO $dto, ?string $ipAddress = null): ContactMessage
    {
        $contact = new ContactMessage();
        $contact->setName(trim($dto->name));
        $contact->setEmail(strtolower(trim($dto->email)));
        $contact->setSubject($dto->subject);
        $contact->setMessage(trim($dto->message));
        $contact->setStatus('new');
        $contact->setIpAddress($ipAddress);

        $this->em->persist($contact);
        $this->em->flush();

        // Accusé de réception — best effort, ne doit pas bloquer la soumission.
        try {
            $this->mail->sendContactAcknowledgement($contact->getEmail(), $contact->getName());
        } catch (\Throwable $e) {
            $this->logger->error('Contact acknowledgement email failed: ' . $e->getMessage());
        }

        return $contact;
    }

    public function updateStatus(ContactMessage $contact, string $status, User $admin): void
    {
        $old = $contact->getStatus();
        if ($old === $status) {
            return;
        }

        $contact->setStatus($status);
        $contact->setUpdatedAt(new \DateTimeImmutable());

        if (in_array($status, ['in_progress', 'resolved'], true)) {
            $contact->setHandledBy($admin);
            if ($status === 'resolved') {
                $contact->setHandledAt(new \DateTimeImmutable());
            }
        }

        $this->em->flush();

        $this->audit->log(
            'contact.status_changed',
            'ContactMessage',
            $contact->getId(),
            $admin,
            ['status' => $old],
            ['status' => $status],
        );
    }

    public function reply(ContactMessage $contact, string $message, User $admin): void
    {
        try {
            $this->mail->sendContactReply($contact->getEmail(), [
                'name'            => $contact->getName(),
                'original_subject' => $contact->getSubject(),
                'original_message' => $contact->getMessage(),
                'reply_message'   => $message,
            ]);
        } catch (\Throwable $e) {
            $this->logger->error('Contact reply email failed: ' . $e->getMessage());
            throw new \DomainException("L'envoi de l'email de réponse a échoué. Veuillez réessayer.", 502);
        }

        $contact->setAdminReply($message);
        $contact->setStatus('resolved');
        $contact->setHandledBy($admin);
        $contact->setHandledAt(new \DateTimeImmutable());
        $contact->setUpdatedAt(new \DateTimeImmutable());

        $this->em->flush();

        $this->audit->log(
            'contact.replied',
            'ContactMessage',
            $contact->getId(),
            $admin,
            [],
            ['status' => 'resolved'],
        );
    }

    public function delete(ContactMessage $contact, User $admin): void
    {
        $id = $contact->getId();

        $this->em->remove($contact);
        $this->em->flush();

        $this->audit->log('contact.deleted', 'ContactMessage', $id, $admin);
    }
}
