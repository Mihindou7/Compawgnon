<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260610120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create contact_messages table for contact requests management';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE contact_messages (id BIGINT AUTO_INCREMENT NOT NULL, name VARCHAR(80) NOT NULL, email VARCHAR(180) NOT NULL, subject VARCHAR(30) NOT NULL, message LONGTEXT NOT NULL, status VARCHAR(20) NOT NULL, admin_reply LONGTEXT DEFAULT NULL, handled_at DATETIME DEFAULT NULL, ip_address VARCHAR(45) DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, handled_by_id BIGINT DEFAULT NULL, INDEX IDX_41278201FE65AF40 (handled_by_id), INDEX idx_contact_status (status), INDEX idx_contact_created (created_at), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE contact_messages ADD CONSTRAINT FK_41278201FE65AF40 FOREIGN KEY (handled_by_id) REFERENCES users (id) ON DELETE SET NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE contact_messages DROP FOREIGN KEY FK_41278201FE65AF40');
        $this->addSql('DROP TABLE contact_messages');
    }
}
