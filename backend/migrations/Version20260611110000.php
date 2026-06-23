<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260611110000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create notifications table for in-app notifications';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE notifications (id BIGINT AUTO_INCREMENT NOT NULL, user_id BIGINT NOT NULL, type VARCHAR(50) NOT NULL, payload JSON NOT NULL, read_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, INDEX IDX_6000B0D3A76ED395 (user_id), INDEX idx_notif_user_unread (user_id, read_at), INDEX idx_notif_created (created_at), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE notifications ADD CONSTRAINT FK_6000B0D3A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE notifications DROP FOREIGN KEY FK_6000B0D3A76ED395');
        $this->addSql('DROP TABLE notifications');
    }
}
