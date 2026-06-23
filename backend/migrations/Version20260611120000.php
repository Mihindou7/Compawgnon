<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260611120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create conversations and messages tables for buyer-seller messaging';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE conversations (id BIGINT AUTO_INCREMENT NOT NULL, animal_id BIGINT NOT NULL, buyer_id BIGINT NOT NULL, seller_id BIGINT NOT NULL, status VARCHAR(20) NOT NULL DEFAULT \'open\', last_message_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, INDEX IDX_8A8E26E98E962C16 (animal_id), INDEX IDX_8A8E26E96C755722 (buyer_id), INDEX IDX_8A8E26E98DE820D9 (seller_id), INDEX idx_conv_last_msg (last_message_at), UNIQUE INDEX uq_conv_animal_buyer (animal_id, buyer_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE messages (id BIGINT AUTO_INCREMENT NOT NULL, conversation_id BIGINT NOT NULL, sender_id BIGINT NOT NULL, content LONGTEXT NOT NULL, read_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, INDEX IDX_DB021E969AC0396 (conversation_id), INDEX IDX_DB021E96F624B39D (sender_id), INDEX idx_msg_conv (conversation_id, created_at), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE conversations ADD CONSTRAINT FK_8A8E26E98E962C16 FOREIGN KEY (animal_id) REFERENCES animals (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE conversations ADD CONSTRAINT FK_8A8E26E96C755722 FOREIGN KEY (buyer_id) REFERENCES users (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE conversations ADD CONSTRAINT FK_8A8E26E98DE820D9 FOREIGN KEY (seller_id) REFERENCES users (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE messages ADD CONSTRAINT FK_DB021E969AC0396 FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE messages ADD CONSTRAINT FK_DB021E96F624B39D FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE messages DROP FOREIGN KEY FK_DB021E969AC0396');
        $this->addSql('ALTER TABLE messages DROP FOREIGN KEY FK_DB021E96F624B39D');
        $this->addSql('ALTER TABLE conversations DROP FOREIGN KEY FK_8A8E26E98E962C16');
        $this->addSql('ALTER TABLE conversations DROP FOREIGN KEY FK_8A8E26E96C755722');
        $this->addSql('ALTER TABLE conversations DROP FOREIGN KEY FK_8A8E26E98DE820D9');
        $this->addSql('DROP TABLE messages');
        $this->addSql('DROP TABLE conversations');
    }
}
