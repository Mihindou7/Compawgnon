<?php

namespace App\Document;

use App\Repository\ChatMessageRepository;
use Doctrine\ODM\MongoDB\Mapping\Annotations as ODM;

#[ODM\Document(collection: 'chat_messages', repositoryClass: ChatMessageRepository::class)]
#[ODM\Index(keys: ['conversationId' => 1, 'createdAt' => 1], name: 'idx_msg_conv')]
#[ODM\Index(keys: ['conversationId' => 1, 'senderId' => 1, 'readAt' => 1], name: 'idx_msg_unread')]
class ChatMessage
{
    #[ODM\Id]
    private ?string $id = null;

    #[ODM\Field(type: 'int')]
    private int $conversationId;

    #[ODM\Field(type: 'int')]
    private int $senderId;

    #[ODM\Field(type: 'string')]
    private string $content;

    #[ODM\Field(type: 'date', nullable: true)]
    private ?\DateTime $readAt = null;

    #[ODM\Field(type: 'date')]
    private \DateTime $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
    }

    public function getId(): ?string { return $this->id; }

    public function getConversationId(): int { return $this->conversationId; }
    public function setConversationId(int $id): static { $this->conversationId = $id; return $this; }

    public function getSenderId(): int { return $this->senderId; }
    public function setSenderId(int $id): static { $this->senderId = $id; return $this; }

    public function getContent(): string { return $this->content; }
    public function setContent(string $content): static { $this->content = $content; return $this; }

    public function getReadAt(): ?\DateTime { return $this->readAt; }
    public function setReadAt(?\DateTime $dt): static { $this->readAt = $dt; return $this; }

    public function isRead(): bool { return $this->readAt !== null; }

    public function getCreatedAt(): \DateTime { return $this->createdAt; }
}
